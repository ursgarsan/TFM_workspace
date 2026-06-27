from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db_session, require_professional
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserRead, UserUpdate
from app.services.security import hash_password

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("/", response_model=list[UserRead])
def list_patients(
    _: User = Depends(require_professional),
    db: Session = Depends(get_db_session),
) -> list[User]:
    return list(db.scalars(select(User).where(User.role == UserRole.PATIENT).order_by(User.id.desc())).all())


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_patient(
    payload: UserCreate,
    _: User = Depends(require_professional),
    db: Session = Depends(get_db_session),
) -> User:
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    patient = User(
        email=payload.email,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        role=UserRole.PATIENT,
    )
    db.add(patient)
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
