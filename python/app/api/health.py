import os
import shutil
from pathlib import Path

import structlog
from fastapi import APIRouter

from ..core.config import settings
from ..core.metrics import metrics_collector
from ..schemas import HealthResponse
from ..services.model_cache import model_cache

logger = structlog.get_logger(__name__)

router = APIRouter(tags=["health"])


def _get_disk_usage(path: str) -> dict:
    """Return disk stats or zeros if the path doesn't exist yet."""
    p = Path(path)
    if not p.exists():
        return {"total_gb": 0.0, "free_gb": 0.0, "used_pct": 0.0}
    total, used, free = shutil.disk_usage(path)
    return {
        "total_gb": round(total / (1024**3), 1),
        "free_gb": round(free / (1024**3), 1),
        "used_pct": round((used / total) * 100, 1) if total > 0 else 0,
    }


@router.get("/health", response_model=HealthResponse)
async def health_check():
    import psutil  # lazy
    mem = psutil.virtual_memory()
    uptime_seconds = metrics_collector.uptime_seconds

    return HealthResponse(
        status="ok",
        version=settings.app_version,
        service=settings.app_name,
        uptime_seconds=round(uptime_seconds, 1),
        models=model_cache.model_info(),
        pipeline_config={
            "pipeline_timeout_seconds": settings.pipeline_timeout_seconds,
            "step_timeout_seconds": settings.step_timeout_seconds,
            "retry_max_attempts": settings.retry_max_attempts,
            "confidence_threshold": settings.confidence_threshold,
        },
        disk=_get_disk_usage(settings.upload_dir),
        memory={
            "total_gb": round(mem.total / (1024**3), 1),
            "available_gb": round(mem.available / (1024**3), 1),
            "used_pct": round(mem.percent, 1),
        },
    )
