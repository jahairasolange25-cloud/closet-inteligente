import os
from contextlib import asynccontextmanager
from pathlib import Path

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .api import health_router, pipeline_router, process_router, metrics_router, embeddings_router
from .core.config import settings
from .core.logging import configure_logging
from .services.model_cache import model_cache

logger = structlog.get_logger(__name__)


def _ensure_dir(path: str, name: str) -> None:
    """Idempotent directory creation with clear error logging."""
    p = Path(path)
    try:
        p.mkdir(parents=True, exist_ok=True)
    except PermissionError:
        logger.error(
            "directory_permission_denied",
            directory=path,
            name=name,
            user=os.environ.get("USER", "unknown"),
            uid=os.geteuid(),
            parent_owner=oct(p.parent.stat().st_mode) if p.parent.exists() else "N/A",
        )
        raise
    logger.debug("directory_ready", directory=path, name=name)


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    _ensure_dir(settings.upload_dir, "upload_dir")
    _ensure_dir(settings.output_dir, "output_dir")
    _ensure_dir(settings.model_dir, "model_dir")

    await model_cache.warmup()

    logger.info(
        "service_starting",
        app=settings.app_name,
        version=settings.app_version,
        log_level=settings.log_level,
    )
    yield
    logger.info("service_shutdown")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(pipeline_router, prefix="/api/v1")
app.include_router(process_router, prefix="/api/v1")
app.include_router(metrics_router)
app.include_router(embeddings_router, prefix="/api/v1")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        "unhandled_exception",
        path=request.url.path,
        error=str(exc),
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)},
    )
