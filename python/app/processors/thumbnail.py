from pathlib import Path
from typing import Optional

import structlog

from ..core.config import settings

logger = structlog.get_logger(__name__)


def generate_thumbnails(
    input_path: str,
    thumbnail_path: Optional[str] = None,
    preview_path: Optional[str] = None,
    fmt: str = "webp",
    quality: Optional[int] = None,
    sizes: Optional[list[int]] = None,
) -> dict:
    from PIL import Image  # lazy
    input_stem = Path(input_path).stem
    input_dir = Path(input_path).parent
    img = Image.open(input_path).convert("RGBA")

    if quality is None:
        quality = settings.thumbnail_webp_quality
    if sizes is None:
        sizes = settings.thumbnail_size_list
    if fmt not in ("webp", "png", "jpeg"):
        fmt = "webp"

    ext = f".{fmt}"
    save_kwargs = {"format": fmt.upper()}
    if fmt == "webp":
        save_kwargs["quality"] = quality

    output = {}

    for size in sizes:
        if size >= max(img.width, img.height):
            out_path = str(input_dir / f"{input_stem}_full{ext}")
            img.save(out_path, **save_kwargs)
        else:
            out_path = str(input_dir / f"{input_stem}_{size}{ext}")
            copy = img.copy()
            copy.thumbnail((size, size), Image.LANCZOS)
            copy.save(out_path, **save_kwargs)

        if size == 300:
            output["thumbnail_url"] = out_path
        elif size == 800:
            output["preview_url"] = out_path

    output["width"] = img.width
    output["height"] = img.height
    output["format"] = fmt
    output["quality"] = quality

    return output
