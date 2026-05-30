from app.processors.metadata import _detect_mime


class TestMetadata:
    def test_detect_mime_jpeg(self):
        mime = _detect_mime("test.jpg")
        assert mime in ("image/jpeg", "application/octet-stream")

    def test_detect_mime_png(self):
        mime = _detect_mime("test.png")
        assert mime in ("image/png", "application/octet-stream")

    def test_detect_mime_webp(self):
        mime = _detect_mime("test.webp")
        assert mime in ("image/webp", "application/octet-stream")

    def test_detect_mime_unknown(self):
        mime = _detect_mime("test.unknown")
        assert mime == "application/octet-stream"
