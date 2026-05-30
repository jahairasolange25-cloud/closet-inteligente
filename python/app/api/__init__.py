from .health import router as health_router
from .pipeline import router as pipeline_router
from .process import router as process_router
from .metrics import router as metrics_router
from .embeddings import router as embeddings_router

__all__ = [
    "health_router",
    "pipeline_router",
    "process_router",
    "metrics_router",
    "embeddings_router",
]
