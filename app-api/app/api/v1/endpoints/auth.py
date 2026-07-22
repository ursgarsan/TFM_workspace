from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db_session
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import PasswordChange, UserCreate, UserRead, UserSelfUpdate
from app.services.security import create_access_token, hash_password, verify_password
from app.services.users import delete_patient_account

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register/{role}", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_user(role: UserRole, payload: UserCreate, db: Session = Depends(get_db_session)) -> User:
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db_session)) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(str(user.id), expires_minutes=60 * 24)
    return TokenResponse(access_token=token, must_change_password=user.must_change_password)


@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.patch("/me", response_model=UserRead)
def update_me(
    payload: UserSelfUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> User:
    full_name = payload.full_name.strip()
    if not full_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El nombre no puede estar vacío")

    normalized_email = str(payload.email).strip().lower()
    email_owner = db.scalar(
        select(User).where(User.email == normalized_email, User.id != current_user.id)
    )
    if email_owner:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ese correo ya está en uso")

    current_user.full_name = full_name
    current_user.email = normalized_email
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/password", status_code=status.HTTP_204_NO_CONTENT)
def change_my_password(
    payload: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> None:
    if (
        len(payload.current_password.encode("utf-8")) > 72
        or not verify_password(payload.current_password, current_user.password_hash)
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual no es correcta",
        )
    if len(payload.new_password.encode("utf-8")) > 72:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña es demasiado larga",
        )
    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña debe ser diferente de la actual",
        )

    current_user.password_hash = hash_password(payload.new_password)
    current_user.must_change_password = False
    db.commit()


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> None:
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los pacientes pueden eliminar su cuenta desde la aplicación",
        )
    delete_patient_account(db, current_user)
