from .health import router as health_router
from .pipeline import router as pipeline_router
from .process import router as process_router
from .metrics import router as metrics_router
from .embeddings import router as embeddings_router
from .ai import router as ai_router
from .pifuhd import router as pifuhd_router

__all__ = [
    "health_router",
    "pipeline_router",
    "process_router",
    "metrics_router",
    "embeddings_router",
    "ai_router",
    "pifuhd_router",
]
