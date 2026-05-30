from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING, Optional

import structlog
from PIL import Image
from rembg import remove as rembg_remove

if TYPE_CHECKING:
    from ..services.model_cache import ModelCache

logger = structlog.get_logger(__name__)

_default_cache: Optional[ModelCache] = None


def remove_background(
    input_path: str,
    output_path: Optional[str] = None,
    model_cache_obj: Optional[ModelCache] = None,
) -> tuple[str, float]:
    global _default_cache
    if _default_cache is None:
        from ..services.model_cache import ModelCache as _MC  # noqa: N814
        _default_cache = _MC()

    if not output_path:
        output_path = str(Path(input_path).with_suffix(".nobg.png"))

    cache = model_cache_obj or _default_cache

    input_img = Image.open(input_path)
    input_img = input_img.convert("RGBA")

    session = cache.rembg_session
    output_img = rembg_remove(input_img, session=session)
    output_img.save(output_path, "PNG")

    return output_path, 0.95
