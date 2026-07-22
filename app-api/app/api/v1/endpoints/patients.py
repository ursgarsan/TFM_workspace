from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db_session, require_professional
from app.models.user import User, UserRole
from app.schemas.user import PatientCreate, UserRead, UserUpdate
from app.services.email import EmailDeliveryError, send_patient_welcome_email
from app.services.security import generate_temporary_password, hash_password
from app.services.users import delete_patient_account

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("/", response_model=list[UserRead])
def list_patients(
    _: User = Depends(require_professional),
    db: Session = Depends(get_db_session),
) -> list[User]:
    return list(db.scalars(select(User).where(User.role == UserRole.PATIENT).order_by(User.id.desc())).all())


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_patient(
    payload: PatientCreate,
    _: User = Depends(require_professional),
    db: Session = Depends(get_db_session),
) -> User:
    normalized_email = str(payload.email).strip().lower()
    existing = db.scalar(select(User).where(User.email == normalized_email))
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    full_name = payload.full_name.strip()
    if not full_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El nombre no puede estar vacío")

    temporary_password = generate_temporary_password()
    patient = User(
        email=normalized_email,
        full_name=full_name,
        password_hash=hash_password(temporary_password),
        role=UserRole.PATIENT,
        must_change_password=True,
    )
    db.add(patient)
    db.flush()
    try:
        send_patient_welcome_email(normalized_email, full_name, temporary_password)
    except EmailDeliveryError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    db.commit()
    db.refresh(patient)
    return patient


@router.get("/{patient_id}", response_model=UserRead)
def get_patient(
    patient_id: int,
    _: User = Depends(require_professional),
    db: Session = Depends(get_db_session),
) -> User:
    patient = db.get(User, patient_id)
    if not patient or patient.role != UserRole.PATIENT:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return patient


@router.patch("/{patient_id}", response_model=UserRead)
def update_patient(
    patient_id: int,
    payload: UserUpdate,
    _: User = Depends(require_professional),
    db: Session = Depends(get_db_session),
) -> User:
    patient = db.get(User, patient_id)
    if not patient or patient.role != UserRole.PATIENT:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(patient, field, value)

    db.commit()
    db.refresh(patient)
    return patient


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(
    patient_id: int,
    _: User = Depends(require_professional),
    db: Session = Depends(get_db_session),
) -> None:
    patient = db.get(User, patient_id)
    if not patient or patient.role != UserRole.PATIENT:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paciente no encontrado")
    delete_patient_account(db, patient)
