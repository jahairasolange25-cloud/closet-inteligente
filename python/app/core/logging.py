import logging

import structlog

from .config import settings

PIPELINE_CONTEXT_KEYS = {"pipeline_id", "garment_id", "stage", "duration_ms", "attempt"}


def configure_logging() -> None:
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.dev.ConsoleRenderer()
            if settings.debug
            else structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    root_logger = logging.getLogger()
    handler = logging.StreamHandler()
    fmt_cls = structlog.dev.ConsoleRenderer if settings.debug else structlog.processors.JSONRenderer
    handler.setFormatter(structlog.stdlib.ProcessorFormatter(processor=fmt_cls()))
    root_logger.addHandler(handler)
    root_logger.setLevel(settings.log_level)

    for lib in ("uvicorn", "uvicorn.access", "uvicorn.error"):
        logging.getLogger(lib).handlers.clear()
        logging.getLogger(lib).propagate = False
        lib_logger = logging.getLogger(lib)
        lib_logger.addHandler(handler)
        lib_logger.setLevel(settings.log_level)


def bind_pipeline_context(
    pipeline_id: str = "",
    garment_id: str = "",
    stage: str = "",
    duration_ms: float = 0.0,
    **extra: str,
) -> None:
    ctx = {
        "pipeline_id": pipeline_id,
        "garment_id": garment_id,
        "stage": stage,
        "duration_ms": duration_ms,
    }
    ctx.update(extra)
    cleaned = {k: v for k, v in ctx.items() if v or v == 0.0}
    structlog.contextvars.clear_contextvars()
    for k, v in cleaned.items():
        structlog.contextvars.bind_contextvars(**{k: v})
