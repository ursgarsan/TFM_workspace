from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.intake import IntakeStatus


class IntakeCreate(BaseModel):
    treatment_id: int
    status: IntakeStatus
    scheduled_for: datetime | None = None
    reason: str | None = None
    note: str | None = None


class IntakeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    treatment_id: int
    patient_id: int
    status: IntakeStatus
    taken_at: datetime
    scheduled_for: datetime | None
    reason: str | None
    note: str | None
