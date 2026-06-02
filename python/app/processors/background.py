from __future__ import annotations

from pathlib import Path
from typing import Optional

import structlog

logger = structlog.get_logger(__name__)


def remove_background(
    input_path: str,
    output_path: Optional[str] = None,
) -> tuple[str, float]:
    from PIL import Image  # lazy
    from rembg import remove as rembg_remove  # lazy (heavy onnx dep)

    if not output_path:
        output_path = str(Path(input_path).with_suffix(".nobg.png"))

    from ..services.model_cache import model_cache  # lazy
    input_img = Image.open(input_path)
    input_img = input_img.convert("RGBA")
    session = model_cache.rembg_session
    output_img = rembg_remove(input_img, session=session)
    output_img.save(output_path, "PNG")
    return output_path, 0.95
