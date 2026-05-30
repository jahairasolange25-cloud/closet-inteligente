from io import BytesIO

from PIL import Image


def create_test_image(
    width: int = 200,
    height: int = 300,
    color: tuple[int, int, int] = (255, 0, 0),
    format: str = "PNG",
) -> bytes:
    img = Image.new("RGB", (width, height), color)
    buf = BytesIO()
    img.save(buf, format=format)
    return buf.getvalue()


def create_test_image_with_transparency(
    width: int = 200,
    height: int = 300,
    color: tuple[int, int, int] = (255, 0, 0),
) -> bytes:
    img = Image.new("RGBA", (width, height), (*color, 255))
    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def create_corrupted_image() -> bytes:
    return b"not a real image file content"


def create_oversized_image() -> bytes:
    return create_test_image(width=5000, height=5000)
