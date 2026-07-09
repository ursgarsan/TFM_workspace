from datetime import UTC, datetime
import asyncio
import contextlib

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import router as api_v1_router
from app.core.config import get_settings
from app.db.base import Base
from app.db.session import engine
from app.models import AssistantQuery, MedicationIntake, PushDelivery, PushDevice, Treatment, TreatmentSchedule, User
from app.services.push_notifications import push_dispatcher_loop

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    debug=settings.app_debug,
    version=settings.app_version,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.started_at = datetime.now(UTC)

app.include_router(api_v1_router, prefix=settings.api_v1_prefix)


@app.on_event("startup")
def startup_event() -> None:
    _ = (User, Treatment, TreatmentSchedule, MedicationIntake, AssistantQuery, PushDevice, PushDelivery)
    if settings.auto_create_tables:
        Base.metadata.create_all(bind=engine)

    if settings.push_notifications_enabled:
        app.state.push_dispatcher_task = asyncio.create_task(push_dispatcher_loop())


@app.on_event("shutdown")
async def shutdown_event() -> None:
    task = getattr(app.state, "push_dispatcher_task", None)
    if task:
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task


@app.get("/health", tags=["health"])
def legacy_health_check() -> dict[str, str]:
    return {"status": "ok"}
