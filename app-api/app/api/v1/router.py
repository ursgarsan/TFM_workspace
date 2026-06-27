from fastapi import APIRouter

from app.api.v1.endpoints.assistant import router as assistant_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.intakes import router as intakes_router
from app.api.v1.endpoints.patients import router as patients_router
from app.api.v1.endpoints.treatments import router as treatments_router

router = APIRouter()
router.include_router(health_router)
router.include_router(auth_router)
router.include_router(patients_router)
router.include_router(treatments_router)
router.include_router(intakes_router)
router.include_router(assistant_router)
