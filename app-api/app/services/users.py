from sqlalchemy import delete, or_, select
from sqlalchemy.orm import Session

from app.models.assistant import AssistantQuery
from app.models.intake import MedicationIntake
from app.models.notification import PushDelivery, PushDevice
from app.models.treatment import Treatment, TreatmentSchedule
from app.models.user import User


def delete_patient_account(db: Session, patient: User) -> None:
    treatment_ids = select(Treatment.id).where(Treatment.patient_id == patient.id)

    db.execute(
        delete(PushDelivery).where(
            or_(PushDelivery.user_id == patient.id, PushDelivery.treatment_id.in_(treatment_ids))
        )
    )
    db.execute(delete(PushDevice).where(PushDevice.user_id == patient.id))
    db.execute(delete(AssistantQuery).where(AssistantQuery.user_id == patient.id))
    db.execute(delete(MedicationIntake).where(MedicationIntake.patient_id == patient.id))
    db.execute(delete(TreatmentSchedule).where(TreatmentSchedule.treatment_id.in_(treatment_ids)))
    db.execute(delete(Treatment).where(Treatment.patient_id == patient.id))
    db.execute(delete(User).where(User.id == patient.id))
    db.commit()
