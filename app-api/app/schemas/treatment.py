from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, field_validator, model_validator


def _normalize_frequency(raw_value: str) -> str:
    return raw_value.strip().lower()


def _normalize_weekdays_csv(raw_value: str | None) -> str | None:
    if raw_value is None:
        return None

    tokens: list[str] = []
    for part in raw_value.split(","):
        token = part.strip()
        if token in {"1", "2", "3", "4", "5", "6", "7"} and token not in tokens:
            tokens.append(token)

    if not tokens:
        return None

    return ",".join(sorted(tokens, key=int))


class ScheduleCreate(BaseModel):
    time_of_day: time
    frequency: str = "daily"
    weekdays_csv: str | None = None

    @field_validator("frequency", mode="before")
    @classmethod
    def validate_frequency(cls, value: str) -> str:
        if not isinstance(value, str):
            raise ValueError("frequency must be a string")

        normalized = _normalize_frequency(value)
        if normalized not in {"daily", "weekly", "weekdays"}:
            raise ValueError("frequency must be 'daily', 'weekly' or 'weekdays'")

        return normalized

    @field_validator("weekdays_csv", mode="before")
    @classmethod
    def normalize_weekdays_csv(cls, value: str | None) -> str | None:
        if value is not None and not isinstance(value, str):
            raise ValueError("weekdays_csv must be a comma-separated string")
        return _normalize_weekdays_csv(value)

    @model_validator(mode="after")
    def validate_weekly_days(self) -> "ScheduleCreate":
        if self.frequency == "weekdays" and not self.weekdays_csv:
            raise ValueError("weekdays_csv is required when frequency is weekdays")

        if self.frequency in {"daily", "weekly"}:
            self.weekdays_csv = None

        return self


class ScheduleUpdate(ScheduleCreate):
    pass


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
