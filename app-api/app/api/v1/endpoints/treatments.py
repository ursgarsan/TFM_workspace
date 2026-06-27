from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user, get_db_session, require_professional
from app.models.treatment import Treatment, TreatmentSchedule
from app.models.user import User, UserRole
from app.schemas.treatment import (
    ScheduleCreate,
    ScheduleRead,
    ScheduleUpdate,
    TreatmentCreate,
    TreatmentRead,
    TreatmentUpdate,
)

router = APIRouter(prefix="/treatments", tags=["treatments"])


@router.get("/", response_model=list[TreatmentRead])
def list_treatments(
    patient_id: int | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> list[Treatment]:
    stmt = select(Treatment).options(selectinload(Treatment.schedules)).order_by(Treatment.id.desc())

    if current_user.role == UserRole.PATIENT:
        stmt = stmt.where(Treatment.patient_id == current_user.id)
    elif patient_id is not None:
        stmt = stmt.where(Treatment.patient_id == patient_id)

    return list(db.scalars(stmt).all())


@router.post("/", response_model=TreatmentRead, status_code=status.HTTP_201_CREATED)
def create_treatment(
    payload: TreatmentCreate,
    current_user: User = Depends(require_professional),
    db: Session = Depends(get_db_session),
) -> Treatment:
    patient = db.get(User, payload.patient_id)
    if not patient or patient.role != UserRole.PATIENT:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid patient")

    treatment = Treatment(
        patient_id=payload.patient_id,
        created_by_id=current_user.id,
        title=payload.title,
        medication_name=payload.medication_name,
        dosage=payload.dosage,
        notes=payload.notes,
        start_date=payload.start_date,
        end_date=payload.end_date,
    )
    db.add(treatment)
    db.commit()
    db.refresh(treatment)
    return treatment


@router.get("/{treatment_id}", response_model=TreatmentRead)
def get_treatment(
    treatment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> Treatment:
    treatment = db.scalar(
        select(Treatment)
        .options(selectinload(Treatment.schedules))
        .where(Treatment.id == treatment_id)
    )
    if not treatment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Treatment not found")

    if current_user.role == UserRole.PATIENT and treatment.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    return treatment


@router.patch("/{treatment_id}", response_model=TreatmentRead)
def update_treatment(
    treatment_id: int,
    payload: TreatmentUpdate,
    _: User = Depends(require_professional),
    db: Session = Depends(get_db_session),
) -> Treatment:
    treatment = db.get(Treatment, treatment_id)
    if not treatment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Treatment not found")

    # Keep explicit nulls so fields like notes/end_date can be cleared from UI.
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(treatment, field, value)

    db.commit()
    db.refresh(treatment)
    return treatment


@router.delete("/{treatment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_treatment(
    treatment_id: int,
    _: User = Depends(require_professional),
    db: Session = Depends(get_db_session),
) -> None:
    treatment = db.get(Treatment, treatment_id)
    if not treatment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Treatment not found")
    db.delete(treatment)
    db.commit()


@router.post("/{treatment_id}/schedules", response_model=ScheduleRead, status_code=status.HTTP_201_CREATED)
def add_schedule(
    treatment_id: int,
    payload: ScheduleCreate,
    _: User = Depends(require_professional),
    db: Session = Depends(get_db_session),
) -> TreatmentSchedule:
    treatment = db.get(Treatment, treatment_id)
    if not treatment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Treatment not found")

    schedule = TreatmentSchedule(
        treatment_id=treatment_id,
        time_of_day=payload.time_of_day,
        frequency=payload.frequency,
        weekdays_csv=payload.weekdays_csv,
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.get("/{treatment_id}/schedules", response_model=list[ScheduleRead])
def list_schedules(
    treatment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> list[TreatmentSchedule]:
    treatment = db.get(Treatment, treatment_id)
    if not treatment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Treatment not found")

    if current_user.role == UserRole.PATIENT and treatment.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    return list(
        db.scalars(
            select(TreatmentSchedule).where(TreatmentSchedule.treatment_id == treatment_id)
        ).all()
    )


@router.put("/{treatment_id}/schedules/{schedule_id}", response_model=ScheduleRead)
def update_schedule(
    treatment_id: int,
    schedule_id: int,
    payload: ScheduleUpdate,
    _: User = Depends(require_professional),
    db: Session = Depends(get_db_session),
) -> TreatmentSchedule:
    schedule = db.scalar(
        select(TreatmentSchedule).where(
            TreatmentSchedule.id == schedule_id,
            TreatmentSchedule.treatment_id == treatment_id,
        )
    )
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")

    schedule.time_of_day = payload.time_of_day
    schedule.frequency = payload.frequency
    schedule.weekdays_csv = payload.weekdays_csv

    db.commit()
    db.refresh(schedule)
    return schedule


@router.delete("/{treatment_id}/schedules/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule(
    treatment_id: int,
    schedule_id: int,
    _: User = Depends(require_professional),
    db: Session = Depends(get_db_session),
) -> None:
    schedule = db.scalar(
        select(TreatmentSchedule).where(
            TreatmentSchedule.id == schedule_id,
            TreatmentSchedule.treatment_id == treatment_id,
        )
    )
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")

    db.delete(schedule)
    db.commit()


@router.get("/my/reminders")
def reminders(
    day: date | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> list[dict[str, str | int | None]]:
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Patient role required")

    target_day = day or datetime.now().date()
    weekday = str(target_day.weekday() + 1)

    treatments = list(
        db.scalars(
            select(Treatment)
            .options(selectinload(Treatment.schedules))
            .where(Treatment.patient_id == current_user.id)
        ).all()
    )

    reminders_data: list[dict[str, str | int | None]] = []
    for treatment in treatments:
        for schedule in treatment.schedules:
            normalized_frequency = schedule.frequency.strip().lower()

            if normalized_frequency == "weekdays":
                if not schedule.weekdays_csv:
                    continue

                weekdays_tokens = [token.strip() for token in schedule.weekdays_csv.split(",") if token.strip()]
                if weekday not in weekdays_tokens:
                    continue

            if normalized_frequency == "weekly":
                treatment_weekday = str(treatment.start_date.weekday() + 1)
                if weekday != treatment_weekday:
                    continue

            reminders_data.append(
                {
                    "treatment_id": treatment.id,
                    "title": treatment.title,
                    "medication_name": treatment.medication_name,
                    "dosage": treatment.dosage,
                    "time_of_day": schedule.time_of_day.isoformat(),
                    "frequency": normalized_frequency,
                }
            )

    return reminders_data
