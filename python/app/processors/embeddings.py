import logging
from typing import Optional

from PIL import Image

from ..services.embedding_service import embedding_service

logger = logging.getLogger(__name__)


async def generate_garment_embedding(
    image: Image.Image,
    dominant_colors: Optional[list[str]] = None,
    category: Optional[str] = None,
    style_tags: Optional[list[str]] = None,
) -> dict:
    embedding = await embedding_service.generate_embedding(image)
    color_embedding = await embedding_service.generate_color_embedding(
        dominant_colors or []
    )
    style_embedding = await embedding_service.generate_style_embedding(
        category or "casual", style_tags or []
    )

    return {
        "embedding": embedding,
        "embedding_dimension": len(embedding),
        "color_embedding": color_embedding,
        "style_embedding": style_embedding,
        "model_version": "resnet50-v1",
    }


def compute_similarity(embedding_a: list[float], embedding_b: list[float]) -> float:
    import numpy as np

    a = np.array(embedding_a, dtype=float)
    b = np.array(embedding_b, dtype=float)
    if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
        return 0.0
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))
