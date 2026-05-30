import structlog
from fastapi import APIRouter, HTTPException, Query

from ..services.embedding_service import embedding_service

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/search", tags=["search"])


@router.post("/semantic")
async def semantic_search(
    query: str = Query(..., min_length=1, max_length=200),
    limit: int = Query(default=20, ge=1, le=100),
):
    try:
        dummy_embedding = [0.0] * embedding_service.dimension
        return {
            "query": query,
            "embedding": dummy_embedding,
            "dimension": embedding_service.dimension,
            "limit": limit,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def search_health():
    return {
        "status": "ok",
        "service": "semantic_search",
        "dimension": embedding_service.dimension,
    }
