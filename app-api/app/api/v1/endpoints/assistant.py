from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db_session
from app.models.assistant import AssistantQuery
from app.models.intake import MedicationIntake
from app.models.treatment import Treatment
from app.models.user import User
from app.schemas.assistant import AssistantQueryIn, AssistantQueryOut
from app.services.assistant import build_assistant_answer

router = APIRouter(prefix="/assistant", tags=["assistant"])


def _next_schedule_occurrence(schedule_time, frequency: str, weekdays_csv: str | None, now: datetime) -> datetime | None:
    candidate_today = now.replace(
        hour=schedule_time.hour,
        minute=schedule_time.minute,
        second=0,
        microsecond=0,
    )

    if frequency == "daily":
        return candidate_today if candidate_today >= now else candidate_today + timedelta(days=1)

    if frequency == "weekly" and weekdays_csv:
        weekdays: list[int] = []
        for raw in weekdays_csv.split(","):
            raw = raw.strip()
            if not raw.isdigit():
                continue
            weekdays.append((int(raw) - 1) % 7)

        weekdays = sorted(set(weekdays))
        if not weekdays:
            return None

        for delta in range(0, 8):
            candidate_day = (now + timedelta(days=delta)).replace(
                hour=schedule_time.hour,
                minute=schedule_time.minute,
                second=0,
                microsecond=0,
            )
            if candidate_day.weekday() in weekdays and candidate_day >= now:
                return candidate_day

    return None


def _build_clinical_context_for_user(db: Session, current_user: User) -> str:
    now = datetime.now(UTC)
    lines: list[str] = [
        f"Usuario: {current_user.full_name} ({current_user.role.value})",
    ]

    if current_user.role.value != "patient":
        lines.append("No es paciente; no se aplica contexto de tratamientos propios.")
        return "\n".join(lines)

    treatments = db.scalars(
        select(Treatment)
        .where(Treatment.patient_id == current_user.id)
        .order_by(Treatment.start_date.desc())
        .limit(8)
    ).all()

    if not treatments:
        lines.append("No hay tratamientos registrados para este paciente.")
        return "\n".join(lines)

    lines.append("Tratamientos:")
    treatment_title_by_id: dict[int, str] = {}
    upcoming_doses: list[str] = []

    for treatment in treatments:
        treatment_title = f"{treatment.title} ({treatment.medication_name} {treatment.dosage})"
        treatment_title_by_id[treatment.id] = treatment_title

        schedule_text = ", ".join(
            f"{schedule.time_of_day.strftime('%H:%M')} ({schedule.frequency})"
            for schedule in treatment.schedules
        )
        if not schedule_text:
            schedule_text = "sin horarios"

        lines.append(
            f"- {treatment.title}: {treatment.medication_name} {treatment.dosage}. "
            f"Horarios: {schedule_text}."
        )

        for schedule in treatment.schedules:
            next_at = _next_schedule_occurrence(schedule.time_of_day, schedule.frequency, schedule.weekdays_csv, now)
            if next_at is not None:
                upcoming_doses.append(
                    f"- {next_at.strftime('%Y-%m-%d %H:%M')} | {treatment_title}"
                )

    recent_intakes = db.scalars(
        select(MedicationIntake)
        .where(MedicationIntake.patient_id == current_user.id)
        .order_by(MedicationIntake.taken_at.desc())
        .limit(6)
    ).all()

    if recent_intakes:
        lines.append("Tomas recientes:")
        for intake in recent_intakes:
            treatment_label = treatment_title_by_id.get(intake.treatment_id, f"treatment_id={intake.treatment_id}")
            lines.append(
                f"- {intake.taken_at.strftime('%Y-%m-%d %H:%M')} | "
                f"{treatment_label} | estado={intake.status.value}"
            )

    intakes_7d = db.scalars(
        select(MedicationIntake)
        .where(
            MedicationIntake.patient_id == current_user.id,
            MedicationIntake.taken_at >= now - timedelta(days=7),
        )
        .order_by(MedicationIntake.taken_at.desc())
    ).all()

    if intakes_7d:
        taken_count = sum(1 for intake in intakes_7d if intake.status.value == "taken")
        not_taken_count = sum(1 for intake in intakes_7d if intake.status.value == "not_taken")
        total = len(intakes_7d)
        adherence_pct = round((taken_count / total) * 100, 1) if total else 0.0
        lines.append(
            "Adherencia ultimos 7 dias: "
            f"{taken_count} tomadas, {not_taken_count} no tomadas, total {total}, adherencia {adherence_pct}%."
        )

    if upcoming_doses:
        lines.append("Proximas dosis programadas:")
        for item in sorted(upcoming_doses)[:5]:
            lines.append(item)

    recent_queries = db.scalars(
        select(AssistantQuery)
        .where(AssistantQuery.user_id == current_user.id)
        .order_by(AssistantQuery.created_at.desc())
        .limit(3)
    ).all()

    if recent_queries:
        lines.append("Ultimas consultas al asistente:")
        for query in recent_queries:
            lines.append(f"- Q: {query.question}")

    return "\n".join(lines)


@router.post("/query", response_model=AssistantQueryOut)
def ask_assistant(
    payload: AssistantQueryIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> AssistantQueryOut:
    clinical_context = _build_clinical_context_for_user(db, current_user)
    answer, source = build_assistant_answer(payload.question, clinical_context)

    query = AssistantQuery(
        user_id=current_user.id,
        question=payload.question,
        answer=answer,
    )
    db.add(query)
    db.commit()

    return AssistantQueryOut(answer=answer, source=source, created_at=datetime.now(UTC))
