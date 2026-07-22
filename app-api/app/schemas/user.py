from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.user import UserRole


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str


class PatientCreate(BaseModel):
    email: EmailStr
    full_name: str


class UserUpdate(BaseModel):
    full_name: str | None = None
    is_active: bool | None = None


class UserSelfUpdate(BaseModel):
    full_name: str
    email: EmailStr


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=72)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool
    must_change_password: bool
    created_at: datetime
