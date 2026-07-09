import asyncio
import json
from datetime import UTC, datetime
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.notification import PushDelivery, PushDevice
from app.models.treatment import Treatment


def _normalize_timezone(timezone_name: str | None, fallback: str) -> str:
    if not timezone_name:
        return fallback
    try:
        ZoneInfo(timezone_name)
        return timezone_name
    except ZoneInfoNotFoundError:
        return fallback


def _matches_schedule_for_local_dt(*, frequency: str, weekdays_csv: str | None, local_dt: datetime) -> bool:
    normalized_frequency = frequency.strip().lower()
    if normalized_frequency == "daily":
        return True

    if normalized_frequency == "weekly":
        # ISO weekday in this project is stored as 1..7 based on start_date weekday + 1.
        return True

    if normalized_frequency == "weekdays":
        if not weekdays_csv:
            return False
        weekday = str(local_dt.date().weekday() + 1)
        tokens = [token.strip() for token in weekdays_csv.split(",") if token.strip()]
        return weekday in tokens

    return False


def _send_expo_push(*, to_token: str, title: str, body: str, data: dict[str, str]) -> bool:
    settings = get_settings()
    payload = {
        "to": to_token,
        "title": title,
        "body": body,
        "sound": "default",
        "priority": "high",
        "data": data,
    }

    request = Request(
        url=settings.push_expo_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=10) as response:  # nosec B310 - trusted Expo endpoint from settings
            status_ok = 200 <= response.status < 300
            return status_ok
    except (HTTPError, URLError, TimeoutError):
        return False


def dispatch_due_push_notifications(db: Session, now_utc: datetime | None = None) -> int:
    settings = get_settings()
    current_utc = now_utc or datetime.now(UTC)
    current_utc = current_utc.replace(second=0, microsecond=0)

    active_devices = list(
        db.scalars(
            select(PushDevice).where(PushDevice.is_active.is_(True))
        ).all()
    )
    if not active_devices:
        return 0

    tokens_by_user: dict[int, list[str]] = {}
    timezone_by_user: dict[int, str] = {}

    for device in active_devices:
        tokens_by_user.setdefault(device.user_id, []).append(device.expo_push_token)
        if device.user_id not in timezone_by_user:
            timezone_by_user[device.user_id] = _normalize_timezone(
                device.timezone,
                settings.push_default_timezone,
            )

    sent_count = 0

    for user_id, tokens in tokens_by_user.items():
        zone = ZoneInfo(timezone_by_user[user_id])
        local_now = current_utc.astimezone(zone)
        local_day = local_now.date()
        local_weekday = str(local_day.weekday() + 1)

        treatments = list(
            db.scalars(
                select(Treatment)
                .options(selectinload(Treatment.schedules))
                .where(Treatment.patient_id == user_id)
            ).all()
        )

        for treatment in treatments:
            if treatment.start_date > local_day:
                continue
            if treatment.end_date and treatment.end_date < local_day:
                continue

            for schedule in treatment.schedules:
                if schedule.time_of_day.hour != local_now.hour or schedule.time_of_day.minute != local_now.minute:
                    continue

                normalized_frequency = schedule.frequency.strip().lower()

                if normalized_frequency == "weekly":
                    treatment_weekday = str(treatment.start_date.weekday() + 1)
                    if treatment_weekday != local_weekday:
                        continue
                elif not _matches_schedule_for_local_dt(
                    frequency=normalized_frequency,
                    weekdays_csv=schedule.weekdays_csv,
                    local_dt=local_now,
                ):
                    continue

                local_due_at = datetime(
                    year=local_day.year,
                    month=local_day.month,
                    day=local_day.day,
                    hour=schedule.time_of_day.hour,
                    minute=schedule.time_of_day.minute,
                    tzinfo=zone,
                )
                due_at_utc = local_due_at.astimezone(UTC)

                delivery_exists = db.scalar(
                    select(PushDelivery).where(
                        PushDelivery.user_id == user_id,
                        PushDelivery.schedule_id == schedule.id,
                        PushDelivery.scheduled_at_utc == due_at_utc,
                    )
                )
                if delivery_exists:
                    continue

                title = "Recordatorio de medicacion"
                body = f"{treatment.medication_name} ({treatment.dosage}) - {schedule.time_of_day.strftime('%H:%M')}"

                delivered = False
                for token in tokens:
                    ok = _send_expo_push(
                        to_token=token,
                        title=title,
                        body=body,
                        data={
                            "treatment_id": str(treatment.id),
                            "schedule_id": str(schedule.id),
                            "type": "medication_reminder",
                        },
                    )
                    delivered = delivered or ok

                if delivered:
                    db.add(
                        PushDelivery(
                            user_id=user_id,
                            schedule_id=schedule.id,
                            treatment_id=treatment.id,
                            scheduled_at_utc=due_at_utc,
                        )
                    )
                    sent_count += 1

    if sent_count:
        db.commit()

    return sent_count


async def push_dispatcher_loop() -> None:
    settings = get_settings()
    while True:
        db = SessionLocal()
        try:
            dispatch_due_push_notifications(db)
        except Exception:
            db.rollback()
        finally:
            db.close()

        await asyncio.sleep(max(settings.push_tick_seconds, 10))
