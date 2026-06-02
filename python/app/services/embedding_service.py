"""
Embedding service — cascade: CLIP (image, 512-dim) → ResNet50 → numpy fallback.
Text embeddings: MiniLM-L6-v2 (384-dim) → none.
"""

from __future__ import annotations

import asyncio
import logging
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    import numpy as np
    from PIL import Image

logger = logging.getLogger(__name__)


class EmbeddingService:
    def __init__(self) -> None:
        # ResNet50 fallback (kept for compatibility)
        self._resnet: Optional[object] = None
        self._resnet_processor: Optional[object] = None
        self._resnet_loaded: bool = False
        self._resnet_lock = asyncio.Lock()
        self.dimension: int = 512

    # ------------------------------------------------------------------ #
    # Image embeddings                                                     #
    # ------------------------------------------------------------------ #

    async def generate_embedding(self, image: Image.Image) -> list[float]:
        """
        Returns a 512-dim image embedding.
        Priority: CLIP local → ResNet50 → numpy fallback.
        """
        from .clip_service import clip_service

        # Tier 1 — CLIP (already lazy-loaded by clip_service)
        clip_vec = await clip_service.encode_image(image)
        if clip_vec is not None:
            return clip_vec

        # Tier 2 — ResNet50
        resnet_vec = await self._resnet_embedding(image)
        if resnet_vec is not None:
            return resnet_vec

        # Tier 3 — numpy pixel histogram
        return self._fallback_embedding(image)

    async def _resnet_embedding(self, image: Image.Image) -> Optional[list[float]]:
        await self._ensure_resnet_loaded()
        if self._resnet is None:
            return None
        try:
            import torch
            proc = self._resnet_processor
            input_tensor = proc(image.convert("RGB")).unsqueeze(0)
            if torch.cuda.is_available():
                input_tensor = input_tensor.cuda()
            with torch.no_grad():
                result = self._resnet(input_tensor)
                embedding = result.cpu().numpy().flatten()
            return embedding.tolist()
        except Exception as exc:
            logger.warning("ResNet embedding failed: %s", exc)
            return None

    async def _ensure_resnet_loaded(self) -> None:
        if self._resnet_loaded:
            return
        async with self._resnet_lock:
            if self._resnet_loaded:
                return
            try:
                import torch
                import torchvision.transforms as transforms
                from torchvision.models import resnet50, ResNet50_Weights

                logger.info("Loading ResNet50 embedding model…")
                weights = ResNet50_Weights.DEFAULT
                self._resnet = resnet50(weights=weights)
                self._resnet.eval()
                if torch.cuda.is_available():
                    self._resnet = self._resnet.cuda()
                self._resnet_processor = transforms.Compose([
                    transforms.Resize((224, 224)),
                    transforms.ToTensor(),
                    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
                ])
                logger.info("ResNet50 ready")
            except ImportError:
                logger.warning("torch/torchvision not installed, ResNet50 unavailable")
            except Exception as exc:
                logger.warning("ResNet50 load failed: %s", exc)
            finally:
                self._resnet_loaded = True

    def _fallback_embedding(self, image: Image.Image) -> list[float]:
        import numpy as np  # lazy
        img = image.convert("RGB").resize((32, 32))
        pixels = np.array(img).flatten().astype(float)
        pixels = (pixels - pixels.mean()) / (pixels.std() + 1e-8)
        bins = 512
        if len(pixels) > bins:
            indices = np.linspace(0, len(pixels) - 1, bins, dtype=int)
            return pixels[indices].tolist()
        result = np.zeros(bins)
        result[: len(pixels)] = pixels
        return result.tolist()

    # ------------------------------------------------------------------ #
    # Text embeddings (MiniLM)                                            #
    # ------------------------------------------------------------------ #

    async def generate_text_embedding(self, text: str) -> Optional[list[float]]:
        """
        Returns a 384-dim text embedding using all-MiniLM-L6-v2.
        Returns None if MiniLM is unavailable.
        """
        from .minilm_service import minilm_service
        return await minilm_service.encode(text)

    async def generate_garment_text_embedding(
        self,
        category: str,
        subcategory: Optional[str] = None,
        color: Optional[str] = None,
        style_tags: Optional[list[str]] = None,
        brand: Optional[str] = None,
        season: Optional[str] = None,
    ) -> Optional[list[float]]:
        """Build a rich text description and embed it with MiniLM."""
        from .minilm_service import minilm_service
        text = minilm_service.build_garment_text(category, subcategory, color, style_tags, brand, season)
        return await minilm_service.encode(text)

    # ------------------------------------------------------------------ #
    # Legacy helpers (unchanged — used by recommendation engine)          #
    # ------------------------------------------------------------------ #

    async def generate_color_embedding(self, hex_colors: list[str]) -> list[float]:
        embeddings: list[float] = []
        for hex_color in hex_colors[:5]:
            hex_color = hex_color.lstrip("#")
            if len(hex_color) != 6:
                continue
            r = int(hex_color[0:2], 16) / 255.0
            g = int(hex_color[2:4], 16) / 255.0
            b = int(hex_color[4:6], 16) / 255.0
            embeddings.extend([r, g, b])
        while len(embeddings) < 15:
            embeddings.append(0.0)
        return embeddings[:15]

    async def generate_style_embedding(
        self, category: str, style_tags: list[str]
    ) -> list[float]:
        style_map: dict[str, list[float]] = {
            "casual": [1.0, 0.0, 0.0, 0.0, 0.0],
            "formal": [0.0, 1.0, 0.0, 0.0, 0.0],
            "sporty": [0.0, 0.0, 1.0, 0.0, 0.0],
            "elegant": [0.0, 0.0, 0.0, 1.0, 0.0],
            "minimalist": [0.0, 0.0, 0.0, 0.0, 1.0],
        }
        base = style_map.get(category.lower(), [0.2, 0.2, 0.2, 0.2, 0.2])
        for tag in style_tags:
            if tag.lower() in style_map:
                tag_vec = style_map[tag.lower()]
                base = [(a + b) / 2 for a, b in zip(base, tag_vec)]
        return base

    async def compute_similarity(
        self, embedding_a: list[float], embedding_b: list[float]
    ) -> float:
        import numpy as np  # lazy
        a = np.array(embedding_a, dtype=float)
        b = np.array(embedding_b, dtype=float)
        if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
            return 0.0
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


embedding_service = EmbeddingService()
