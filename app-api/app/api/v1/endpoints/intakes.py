from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db_session
from app.models.intake import MedicationIntake
from app.models.treatment import Treatment
from app.models.user import User, UserRole
from app.schemas.intake import IntakeCreate, IntakeRead

router = APIRouter(prefix="/intakes", tags=["intakes"])


@router.post("/", response_model=IntakeRead, status_code=status.HTTP_201_CREATED)
def create_intake(
    payload: IntakeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> MedicationIntake:
    treatment = db.get(Treatment, payload.treatment_id)
    if not treatment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Treatment not found")

    if current_user.role == UserRole.PATIENT and treatment.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    patient_id = treatment.patient_id if current_user.role == UserRole.PROFESSIONAL else current_user.id

    intake = MedicationIntake(
        treatment_id=payload.treatment_id,
        patient_id=patient_id,
        status=payload.status,
        scheduled_for=payload.scheduled_for,
        reason=payload.reason,
        note=payload.note,
    )
    db.add(intake)
    db.commit()
    db.refresh(intake)
    return intake


@router.get("/my", response_model=list[IntakeRead])
def my_intakes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> list[MedicationIntake]:
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Patient role required")

    return list(
        db.scalars(
            select(MedicationIntake)
            .where(MedicationIntake.patient_id == current_user.id)
            .order_by(MedicationIntake.taken_at.desc())
        ).all()
    )


@router.get("/patient/{patient_id}", response_model=list[IntakeRead])
def patient_intakes(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> list[MedicationIntake]:
    if current_user.role != UserRole.PROFESSIONAL:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Professional role required")

    return list(
        db.scalars(
            select(MedicationIntake)
            .where(MedicationIntake.patient_id == patient_id)
            .order_by(MedicationIntake.taken_at.desc())
        ).all()
    )
