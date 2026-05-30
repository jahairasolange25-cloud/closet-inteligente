import asyncio
import logging
from typing import Optional

import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)


class EmbeddingService:
    def __init__(self) -> None:
        self._model: Optional[object] = None
        self._processor: Optional[object] = None
        self._model_loaded: bool = False
        self._load_lock = asyncio.Lock()
        self.dimension: int = 512

    async def _ensure_loaded(self) -> None:
        if self._model_loaded:
            return
        async with self._load_lock:
            if self._model_loaded:
                return
            try:
                import torch
                import torchvision.transforms as transforms
                from torchvision.models import resnet50, ResNet50_Weights

                logger.info("Loading embedding model (ResNet50 backbone)...")
                weights = ResNet50_Weights.DEFAULT
                self._model = resnet50(weights=weights)
                self._model.eval()
                if torch.cuda.is_available():
                    self._model = self._model.cuda()
                    logger.info("Embedding model loaded on GPU")
                else:
                    logger.info("Embedding model loaded on CPU")

                self._processor = transforms.Compose([
                    transforms.Resize((224, 224)),
                    transforms.ToTensor(),
                    transforms.Normalize(
                        mean=[0.485, 0.456, 0.406],
                        std=[0.229, 0.224, 0.225],
                    ),
                ])
                self._model_loaded = True
                logger.info("Embedding model ready, dimension=512")
            except ImportError:
                logger.warning(
                    "torch/torchvision not installed, using numpy fallback"
                )
                self._model_loaded = True

    async def generate_embedding(self, image: Image.Image) -> list[float]:
        await self._ensure_loaded()

        if self._model is not None:
            import torch

            if self._processor is not None:
                proc = self._processor
                if hasattr(proc, '__call__'):
                    input_tensor = proc(image.convert("RGB")).unsqueeze(0)
                else:
                    return self._fallback_embedding(image)
            else:
                return self._fallback_embedding(image)

            if torch.cuda.is_available() and hasattr(input_tensor, 'cuda'):
                input_tensor = input_tensor.cuda()
            with torch.no_grad():
                result = self._model(input_tensor)
                if hasattr(result, 'cpu'):
                    embedding = result.cpu().numpy().flatten()
                else:
                    return self._fallback_embedding(image)
            return embedding.tolist()

        return self._fallback_embedding(image)

    def _fallback_embedding(self, image: Image.Image) -> list[float]:
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
        a = np.array(embedding_a, dtype=float)
        b = np.array(embedding_b, dtype=float)
        if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
            return 0.0
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


embedding_service = EmbeddingService()
