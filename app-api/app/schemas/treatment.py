from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict


class ScheduleCreate(BaseModel):
    time_of_day: time
    frequency: str = "daily"
    weekdays_csv: str | None = None


class ScheduleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    time_of_day: time
    frequency: str
    weekdays_csv: str | None


class TreatmentCreate(BaseModel):
    patient_id: int
    title: str
    medication_name: str
    dosage: str
    notes: str | None = None
    start_date: date
    end_date: date | None = None


class TreatmentUpdate(BaseModel):
    title: str | None = None
    medication_name: str | None = None
    dosage: str | None = None
    notes: str | None = None
    start_date: date | None = None
    end_date: date | None = None


class TreatmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    created_by_id: int
    title: str
    medication_name: str
    dosage: str
    notes: str | None
    start_date: date
    end_date: date | None
    created_at: datetime
    updated_at: datetime
    schedules: list[ScheduleRead] = []
