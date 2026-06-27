from datetime import UTC, datetime
from enum import Enum

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class IntakeStatus(str, Enum):
    TAKEN = "taken"
    NOT_TAKEN = "not_taken"


class MedicationIntake(Base):
    __tablename__ = "medication_intakes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    treatment_id: Mapped[int] = mapped_column(ForeignKey("treatments.id"), index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    status: Mapped[IntakeStatus] = mapped_column(SAEnum(IntakeStatus, name="intake_status"))
    taken_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    scheduled_for: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    note: Mapped[str | None] = mapped_column(Text(), nullable=True)

    treatment = relationship("Treatment", back_populates="intakes")
    patient = relationship("User", back_populates="intakes")
