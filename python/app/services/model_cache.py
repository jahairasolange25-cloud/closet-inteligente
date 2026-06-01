import time
from pathlib import Path
from typing import Optional

import structlog
from PIL import Image
from rembg import new_session, remove

from ..core.config import settings

logger = structlog.get_logger(__name__)


class ModelCache:
    def __init__(self):
        self._rembg_session: Optional[object] = None
        self._rembg_loaded_at: Optional[float] = None
        self._warmup_done = False

    @property
    def rembg_session(self) -> object:
        if self._rembg_session is None:
            logger.info("model_cache_loading_rembg")
            t0 = time.monotonic()
            self._rembg_session = new_session("u2netp")  # lighter model for 512MB RAM
            self._rembg_loaded_at = time.monotonic()
            logger.info(
                "model_cache_loaded_rembg",
                duration_ms=round((self._rembg_loaded_at - t0) * 1000, 1),
            )
        return self._rembg_session

    @property
    def rembg_loaded(self) -> bool:
        return self._rembg_session is not None

    @property
    def uptime_seconds(self) -> float:
        if self._rembg_loaded_at is None:
            return 0.0
        return time.monotonic() - self._rembg_loaded_at

    async def warmup(self) -> None:
        if self._warmup_done:
            return

        logger.info("model_cache_warmup_starting")
        model_dir = Path(settings.model_dir)
        model_dir.mkdir(parents=True, exist_ok=True)

        t0 = time.monotonic()
        session = self.rembg_session
        dummy = Image.new("RGBA", (64, 64), (255, 0, 0, 255))
        _ = remove(dummy, session=session)

        self._warmup_done = True
        logger.info(
            "model_cache_warmup_completed",
            duration_ms=round((time.monotonic() - t0) * 1000, 1),
        )

    def model_info(self) -> dict:
        return {
            "rembg_loaded": self.rembg_loaded,
            "rembg_model": "u2net",
            "rembg_uptime_seconds": round(self.uptime_seconds, 1),
            "warmup_done": self._warmup_done,
        }


model_cache = ModelCache()
