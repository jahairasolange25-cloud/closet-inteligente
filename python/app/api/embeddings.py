import io
import structlog
from fastapi import APIRouter, HTTPException
from PIL import Image

from ..schemas import EmbeddingRequest, EmbeddingResponse
from ..services.embedding_service import embedding_service

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/embeddings", tags=["embeddings"])


@router.post("/generate", response_model=EmbeddingResponse)
async def generate_embedding(request: EmbeddingRequest):
    try:
        import httpx
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(request.image_url)
            resp.raise_for_status()
        image = Image.open(io.BytesIO(resp.content))
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not load image from URL: {e}",
        )

    embedding = await embedding_service.generate_embedding(image)

    color_embedding = await embedding_service.generate_color_embedding(
        request.dominant_colors or []
    )
    style_embedding = await embedding_service.generate_style_embedding(
        request.category or "casual",
        request.style_tags or [],
    )

    return EmbeddingResponse(
        embedding=embedding,
        dimension=len(embedding),
        color_embedding=color_embedding,
        style_embedding=style_embedding,
        model_version="resnet50-v1",
    )


@router.post("/similarity")
async def compute_similarity(
    embedding_a: list[float], embedding_b: list[float]
):
    score = await embedding_service.compute_similarity(embedding_a, embedding_b)
    return {"similarity": score}


@router.get("/health")
async def embeddings_health():
    return {
        "status": "ok",
        "service": "embeddings",
        "dimension": embedding_service.dimension,
        "model_loaded": embedding_service._model_loaded,
    }
