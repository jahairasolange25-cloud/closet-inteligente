"""
Text embedding service using all-MiniLM-L6-v2 (Tier 1 — local, free, unlimited).

Produces 384-dim sentence embeddings used for semantic garment search.
Falls back gracefully if sentence_transformers is not installed.
"""

import asyncio
import logging
from typing import Optional

logger = logging.getLogger(__name__)

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDING_DIM = 384


class MiniLMService:
    def __init__(self) -> None:
        self._model: Optional[object] = None
        self._loaded = False
        self._load_lock = asyncio.Lock()
        self._available = False

    async def _ensure_loaded(self) -> None:
        if self._loaded:
            return
        async with self._load_lock:
            if self._loaded:
                return
            try:
                from sentence_transformers import SentenceTransformer

                logger.info("Loading all-MiniLM-L6-v2…")
                self._model = SentenceTransformer(MODEL_NAME)
                self._available = True
                logger.info("MiniLM ready, dim=%d", EMBEDDING_DIM)
            except ImportError:
                logger.warning("sentence_transformers not installed — MiniLM disabled")
            except Exception as exc:
                logger.warning("MiniLM load failed: %s", exc)
            finally:
                self._loaded = True

    async def encode(self, text: str) -> Optional[list[float]]:
        """Encode a single text string to a 384-dim vector."""
        await self._ensure_loaded()
        if not self._available or self._model is None:
            return None
        try:
            loop = asyncio.get_event_loop()
            embedding = await loop.run_in_executor(
                None, lambda: self._model.encode(text, normalize_embeddings=True)  # type: ignore[union-attr]
            )
            return embedding.tolist()
        except Exception as exc:
            logger.error("MiniLM encode error: %s", exc)
            return None

    async def encode_batch(self, texts: list[str]) -> list[Optional[list[float]]]:
        """Encode multiple texts in one batch call."""
        await self._ensure_loaded()
        if not self._available or self._model is None:
            return [None] * len(texts)
        try:
            loop = asyncio.get_event_loop()
            embeddings = await loop.run_in_executor(
                None,
                lambda: self._model.encode(texts, normalize_embeddings=True, batch_size=32),  # type: ignore[union-attr]
            )
            return [e.tolist() for e in embeddings]
        except Exception as exc:
            logger.error("MiniLM encode_batch error: %s", exc)
            return [None] * len(texts)

    def build_garment_text(
        self,
        category: str,
        subcategory: Optional[str] = None,
        color: Optional[str] = None,
        style_tags: Optional[list[str]] = None,
        brand: Optional[str] = None,
        season: Optional[str] = None,
    ) -> str:
        """Build a rich natural-language description for a garment."""
        parts = []
        if subcategory:
            parts.append(subcategory)
        elif category:
            parts.append(category.replace("_", " "))
        if color:
            parts.append(f"color {color}")
        if brand:
            parts.append(f"brand {brand}")
        if season:
            parts.append(f"season {season}")
        if style_tags:
            parts.extend(style_tags[:3])
        return " ".join(parts) if parts else category

    @property
    def is_available(self) -> bool:
        return self._available

    @property
    def dimension(self) -> int:
        return EMBEDDING_DIM

    def model_info(self) -> dict:
        return {
            "minilm_available": self._available,
            "minilm_model": MODEL_NAME,
            "minilm_dim": EMBEDDING_DIM,
        }


minilm_service = MiniLMService()
