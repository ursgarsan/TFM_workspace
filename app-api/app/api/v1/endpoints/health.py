from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, Request

from app.db.health import check_database_connection

router = APIRouter()


@router.get("/health/live")
def health_live() -> dict[str, str]:
    return {"status": "alive"}


@router.get("/health/ready")
def health_ready() -> dict[str, str]:
    try:
        check_database_connection()
    except RuntimeError:
        raise HTTPException(status_code=503, detail="database unavailable")

    return {"status": "ready", "database": "ok"}


@router.get("/health")
def health(request: Request) -> dict[str, str | float]:
    started_at: datetime = request.app.state.started_at
    now = datetime.now(UTC)
    uptime_seconds = (now - started_at).total_seconds()

    return {
        "status": "ok",
        "timestamp": now.isoformat(),
        "uptime_seconds": round(uptime_seconds, 3),
    }
