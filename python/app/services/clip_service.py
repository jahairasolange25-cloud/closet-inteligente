"""
CLIP local classification service (Tier 1 — zero cost, no API).

Uses openai/clip-vit-base-patch32 via open_clip to classify garment images
against a fixed label set. Falls back gracefully if torch is not installed.
"""

from __future__ import annotations

import asyncio
import hashlib
import logging
from pathlib import Path
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from PIL import Image

logger = logging.getLogger(__name__)

# Labels aligned with garment categories stored in DB
GARMENT_LABELS = [
    "a t-shirt",
    "a polo shirt",
    "a button-down shirt",
    "a blouse",
    "a sweater or hoodie",
    "a jacket or coat",
    "pants or trousers",
    "jeans",
    "a skirt",
    "a dress",
    "shorts",
    "shoes or sneakers",
    "boots",
    "a bag or accessory",
]

LABEL_TO_CATEGORY: dict[str, str] = {
    "a t-shirt": "upper_body",
    "a polo shirt": "upper_body",
    "a button-down shirt": "upper_body",
    "a blouse": "upper_body",
    "a sweater or hoodie": "upper_body",
    "a jacket or coat": "outerwear",
    "pants or trousers": "lower_body",
    "jeans": "lower_body",
    "a skirt": "lower_body",
    "a dress": "full_body",
    "shorts": "lower_body",
    "shoes or sneakers": "footwear",
    "boots": "footwear",
    "a bag or accessory": "accessory",
}

LABEL_TO_SUBCATEGORY: dict[str, str] = {
    "a t-shirt": "t-shirt",
    "a polo shirt": "polo",
    "a button-down shirt": "shirt",
    "a blouse": "blouse",
    "a sweater or hoodie": "sweater",
    "a jacket or coat": "jacket",
    "pants or trousers": "pants",
    "jeans": "jeans",
    "a skirt": "skirt",
    "a dress": "dress",
    "shorts": "shorts",
    "shoes or sneakers": "sneakers",
    "boots": "boots",
    "a bag or accessory": "accessory",
}


class CLIPService:
    def __init__(self) -> None:
        self._model: Optional[object] = None
        self._preprocess: Optional[object] = None
        self._text_features: Optional[object] = None
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
                import open_clip
                import torch

                logger.info("Loading CLIP model (ViT-B-32)…")
                model, _, preprocess = open_clip.create_model_and_transforms(
                    "ViT-B-32", pretrained="openai"
                )
                model.eval()
                if torch.cuda.is_available():
                    model = model.cuda()
                    logger.info("CLIP loaded on GPU")
                else:
                    logger.info("CLIP loaded on CPU")

                tokenizer = open_clip.get_tokenizer("ViT-B-32")
                texts = tokenizer(GARMENT_LABELS)
                if torch.cuda.is_available():
                    texts = texts.cuda()
                with torch.no_grad():
                    text_features = model.encode_text(texts)
                    text_features /= text_features.norm(dim=-1, keepdim=True)

                self._model = model
                self._preprocess = preprocess
                self._text_features = text_features
                self._available = True
                logger.info("CLIP service ready, %d labels", len(GARMENT_LABELS))
            except ImportError:
                logger.warning("open_clip not installed — CLIP service disabled")
            except Exception as exc:
                logger.warning("CLIP load failed: %s", exc)
            finally:
                self._loaded = True

    async def classify(self, image: Image.Image) -> dict:
        """Return category, subcategory, confidence, and best label."""
        await self._ensure_loaded()
        if not self._available:
            return {"available": False}

        try:
            import torch

            proc = self._preprocess
            img_tensor = proc(image.convert("RGB")).unsqueeze(0)
            if torch.cuda.is_available():
                img_tensor = img_tensor.cuda()

            with torch.no_grad():
                image_features = self._model.encode_image(img_tensor)  # type: ignore[attr-defined]
                image_features /= image_features.norm(dim=-1, keepdim=True)
                logits = (100.0 * image_features @ self._text_features.T).softmax(dim=-1)  # type: ignore[operator]

            probs = logits[0].cpu().tolist()
            best_idx = int(max(range(len(probs)), key=lambda i: probs[i]))
            best_label = GARMENT_LABELS[best_idx]
            confidence = float(probs[best_idx])

            return {
                "available": True,
                "category": LABEL_TO_CATEGORY.get(best_label, "unknown"),
                "subcategory": LABEL_TO_SUBCATEGORY.get(best_label),
                "label": best_label,
                "confidence": round(confidence, 4),
                "method": "clip_local",
                "all_probs": {GARMENT_LABELS[i]: round(probs[i], 4) for i in range(len(probs))},
            }
        except Exception as exc:
            logger.error("CLIP classify error: %s", exc)
            return {"available": False}

    async def encode_image(self, image: Image.Image) -> Optional[list[float]]:
        """Return 512-dim CLIP image embedding."""
        await self._ensure_loaded()
        if not self._available:
            return None
        try:
            import torch

            proc = self._preprocess
            img_tensor = proc(image.convert("RGB")).unsqueeze(0)
            if torch.cuda.is_available():
                img_tensor = img_tensor.cuda()
            with torch.no_grad():
                features = self._model.encode_image(img_tensor)  # type: ignore[attr-defined]
                features /= features.norm(dim=-1, keepdim=True)
            return features[0].cpu().tolist()
        except Exception as exc:
            logger.error("CLIP encode_image error: %s", exc)
            return None

    @property
    def is_available(self) -> bool:
        return self._available

    def model_info(self) -> dict:
        return {
            "clip_available": self._available,
            "clip_model": "ViT-B-32",
            "clip_labels": len(GARMENT_LABELS),
        }


clip_service = CLIPService()
