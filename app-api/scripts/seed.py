"""Carga un conjunto de datos ficticio, coherente y reproducible para desarrollo."""

from datetime import UTC, date, datetime, time, timedelta
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

PROFESSIONAL = {
    "email": "elena.ruiz@tfmapp.com",
    "legacy_email": "elena.ruiz@salud-demo.test",
    "full_name": "Dra. Elena Ruiz Navarro",
    "password": "Profesional2026!",
}
PATIENT_PASSWORD = "Paciente2026!"

# Todos los nombres, correos y historiales son ficticios y se usan solo en desarrollo.
PATIENTS = [
    {
        "email": "marta.soler@tfmapp.com",
        "legacy_email": "marta.soler@pacientes.test",
        "full_name": "Marta Soler García",
    },
    {
        "email": "javier.molina@tfmapp.com",
        "legacy_email": "javier.molina@pacientes.test",
        "full_name": "Javier Molina Pérez",
    },
    {
        "email": "carmen.ortega@tfmapp.com",
        "legacy_email": "carmen.ortega@pacientes.test",
        "full_name": "Carmen Ortega Vidal",
    },
    {
        "email": "diego.navarro@tfmapp.com",
        "legacy_email": "diego.navarro@pacientes.test",
        "full_name": "Diego Navarro León",
    },
    {
        "email": "lucia.romero@tfmapp.com",
        "legacy_email": "lucia.romero@pacientes.test",
        "full_name": "Lucía Romero Sáez",
    },
]

TREATMENT_BLUEPRINT = {
    "marta.soler@tfmapp.com": [
        {
            "title": "Control de hipertensión",
            "legacy_titles": ["Control tensión arterial", "Control tension arterial"],
            "medication_name": "Enalapril",
            "dosage": "10 mg",
            "notes": "Tomar con agua después del desayuno.",
            "start_days_ago": 120,
            "schedules": [{"time": time(8, 30), "frequency": "daily", "weekdays_csv": None}],
            "missed_days": {5},
        },
        {
            "title": "Protección cardiovascular",
            "legacy_titles": ["Suplemento vitamina D"],
            "medication_name": "Ácido acetilsalicílico",
            "dosage": "100 mg",
            "notes": "Tomar después de la comida; no tomar en ayunas.",
            "start_days_ago": 90,
            "schedules": [{"time": time(14, 0), "frequency": "daily", "weekdays_csv": None}],
            "missed_days": {9},
        },
    ],
    "javier.molina@tfmapp.com": [
        {
            "title": "Control de diabetes tipo 2",
            "legacy_titles": ["Control glucosa"],
            "medication_name": "Metformina",
            "dosage": "850 mg",
            "notes": "Tomar al terminar el desayuno y la cena.",
            "start_days_ago": 180,
            "schedules": [
                {"time": time(8, 0), "frequency": "daily", "weekdays_csv": None},
                {"time": time(21, 0), "frequency": "daily", "weekdays_csv": None},
            ],
            "missed_days": {3, 11},
        },
    ],
    "carmen.ortega@tfmapp.com": [
        {
            "title": "Control de hipotiroidismo",
            "medication_name": "Levotiroxina",
            "dosage": "75 µg",
            "notes": "Tomar en ayunas, 30 minutos antes del desayuno.",
            "start_days_ago": 240,
            "schedules": [{"time": time(7, 30), "frequency": "daily", "weekdays_csv": None}],
            "missed_days": set(),
        },
        {
            "title": "Suplementación de vitamina D",
            "medication_name": "Colecalciferol",
            "dosage": "25 000 UI",
            "notes": "Tomar los domingos con la comida principal.",
            "start_days_ago": 60,
            "schedules": [{"time": time(14, 30), "frequency": "weekdays", "weekdays_csv": "7"}],
            "missed_days": set(),
        },
    ],
    "diego.navarro@tfmapp.com": [
        {
            "title": "Control del colesterol",
            "legacy_titles": ["Dolor articular"],
            "medication_name": "Atorvastatina",
            "dosage": "20 mg",
            "notes": "Tomar por la noche, a la misma hora cada día.",
            "start_days_ago": 75,
            "schedules": [{"time": time(22, 0), "frequency": "daily", "weekdays_csv": None}],
            "missed_days": {2, 8},
        },
    ],
    "lucia.romero@tfmapp.com": [
        {
            "title": "Tratamiento de la anemia ferropénica",
            "medication_name": "Sulfato ferroso",
            "dosage": "325 mg",
            "notes": "Tomar separado al menos dos horas de café, té y lácteos.",
            "start_days_ago": 35,
            "schedules": [{"time": time(11, 0), "frequency": "daily", "weekdays_csv": None}],
            "missed_days": {6},
        },
    ],
}


def ensure_user(db, data: dict, role: UserRole, password: str) -> User:
    user = db.scalar(select(User).where(User.email == data["email"]))
    if user is None and data.get("legacy_email"):
        user = db.scalar(select(User).where(User.email == data["legacy_email"]))
    if user is None:
        user = User(email=data["email"], password_hash="", role=role)
    user.email = data["email"]
    user.full_name = data["full_name"]
    user.password_hash = hash_password(password)
    user.role = role
    user.is_active = True
    user.must_change_password = False
    db.add(user)
    db.flush()
    return user


def ensure_treatment(db, patient: User, professional: User, data: dict) -> Treatment:
    accepted_titles = [data["title"], *data.get("legacy_titles", [])]
    treatment = db.scalar(
        select(Treatment).where(
            Treatment.patient_id == patient.id,
            Treatment.title.in_(accepted_titles),
        )
    )
    if treatment is None:
        treatment = Treatment(patient_id=patient.id, title=data["title"])
    treatment.created_by_id = professional.id
    treatment.medication_name = data["medication_name"]
    treatment.dosage = data["dosage"]
    treatment.notes = data["notes"]
    treatment.start_date = date.today() - timedelta(days=data["start_days_ago"])
    treatment.end_date = None
    db.add(treatment)
    db.flush()
    # Retira únicamente las dos tomas sintéticas creadas por el seed anterior.
    legacy_intakes = db.scalars(
        select(MedicationIntake).where(
            MedicationIntake.treatment_id == treatment.id,
            MedicationIntake.note.like("Toma seed%"),
        )
    )
    for intake in legacy_intakes:
        db.delete(intake)
    return treatment


def sync_schedules(db, treatment: Treatment, schedule_data: list[dict]) -> list[TreatmentSchedule]:
    existing = list(db.scalars(select(TreatmentSchedule).where(TreatmentSchedule.treatment_id == treatment.id)))
    desired_keys = {(item["time"], item["frequency"], item["weekdays_csv"]) for item in schedule_data}
    for schedule in existing:
        key = (schedule.time_of_day, schedule.frequency, schedule.weekdays_csv)
        if key not in desired_keys:
            db.delete(schedule)

    result = []
    existing_keys = {(item.time_of_day, item.frequency, item.weekdays_csv): item for item in existing}
    for item in schedule_data:
        key = (item["time"], item["frequency"], item["weekdays_csv"])
        schedule = existing_keys.get(key)
        if schedule is None:
            schedule = TreatmentSchedule(
                treatment_id=treatment.id,
                time_of_day=item["time"],
                frequency=item["frequency"],
                weekdays_csv=item["weekdays_csv"],
            )
            db.add(schedule)
        result.append(schedule)
    return result


def schedule_applies(schedule: TreatmentSchedule, day: date) -> bool:
    if schedule.frequency == "daily":
        return True
    if schedule.frequency == "weekly":
        return day.weekday() == 0
    allowed_days = {int(value) for value in (schedule.weekdays_csv or "").split(",") if value}
    return day.isoweekday() in allowed_days


def sync_intake_history(
    db,
    patient: User,
    treatment: Treatment,
    schedules: list[TreatmentSchedule],
    missed_days: set[int],
    now: datetime,
) -> int:
    count = 0
    for days_ago in range(14, 0, -1):
        scheduled_day = now.date() - timedelta(days=days_ago)
        for schedule_index, schedule in enumerate(schedules):
            if not schedule_applies(schedule, scheduled_day):
                continue
            scheduled_for = datetime.combine(scheduled_day, schedule.time_of_day, tzinfo=UTC)
            intake = db.scalar(
                select(MedicationIntake).where(
                    MedicationIntake.patient_id == patient.id,
                    MedicationIntake.treatment_id == treatment.id,
                    MedicationIntake.scheduled_for == scheduled_for,
                )
            )
            if intake is None:
                intake = MedicationIntake(patient_id=patient.id, treatment_id=treatment.id)
            missed = days_ago in missed_days and schedule_index == 0
            intake.status = IntakeStatus.NOT_TAKEN if missed else IntakeStatus.TAKEN
            intake.reason = "Olvido al salir de casa" if missed else None
            intake.note = "Toma registrada desde la aplicación." if not missed else "No se realizó la toma."
            intake.scheduled_for = scheduled_for
            intake.taken_at = scheduled_for + timedelta(minutes=12 + ((days_ago * 7) % 24))
            db.add(intake)
            count += 1
    return count


def main() -> None:
    Base.metadata.create_all(bind=engine)
    now = datetime.now(UTC)
    with SessionLocal() as db:
        professional = ensure_user(db, PROFESSIONAL, UserRole.PROFESSIONAL, PROFESSIONAL["password"])
        treatment_count = 0
        intake_count = 0
        for patient_data in PATIENTS:
            patient = ensure_user(db, patient_data, UserRole.PATIENT, PATIENT_PASSWORD)
            for treatment_data in TREATMENT_BLUEPRINT[patient.email]:
                treatment = ensure_treatment(db, patient, professional, treatment_data)
                schedules = sync_schedules(db, treatment, treatment_data["schedules"])
                intake_count += sync_intake_history(
                    db, patient, treatment, schedules, treatment_data["missed_days"], now
                )
                treatment_count += 1
        db.commit()

    print("SEED_OK")
    print(f"PROFESSIONAL_EMAIL={PROFESSIONAL['email']}")
    print(f"PROFESSIONAL_PASSWORD={PROFESSIONAL['password']}")
    print(f"PATIENT_EMAIL={PATIENTS[0]['email']}")
    print(f"PATIENT_PASSWORD={PATIENT_PASSWORD}")
    print(f"PATIENTS_COUNT={len(PATIENTS)}")
    print(f"TREATMENTS_COUNT={treatment_count}")
    print(f"INTAKES_COUNT={intake_count}")


if __name__ == "__main__":
    main()
