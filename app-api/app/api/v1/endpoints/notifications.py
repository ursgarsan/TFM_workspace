from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db_session, require_patient
from app.models.notification import PushDevice
from app.models.user import User
from app.schemas.notification import PushDeviceRead, PushDeviceRegister

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.post("/devices/register", response_model=PushDeviceRead)
def register_push_device(
    payload: PushDeviceRegister,
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db_session),
) -> PushDevice:
    existing = db.scalar(select(PushDevice).where(PushDevice.expo_push_token == payload.expo_push_token))

    if existing:
        existing.user_id = current_user.id
        existing.platform = payload.platform
        existing.timezone = payload.timezone
        existing.is_active = True
        existing.last_seen_at = datetime.now(UTC)
        db.commit()
        db.refresh(existing)
        return existing

    device = PushDevice(
        user_id=current_user.id,
        expo_push_token=payload.expo_push_token,
        platform=payload.platform,
        timezone=payload.timezone,
        is_active=True,
        last_seen_at=datetime.now(UTC),
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


@router.post("/devices/deactivate", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_push_device(
    payload: PushDeviceRegister,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> None:
    device = db.scalar(
        select(PushDevice).where(
            PushDevice.expo_push_token == payload.expo_push_token,
            PushDevice.user_id == current_user.id,
        )
    )
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    device.is_active = False
    device.last_seen_at = datetime.now(UTC)
    db.commit()


@router.get("/devices/me", response_model=list[PushDeviceRead])
def list_my_devices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> list[PushDevice]:
    devices = db.scalars(
        select(PushDevice)
        .where(PushDevice.user_id == current_user.id)
        .order_by(PushDevice.id.desc())
    ).all()
    return list(devices)
