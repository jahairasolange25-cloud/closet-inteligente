from pathlib import Path

import structlog

logger = structlog.get_logger(__name__)


def extract_metadata(image_path: str) -> dict:
    from PIL import Image  # lazy
    path = Path(image_path)
    file_size = path.stat().st_size if path.exists() else 0

    img = Image.open(image_path)
    width, height = img.size

    aspect_ratio = round(width / height, 4) if height > 0 else 0.0

    mime_type = _detect_mime(image_path)

    return {
        "width": width,
        "height": height,
        "aspect_ratio": aspect_ratio,
        "file_size_bytes": file_size,
        "mime_type": mime_type,
    }


def _detect_mime(image_path: str) -> str:
    ext = Path(image_path).suffix.lower()
    mime_map = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".heic": "image/heic",
        ".gif": "image/gif",
    }
    try:
        with open(image_path, "rb") as f:
            header = f.read(12)
        magic_map: list[tuple[str, bytes]] = [
            ("image/jpeg", b"\xff\xd8\xff"),
            ("image/png", b"\x89PNG\r\n\x1a\n"),
            ("image/webp", b"RIFF"),
            ("image/gif", b"GIF8"),
        ]
        for mime, sig in magic_map:
            if header.startswith(sig):
                return mime
    except Exception:
        pass
    return mime_map.get(ext, "application/octet-stream")
