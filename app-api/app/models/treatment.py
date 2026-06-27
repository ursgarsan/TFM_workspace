from datetime import UTC, date, datetime, time

from sqlalchemy import Date, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Treatment(Base):
    __tablename__ = "treatments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    medication_name: Mapped[str] = mapped_column(String(255))
    dosage: Mapped[str] = mapped_column(String(255))
    notes: Mapped[str | None] = mapped_column(Text(), nullable=True)
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    patient = relationship("User", back_populates="treatments", foreign_keys=[patient_id])
    created_by = relationship("User", back_populates="created_treatments", foreign_keys=[created_by_id])
    schedules = relationship("TreatmentSchedule", back_populates="treatment", cascade="all, delete-orphan")
    intakes = relationship("MedicationIntake", back_populates="treatment", cascade="all, delete-orphan")


class TreatmentSchedule(Base):
    __tablename__ = "treatment_schedules"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    treatment_id: Mapped[int] = mapped_column(ForeignKey("treatments.id"), index=True)
    time_of_day: Mapped[time] = mapped_column()
    frequency: Mapped[str] = mapped_column(String(50), default="daily")
    weekdays_csv: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    treatment = relationship("Treatment", back_populates="schedules")
