from datetime import date, datetime, time, timedelta, UTC
from pathlib import Path
import sys

from sqlalchemy import select

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.intake import IntakeStatus, MedicationIntake
from app.models.treatment import Treatment, TreatmentSchedule
from app.models.user import User, UserRole
from app.services.security import hash_password

PRO_EMAIL = "pro@tfmapp.com"
PRO_PASS = "Pro12345!"

PATIENTS = [
    {
        "email": "paciente@tfmapp.com",
        "full_name": "Paciente Demo",
        "password": "Paciente123!",
    },
    {
        "email": "ana.lopez@tfmapp.com",
        "full_name": "Ana Lopez",
        "password": "Paciente123!",
    },
    {
        "email": "carlos.martin@tfmapp.com",
        "full_name": "Carlos Martin",
        "password": "Paciente123!",
    },
]

TREATMENT_BLUEPRINT = {
    "paciente@tfmapp.com": [
        {
            "title": "Control tension arterial",
            "medication_name": "Enalapril",
            "dosage": "10mg",
            "notes": "Tomar despues del desayuno",
            "schedules": [
                {"time": time(9, 0), "frequency": "daily", "weekdays_csv": None},
            ],
        },
        {
            "title": "Suplemento vitamina D",
            "medication_name": "Colecalciferol",
            "dosage": "1000 UI",
            "notes": "Con comida principal",
            "schedules": [
                {"time": time(14, 30), "frequency": "daily", "weekdays_csv": None},
            ],
        },
    ],
    "ana.lopez@tfmapp.com": [
        {
            "title": "Control glucosa",
            "medication_name": "Metformina",
            "dosage": "850mg",
            "notes": "Despues de desayuno y cena",
            "schedules": [
                {"time": time(8, 30), "frequency": "daily", "weekdays_csv": None},
                {"time": time(21, 0), "frequency": "daily", "weekdays_csv": None},
            ],
        },
    ],
    "carlos.martin@tfmapp.com": [
        {
            "title": "Dolor articular",
            "medication_name": "Ibuprofeno",
            "dosage": "400mg",
            "notes": "Solo si dolor moderado",
            "schedules": [
                {"time": time(10, 0), "frequency": "weekly", "weekdays_csv": "1,3,5"},
            ],
        },
    ],
}


def ensure_user(db, email: str, full_name: str, password: str, role: UserRole) -> User:
    user = db.scalar(select(User).where(User.email == email))
    if user:
        user.full_name = full_name
        user.role = role
        user.is_active = True
        user.password_hash = hash_password(password)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    user = User(
        email=email,
        full_name=full_name,
        password_hash=hash_password(password),
        role=role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def ensure_treatment(
    db,
    patient_id: int,
    professional_id: int,
    title: str,
    medication_name: str,
    dosage: str,
    notes: str | None,
) -> Treatment:
    treatment = db.scalar(
        select(Treatment).where(
            Treatment.patient_id == patient_id,
            Treatment.title == title,
        )
    )
    if treatment:
        treatment.medication_name = medication_name
        treatment.dosage = dosage
        treatment.notes = notes
        treatment.created_by_id = professional_id
        db.add(treatment)
        db.commit()
        db.refresh(treatment)
        return treatment

    treatment = Treatment(
        patient_id=patient_id,
        created_by_id=professional_id,
        title=title,
        medication_name=medication_name,
        dosage=dosage,
        notes=notes,
        start_date=date.today(),
        end_date=None,
    )
    db.add(treatment)
    db.commit()
    db.refresh(treatment)
    return treatment


def ensure_schedule(
    db,
    treatment_id: int,
    at_time: time,
    frequency: str,
    weekdays_csv: str | None,
) -> None:
    schedule = db.scalar(
        select(TreatmentSchedule).where(
            TreatmentSchedule.treatment_id == treatment_id,
            TreatmentSchedule.time_of_day == at_time,
            TreatmentSchedule.frequency == frequency,
            TreatmentSchedule.weekdays_csv == weekdays_csv,
        )
    )
    if schedule:
        return

    schedule = TreatmentSchedule(
        treatment_id=treatment_id,
        time_of_day=at_time,
        frequency=frequency,
        weekdays_csv=weekdays_csv,
    )
    db.add(schedule)
    db.commit()


def ensure_intake(
    db,
    treatment_id: int,
    patient_id: int,
    status: IntakeStatus,
    note: str,
    scheduled_for: datetime | None,
    reason: str | None,
) -> None:
    intake = db.scalar(
        select(MedicationIntake).where(
            MedicationIntake.treatment_id == treatment_id,
            MedicationIntake.patient_id == patient_id,
            MedicationIntake.note == note,
        )
    )
    if intake:
        return

    intake = MedicationIntake(
        treatment_id=treatment_id,
        patient_id=patient_id,
        status=status,
        reason=reason,
        note=note,
        scheduled_for=scheduled_for,
    )
    db.add(intake)
    db.commit()


def main() -> None:
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        professional = ensure_user(
            db,
            email=PRO_EMAIL,
            full_name="Profesional Demo",
            password=PRO_PASS,
            role=UserRole.PROFESSIONAL,
        )
        created_patients = []
        created_treatments = []

        for patient_data in PATIENTS:
            patient = ensure_user(
                db,
                email=patient_data["email"],
                full_name=patient_data["full_name"],
                password=patient_data["password"],
                role=UserRole.PATIENT,
            )
            created_patients.append(patient)

            for tx_data in TREATMENT_BLUEPRINT.get(patient.email, []):
                treatment = ensure_treatment(
                    db,
                    patient_id=patient.id,
                    professional_id=professional.id,
                    title=tx_data["title"],
                    medication_name=tx_data["medication_name"],
                    dosage=tx_data["dosage"],
                    notes=tx_data["notes"],
                )
                created_treatments.append(treatment)

                for schedule_data in tx_data["schedules"]:
                    ensure_schedule(
                        db,
                        treatment_id=treatment.id,
                        at_time=schedule_data["time"],
                        frequency=schedule_data["frequency"],
                        weekdays_csv=schedule_data["weekdays_csv"],
                    )

                ensure_intake(
                    db,
                    treatment_id=treatment.id,
                    patient_id=patient.id,
                    status=IntakeStatus.TAKEN,
                    note=f"Toma seed OK - {treatment.title}",
                    scheduled_for=datetime.now(UTC) - timedelta(hours=2),
                    reason=None,
                )
                ensure_intake(
                    db,
                    treatment_id=treatment.id,
                    patient_id=patient.id,
                    status=IntakeStatus.NOT_TAKEN,
                    note=f"Toma seed pendiente - {treatment.title}",
                    scheduled_for=datetime.now(UTC) - timedelta(days=1),
                    reason="olvido",
                )

        print("SEED_OK")
        print(f"PROFESSIONAL_EMAIL={PRO_EMAIL}")
        print(f"PROFESSIONAL_PASSWORD={PRO_PASS}")
        print(f"PATIENT_EMAIL={PATIENTS[0]['email']}")
        print(f"PATIENT_PASSWORD={PATIENTS[0]['password']}")
        print(f"PATIENTS_COUNT={len(created_patients)}")
        print(f"TREATMENTS_COUNT={len(created_treatments)}")


if __name__ == "__main__":
    main()
