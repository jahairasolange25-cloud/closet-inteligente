# AI Pipeline Step Example — Color Detection

> **Purpose:** Reference implementation for creating AI pipeline steps in the Closet Inteligente Digital project.
> **Pattern:** Pipeline step class → Input validation → Retry logic → Logging → Tests
> **Stack:** Python 3.11, OpenCV, NumPy, scikit-learn, Pytest

---

## Pipeline Overview

```
User Uploads Image
       │
       ▼
┌──────────────────┐
│  Validation Step │  ← Image not None, min dimensions, supported format
└───────┬──────────┘
        │
        ▼
┌──────────────────┐
│ Quality Check    │  ← Blurry detection, dark image detection
└───────┬──────────┘
        │
        ▼
┌──────────────────┐
│ Color Detection  │  ← K-means clustering on pixel data
└───────┬──────────┘
        │
        ▼
┌──────────────────┐
│  Post-process    │  ← Convert to named colors, format output
└───────┬──────────┘
        │
        ▼
┌──────────────────┐
│  Emit Result     │  ← Send to NestJS via queue/REST
└──────────────────┘
```

---

## File 1: color_detector.py

```python
"""Color detection pipeline step using K-means clustering.

Extracts dominant colors from garment images using OpenCV and
scikit-learn. Handles validation, quality checks, and retry logic.
"""

from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, ClassVar

import cv2
import numpy as np
from numpy.typing import NDArray
from sklearn.cluster import KMeans

logger = logging.getLogger(__name__)


class ColorDetectionError(Exception):
    """Base exception for color detection errors."""


class InvalidImageError(ColorDetectionError):
    """Raised when the input image is invalid."""


class QualityCheckError(ColorDetectionError):
    """Raised when the image fails quality checks."""


class ProcessingError(ColorDetectionError):
    """Raised when color processing fails."""


class ColorSpace(Enum):
    """Supported color spaces for analysis."""
    RGB = "rgb"
    HSV = "hsv"
    LAB = "lab"


@dataclass
class DominantColor:
    """Represents a single dominant color from analysis."""
    rgb: tuple[int, int, int]
    hex: str
    percentage: float
    name: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "rgb": list(self.rgb),
            "hex": self.hex,
            "percentage": round(self.percentage, 2),
            "name": self.name,
        }


@dataclass
class ColorDetectionResult:
    """Result of color detection analysis."""
    dominant_colors: list[DominantColor]
    palette_harmony: str
    is_monochromatic: bool
    brightness: float
    saturation: float
    warm_cool_ratio: float
    processing_time_ms: float

    def to_dict(self) -> dict[str, Any]:
        return {
            "dominant_colors": [c.to_dict() for c in self.dominant_colors],
            "palette_harmony": self.palette_harmony,
            "is_monochromatic": self.is_monochromatic,
            "brightness": round(self.brightness, 3),
            "saturation": round(self.saturation, 3),
            "warm_cool_ratio": round(self.warm_cool_ratio, 3),
            "processing_time_ms": round(self.processing_time_ms, 2),
        }


SUPPORTED_FORMATS: set[str] = {
    ".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff",
}

MIN_IMAGE_DIMENSION = 50
MAX_IMAGE_DIMENSION = 10000
BLUR_THRESHOLD = 100.0
DARK_IMAGE_THRESHOLD = 30.0

COLOR_PALETTE: dict[str, tuple[int, int, int]] = {
    "red": (255, 0, 0),
    "dark_red": (139, 0, 0),
    "crimson": (220, 20, 60),
    "pink": (255, 192, 203),
    "hot_pink": (255, 105, 180),
    "orange": (255, 165, 0),
    "dark_orange": (255, 140, 0),
    "coral": (255, 127, 80),
    "yellow": (255, 255, 0),
    "gold": (255, 215, 0),
    "olive": (128, 128, 0),
    "green": (0, 128, 0),
    "lime": (0, 255, 0),
    "dark_green": (0, 100, 0),
    "teal": (0, 128, 128),
    "cyan": (0, 255, 255),
    "blue": (0, 0, 255),
    "navy": (0, 0, 128),
    "royal_blue": (65, 105, 225),
    "purple": (128, 0, 128),
    "violet": (238, 130, 238),
    "magenta": (255, 0, 255),
    "brown": (165, 42, 42),
    "beige": (245, 245, 220),
    "white": (255, 255, 255),
    "light_gray": (211, 211, 211),
    "gray": (128, 128, 128),
    "dark_gray": (64, 64, 64),
    "black": (0, 0, 0),
    "cream": (255, 253, 208),
    "ivory": (255, 255, 240),
    "tan": (210, 180, 140),
    "khaki": (195, 176, 145),
    "maroon": (128, 0, 0),
    "burgundy": (128, 0, 32),
    "lavender": (230, 230, 250),
    "mint": (189, 252, 201),
    "peach": (255, 218, 185),
    "salmon": (250, 128, 114),
    "charcoal": (54, 69, 79),
    "slate": (112, 128, 144),
    "indigo": (75, 0, 130),
    "turquoise": (64, 224, 208),
    "aquamarine": (127, 255, 212),
}


@dataclass
class RetryConfig:
    """Configuration for retry logic with exponential backoff."""
    max_retries: int = 3
    base_delay_ms: float = 1000.0
    max_delay_ms: float = 30000.0
    backoff_factor: float = 2.0
    retryable_exceptions: tuple[type[Exception], ...] = (
        TimeoutError,
        ConnectionError,
        ProcessingError,
    )


class ColorDetector:
    """Detects dominant colors in garment images using K-means clustering.

    Attributes:
        n_colors: Number of dominant colors to extract.
        color_space: Color space for clustering.
        retry_config: Configuration for retry logic.
    """

    MIN_DIMENSION: ClassVar[int] = 50
    MAX_DIMENSION: ClassVar[int] = 10000

    def __init__(
        self,
        n_colors: int = 5,
        color_space: ColorSpace = ColorSpace.RGB,
        retry_config: RetryConfig | None = None,
    ) -> None:
        self.n_colors = max(1, min(n_colors, 10))
        self.color_space = color_space
        self.retry_config = retry_config or RetryConfig()

    def detect(
        self,
        image: NDArray[np.uint8] | None,
        filename: str = "unknown",
    ) -> ColorDetectionResult:
        """Run color detection on a single image.

        Args:
            image: Input image as a numpy array (BGR format from OpenCV).
            filename: Original filename for logging context.

        Returns:
            ColorDetectionResult with dominant colors and metadata.

        Raises:
            InvalidImageError: If image is None or fails validation.
            QualityCheckError: If image fails quality checks.
            ProcessingError: If color processing fails.

        Example:
            >>> import cv2
            >>> img = cv2.imread("shirt.jpg")
            >>> detector = ColorDetector(n_colors=3)
            >>> result = detector.detect(img, "shirt.jpg")
            >>> print(result.dominant_colors[0].hex)
            '#1a5c8a'
        """
        start_time = time.perf_counter()

        logger.info("Starting color detection for: %s", filename)

        validated = self._validate_image(image, filename)
        processed = self._process_with_retry(validated, filename)
        result = self._build_result(processed, start_time)

        logger.info(
            "Color detection complete for: %s (%d colors in %.0fms)",
            filename,
            len(result.dominant_colors),
            result.processing_time_ms,
        )

        return result

    async def detect_async(
        self,
        image: NDArray[np.uint8] | None,
        filename: str = "unknown",
    ) -> ColorDetectionResult:
        """Async version of detect, runs CPU-bound clustering in executor."""
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            None, self.detect, image, filename,
        )

    def _validate_image(
        self,
        image: NDArray[np.uint8] | None,
        filename: str,
    ) -> NDArray[np.uint8]:
        """Validate input image dimensions, format, and quality."""
        if image is None:
            logger.error("Image is None for: %s", filename)
            raise InvalidImageError(f"Image is None: {filename}")

        if not isinstance(image, np.ndarray):
            logger.error("Invalid image type: %s", type(image).__name__)
            raise InvalidImageError(
                f"Image must be numpy array, got {type(image).__name__}: {filename}",
            )

        if image.ndim != 3 or image.shape[2] != 3:
            logger.error(
                "Invalid image shape %s for: %s",
                image.shape,
                filename,
            )
            raise InvalidImageError(
                f"Image must be 3-channel (BGR), got shape {image.shape}: {filename}",
            )

        height, width = image.shape[:2]

        if height < MIN_IMAGE_DIMENSION or width < MIN_IMAGE_DIMENSION:
            raise InvalidImageError(
                f"Image too small: {width}x{height} (min {MIN_IMAGE_DIMENSION}px): {filename}",
            )

        if height > MAX_IMAGE_DIMENSION or width > MAX_IMAGE_DIMENSION:
            raise InvalidImageError(
                f"Image too large: {width}x{height} (max {MAX_IMAGE_DIMENSION}px): {filename}",
            )

        if image.dtype != np.uint8:
            try:
                image = image.astype(np.uint8)
            except (ValueError, OverflowError) as exc:
                raise InvalidImageError(
                    f"Cannot convert image dtype {image.dtype}: {filename}",
                ) from exc

        self._check_quality(image, filename)

        return image

    def _check_quality(
        self,
        image: NDArray[np.uint8],
        filename: str,
    ) -> None:
        """Check image quality: blurriness and exposure."""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        if laplacian_var < BLUR_THRESHOLD:
            logger.warning(
                "Blurry image detected for %s (variance=%.2f, threshold=%.1f)",
                filename,
                laplacian_var,
                BLUR_THRESHOLD,
            )

        mean_brightness = np.mean(gray)
        if mean_brightness < DARK_IMAGE_THRESHOLD:
            raise QualityCheckError(
                f"Image too dark: mean brightness {mean_brightness:.1f} "
                f"(threshold {DARK_IMAGE_THRESHOLD}): {filename}",
            )

        if mean_brightness > 250:
            logger.warning(
                "Overexposed image for %s (brightness=%.1f)",
                filename,
                mean_brightness,
            )

    def _process_with_retry(
        self,
        image: NDArray[np.uint8],
        filename: str,
    ) -> tuple[NDArray[np.float64], NDArray[np.intp]]:
        """Run K-means clustering with retry logic."""
        last_exception: Exception | None = None

        for attempt in range(1, self.retry_config.max_retries + 1):
            try:
                logger.debug(
                    "Clustering attempt %d/%d for: %s",
                    attempt,
                    self.retry_config.max_retries,
                    filename,
                )
                return self._cluster_colors(image)
            except self.retry_config.retryable_exceptions as exc:
                last_exception = exc
                if attempt < self.retry_config.max_retries:
                    delay = self._calculate_backoff(attempt)
                    logger.warning(
                        "Retry %d/%d for %s after error: %s. Waiting %.0fms",
                        attempt,
                        self.retry_config.max_retries,
                        filename,
                        str(exc),
                        delay * 1000,
                    )
                    time.sleep(delay)
                else:
                    logger.error(
                        "All %d retries failed for: %s",
                        self.retry_config.max_retries,
                        filename,
                    )
                    raise ProcessingError(
                        f"Color detection failed after {self.retry_config.max_retries} "
                        f"retries: {exc}",
                    ) from exc

        raise ProcessingError("Unexpected error in retry loop")

    def _calculate_backoff(self, attempt: int) -> float:
        """Calculate exponential backoff delay."""
        delay = self.retry_config.base_delay_ms * (
            self.retry_config.backoff_factor ** (attempt - 1)
        )
        jitter = delay * 0.1 * np.random.random()
        capped = min(delay + jitter, self.retry_config.max_delay_ms)
        return capped / 1000.0

    def _cluster_colors(
        self,
        image: NDArray[np.uint8],
    ) -> tuple[NDArray[np.float64], NDArray[np.intp]]:
        """Perform K-means clustering to find dominant colors."""
        pixels = image.reshape(-1, 3).astype(np.float32)

        if self.color_space == ColorSpace.HSV:
            hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
            pixels = hsv.reshape(-1, 3).astype(np.float32)
        elif self.color_space == ColorSpace.LAB:
            lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
            pixels = lab.reshape(-1, 3).astype(np.float32)

        pixels = pixels / 255.0

        kmeans = KMeans(
            n_clusters=self.n_colors,
            random_state=42,
            n_init=3,
            max_iter=300,
        )
        labels: NDArray[np.intp] = kmeans.fit_predict(pixels)
        centers: NDArray[np.float64] = kmeans.cluster_centers_

        return centers, labels

    def _build_result(
        self,
        clustered: tuple[NDArray[np.float64], NDArray[np.intp]],
        start_time: float,
    ) -> ColorDetectionResult:
        """Build the final ColorDetectionResult from clustered data."""
        centers, labels = clustered
        centers_bgr = (centers * 255).astype(np.uint8)

        pixel_counts = np.bincount(labels, minlength=self.n_colors)
        total_pixels = pixel_counts.sum()
        percentages = (pixel_counts / total_pixels * 100.0).astype(float)

        sorted_indices = np.argsort(percentages)[::-1]
        centers_bgr = centers_bgr[sorted_indices]
        percentages = percentages[sorted_indices]

        dominant_colors: list[DominantColor] = []
        for i in range(self.n_colors):
            bgr = centers_bgr[i]
            rgb = (int(bgr[2]), int(bgr[1]), int(bgr[0]))
            hex_color = f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"
            color_name = self._find_closest_color_name(rgb)

            dominant_colors.append(DominantColor(
                rgb=rgb,
                hex=hex_color,
                percentage=float(percentages[i]),
                name=color_name,
            ))

        return ColorDetectionResult(
            dominant_colors=dominant_colors,
            palette_harmony=self._classify_harmony(dominant_colors),
            is_monochromatic=self._is_monochromatic(dominant_colors),
            brightness=self._calculate_brightness(centers_bgr),
            saturation=self._calculate_saturation(centers_bgr),
            warm_cool_ratio=self._calculate_warm_cool_ratio(dominant_colors),
            processing_time_ms=(time.perf_counter() - start_time) * 1000,
        )

    def _find_closest_color_name(self, rgb: tuple[int, int, int]) -> str:
        """Find the closest named color using Euclidean distance."""
        min_dist = float("inf")
        closest_name = "unknown"

        for name, named_rgb in COLOR_PALETTE.items():
            dist = sum((a - b) ** 2 for a, b in zip(rgb, named_rgb))
            if dist < min_dist:
                min_dist = dist
                closest_name = name

        return closest_name

    def _classify_harmony(self, colors: list[DominantColor]) -> str:
        """Classify the color palette harmony type."""
        if len(colors) < 2:
            return "monochromatic"

        hues = []
        for color in colors:
            r, g, b = color.rgb
            r_norm, g_norm, b_norm = r / 255.0, g / 255.0, b / 255.0
            cmax = max(r_norm, g_norm, b_norm)
            cmin = min(r_norm, g_norm, b_norm)
            diff = cmax - cmin
            hue = 0.0
            if diff > 0:
                if cmax == r_norm:
                    hue = (60 * ((g_norm - b_norm) / diff) + 360) % 360
                elif cmax == g_norm:
                    hue = (60 * ((b_norm - r_norm) / diff) + 120) % 360
                else:
                    hue = (60 * ((r_norm - g_norm) / diff) + 240) % 360
            hues.append(hue)

        if len(hues) >= 2:
            diff = abs(hues[0] - hues[1])
            complementary = abs(diff - 180)
            if complementary < 30:
                return "complementary"
            if diff < 30:
                return "analogous"
            if 60 <= diff <= 120:
                return "triadic"

        return "custom"

    def _is_monochromatic(self, colors: list[DominantColor]) -> bool:
        """Check if the palette is essentially one color family."""
        if len(colors) <= 1:
            return True
        base_color = colors[0]
        threshold = 60
        for color in colors[1:]:
            dist = sum((a - b) ** 2 for a, b in zip(color.rgb, base_color.rgb))
            if dist > threshold ** 2:
                return False
        return True

    def _calculate_brightness(self, centers_bgr: NDArray[np.uint8]) -> float:
        """Calculate weighted average brightness."""
        weighted = centers_bgr.mean(axis=0)
        b, g, r = weighted
        return float(0.299 * r + 0.587 * g + 0.114 * b) / 255.0

    def _calculate_saturation(self, centers_bgr: NDArray[np.uint8]) -> float:
        """Calculate weighted average saturation."""
        hsv = cv2.cvtColor(centers_bgr.reshape(1, 1, 3), cv2.COLOR_BGR2HSV)
        return float(hsv[0, 0, 1]) / 255.0

    def _calculate_warm_cool_ratio(
        self,
        colors: list[DominantColor],
    ) -> float:
        """Calculate warm to cool color ratio (higher = warmer)."""
        warm_colors: set[str] = {
            "red", "dark_red", "crimson", "pink", "hot_pink",
            "orange", "dark_orange", "coral", "yellow", "gold",
            "brown", "beige", "peach", "salmon", "tan", "khaki",
            "cream", "ivory", "maroon", "burgundy",
        }
        warm_pct = 0.0
        cool_pct = 0.0
        for color in colors:
            if color.name in warm_colors:
                warm_pct += color.percentage
            else:
                cool_pct += color.percentage
        if cool_pct == 0:
            return 1.0
        return float(warm_pct / cool_pct)
```

---

## File 2: color_detector_test.py

```python
"""Tests for the ColorDetector color analysis pipeline step."""

from __future__ import annotations

from typing import Any

import cv2
import numpy as np
import pytest
from numpy.typing import NDArray

from pipelines.color_detection.color_detector import (
    ColorDetector,
    ColorDetectionResult,
    ColorSpace,
    DominantColor,
    InvalidImageError,
    QualityCheckError,
    ProcessingError,
    RetryConfig,
)


@pytest.fixture
def detector() -> ColorDetector:
    """Fixture: default ColorDetector instance."""
    return ColorDetector(n_colors=3)


@pytest.fixture
def solid_color_image() -> NDArray[np.uint8]:
    """Fixture: 100x100 solid blue image (BGR)."""
    return np.full((100, 100, 3), (255, 0, 0), dtype=np.uint8)


@pytest.fixture
def gradient_image() -> NDArray[np.uint8]:
    """Fixture: 200x200 gradient image."""
    img = np.zeros((200, 200, 3), dtype=np.uint8)
    for i in range(200):
        cv2.line(img, (0, i), (199, i), (i * 1.2, i * 0.8, 255 - i), 1)
    return img


@pytest.fixture
def real_garment_image() -> NDArray[np.uint8]:
    """Fixture: simulated garment image (white shirt on gray bg)."""
    img = np.full((300, 300, 3), 200, dtype=np.uint8)
    cv2.rectangle(img, (50, 50), (250, 250), (255, 255, 255), -1)
    cv2.circle(img, (150, 150), 80, (0, 0, 200), -1)
    return img


class TestImageValidation:
    """Tests for input validation."""

    def test_rejects_none_image(self, detector: ColorDetector) -> None:
        with pytest.raises(InvalidImageError, match="Image is None"):
            detector.detect(None, "none.png")

    def test_rejects_empty_array(self, detector: ColorDetector) -> None:
        with pytest.raises(InvalidImageError, match="must be 3-channel"):
            detector.detect(np.array([], dtype=np.uint8), "empty.png")

    def test_rejects_grayscale(self, detector: ColorDetector) -> None:
        gray = np.random.randint(0, 255, (100, 100), dtype=np.uint8)
        with pytest.raises(InvalidImageError, match="must be 3-channel"):
            detector.detect(gray, "gray.png")

    def test_rejects_small_image(self, detector: ColorDetector) -> None:
        small = np.random.randint(0, 255, (10, 10, 3), dtype=np.uint8)
        with pytest.raises(InvalidImageError, match="too small"):
            detector.detect(small, "small.png")

    def test_rejects_large_image(self, detector: ColorDetector) -> None:
        large = np.random.randint(0, 255, (10001, 100, 3), dtype=np.uint8)
        with pytest.raises(InvalidImageError, match="too large"):
            detector.detect(large, "large.png")

    def test_accepts_valid_image(
        self, detector: ColorDetector, solid_color_image: NDArray[np.uint8],
    ) -> None:
        result = detector.detect(solid_color_image, "valid.png")
        assert isinstance(result, ColorDetectionResult)

    def test_accepts_boundary_dimensions(self, detector: ColorDetector) -> None:
        min_img = np.random.randint(0, 255, (50, 50, 3), dtype=np.uint8)
        result = detector.detect(min_img, "min.png")
        assert isinstance(result, ColorDetectionResult)

    def test_converts_dtype_automatically(self, detector: ColorDetector) -> None:
        img = np.full((100, 100, 3), 127, dtype=np.float32)
        result = detector.detect(img.astype(np.uint8), "convert.png")
        assert isinstance(result, ColorDetectionResult)


class TestQualityChecks:
    """Tests for image quality validation."""

    def test_detects_dark_image(self, detector: ColorDetector) -> None:
        dark = np.full((100, 100, 3), 5, dtype=np.uint8)
        with pytest.raises(QualityCheckError, match="too dark"):
            detector.detect(dark, "dark.png")

    def test_passes_normal_brightness(
        self, detector: ColorDetector, solid_color_image: NDArray[np.uint8],
    ) -> None:
        result = detector.detect(solid_color_image, "normal.png")
        assert result.brightness > 0.3

    def test_warns_on_blurry(self, detector: ColorDetector, caplog: pytest.LogCaptureFixture) -> None:
        blurry = np.full((100, 100, 3), 128, dtype=np.uint8,)
        with caplog.at_level("WARNING"):
            detector.detect(blurry, "blurry.png")
            assert any("Blurry" in record.message for record in caplog.records)

    def test_warns_on_overexposed(
        self, detector: ColorDetector, caplog: pytest.LogCaptureFixture,
    ) -> None:
        bright = np.full((100, 100, 3), 252, dtype=np.uint8)
        with caplog.at_level("WARNING"):
            detector.detect(bright, "overexposed.png")
            assert any("Overexposed" in record.message for record in caplog.records)


class TestColorDetection:
    """Tests for core color detection functionality."""

    def test_returns_correct_number_of_colors(
        self, detector: ColorDetector, gradient_image: NDArray[np.uint8],
    ) -> None:
        result = detector.detect(gradient_image, "gradient.png")
        assert len(result.dominant_colors) == 3

    def test_returns_colors_sorted_by_percentage(
        self, detector: ColorDetector, gradient_image: NDArray[np.uint8],
    ) -> None:
        result = detector.detect(gradient_image, "gradient.png")
        percentages = [c.percentage for c in result.dominant_colors]
        assert all(
            percentages[i] >= percentages[i + 1]
            for i in range(len(percentages) - 1)
        )

    def test_colors_sum_to_100(
        self, detector: ColorDetector, gradient_image: NDArray[np.uint8],
    ) -> None:
        result = detector.detect(gradient_image, "gradient.png")
        total = sum(c.percentage for c in result.dominant_colors)
        assert abs(total - 100.0) < 1.0

    def test_solid_color_single_dominant(
        self,
        detector: ColorDetector,
        solid_color_image: NDArray[np.uint8],
    ) -> None:
        result = detector.detect(solid_color_image, "solid_blue.png")
        top_color = result.dominant_colors[0]
        assert top_color.percentage > 95.0

    def test_solid_color_is_blue(
        self,
        detector: ColorDetector,
        solid_color_image: NDArray[np.uint8],
    ) -> None:
        result = detector.detect(solid_color_image, "solid_blue.png")
        top_color = result.dominant_colors[0]
        assert top_color.name == "blue"

    def test_hex_format(self, detector: ColorDetector, solid_color_image: NDArray[np.uint8]) -> None:
        result = detector.detect(solid_color_image, "hex_test.png")
        for color in result.dominant_colors:
            assert color.hex.startswith("#")
            assert len(color.hex) == 7
            assert all(c in "0123456789abcdef" for c in color.hex[1:])

    def test_rgb_range(self, detector: ColorDetector, gradient_image: NDArray[np.uint8]) -> None:
        result = detector.detect(gradient_image, "rgb_test.png")
        for color in result.dominant_colors:
            for channel in color.rgb:
                assert 0 <= channel <= 255

    def test_monochromatic_detection(
        self, detector: ColorDetector, solid_color_image: NDArray[np.uint8],
    ) -> None:
        result = detector.detect(solid_color_image, "mono_test.png")
        assert result.is_monochromatic is True

    def test_processing_time_positive(
        self, detector: ColorDetector, gradient_image: NDArray[np.uint8],
    ) -> None:
        result = detector.detect(gradient_image, "time_test.png")
        assert result.processing_time_ms > 0

    def test_warm_cool_ratio(
        self, detector: ColorDetector, solid_color_image: NDArray[np.uint8],
    ) -> None:
        result = detector.detect(solid_color_image, "warm_cool.png")
        assert 0 <= result.warm_cool_ratio <= 10

    def test_hsv_color_space(
        self,
        gradient_image: NDArray[np.uint8],
    ) -> None:
        hsv_detector = ColorDetector(n_colors=3, color_space=ColorSpace.HSV)
        result = hsv_detector.detect(gradient_image, "hsv_test.png")
        assert len(result.dominant_colors) == 3

    def test_lab_color_space(
        self,
        gradient_image: NDArray[np.uint8],
    ) -> None:
        lab_detector = ColorDetector(n_colors=3, color_space=ColorSpace.LAB)
        result = lab_detector.detect(gradient_image, "lab_test.png")
        assert len(result.dominant_colors) == 3


class TestColorNaming:
    """Tests for the color naming functionality."""

    def test_red_is_identified(self, detector: ColorDetector) -> None:
        red = np.full((100, 100, 3), (0, 0, 255), dtype=np.uint8)
        result = detector.detect(red, "red.png")
        assert result.dominant_colors[0].name == "red"

    def test_green_is_identified(self, detector: ColorDetector) -> None:
        green = np.full((100, 100, 3), (0, 255, 0), dtype=np.uint8)
        result = detector.detect(green, "green.png")
        assert result.dominant_colors[0].name == "lime"

    def test_white_is_identified(self, detector: ColorDetector) -> None:
        white = np.full((100, 100, 3), (255, 255, 255), dtype=np.uint8)
        result = detector.detect(white, "white.png")
        assert result.dominant_colors[0].name == "white"

    def test_black_is_identified(self, detector: ColorDetector) -> None:
        black = np.full((100, 100, 3), 0, dtype=np.uint8)
        result = detector.detect(black, "black.png")
        assert result.dominant_colors[0].name == "black"


class TestResultSerialization:
    """Tests for serialization of results."""

    def test_to_dict_returns_all_fields(
        self, detector: ColorDetector, gradient_image: NDArray[np.uint8],
    ) -> None:
        result = detector.detect(gradient_image, "serialize.png")
        data = result.to_dict()
        expected_keys = {
            "dominant_colors", "palette_harmony", "is_monochromatic",
            "brightness", "saturation", "warm_cool_ratio", "processing_time_ms",
        }
        assert set(data.keys()) == expected_keys

    def test_dominant_color_to_dict(
        self, detector: ColorDetector, solid_color_image: NDArray[np.uint8],
    ) -> None:
        result = detector.detect(solid_color_image, "color_dict.png")
        color_dict = result.dominant_colors[0].to_dict()
        assert set(color_dict.keys()) == {"rgb", "hex", "percentage", "name"}


class TestEdgeCases:
    """Tests for edge cases and boundary conditions."""

    def test_minimum_colors(self) -> None:
        detector = ColorDetector(n_colors=1)
        img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
        result = detector.detect(img, "min_colors.png")
        assert len(result.dominant_colors) == 1

    def test_maximum_colors(self) -> None:
        detector = ColorDetector(n_colors=10)
        img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
        result = detector.detect(img, "max_colors.png")
        assert len(result.dominant_colors) == 10

    def test_clamps_n_colors_to_range(self) -> None:
        detector = ColorDetector(n_colors=100)
        img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
        result = detector.detect(img, "clamp.png")
        assert len(result.dominant_colors) <= 10


class TestRetryLogic:
    """Tests for retry with exponential backoff."""

    def test_retry_on_processing_error(self, mocker: Any) -> None:
        detector = ColorDetector(
            retry_config=RetryConfig(max_retries=2, base_delay_ms=10.0),
        )
        img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
        mocker.patch.object(
            detector,
            "_cluster_colors",
            side_effect=[ProcessingError("temp"), [[0.5, 0.5, 0.5]], [0, 0, 0]],
        )
        result = detector.detect(img, "retry_test.png")
        assert isinstance(result, ColorDetectionResult)

    def test_fails_after_max_retries(self, mocker: Any) -> None:
        detector = ColorDetector(
            retry_config=RetryConfig(max_retries=3, base_delay_ms=10.0),
        )
        img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
        mocker.patch.object(
            detector,
            "_cluster_colors",
            side_effect=ProcessingError("persistent"),
        )
        with pytest.raises(ProcessingError, match="failed after 3 retries"):
            detector.detect(img, "fail_retry.png")

    def test_backoff_increases_with_attempts(self) -> None:
        config = RetryConfig(base_delay_ms=1000.0, backoff_factor=2.0)
        detector = ColorDetector(retry_config=config)
        delays = [detector._calculate_backoff(i) for i in range(1, 5)]
        for i in range(1, len(delays)):
            assert delays[i] > delays[i - 1]

    def test_backoff_capped_at_max(self) -> None:
        config = RetryConfig(
            base_delay_ms=1000.0,
            backoff_factor=10.0,
            max_delay_ms=5000.0,
        )
        detector = ColorDetector(retry_config=config)
        delay = detector._calculate_backoff(10)
        assert delay <= config.max_delay_ms / 1000.0


class TestRealGarmentScenario:
    """Tests simulating real garment image processing."""

    def test_detects_dominant_color(
        self,
        detector: ColorDetector,
        real_garment_image: NDArray[np.uint8],
    ) -> None:
        result = detector.detect(real_garment_image, "garment.png")
        top_color = result.dominant_colors[0]
        assert len(result.dominant_colors) == 3

    def test_rejects_invalid_format_extension(self, detector: ColorDetector) -> None:
        img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
        result = detector.detect(img, "image.gif")
        assert isinstance(result, ColorDetectionResult)


class TestAsyncSupport:
    """Tests for async detection."""

    @pytest.mark.asyncio
    async def test_async_detection(
        self,
        detector: ColorDetector,
        solid_color_image: NDArray[np.uint8],
    ) -> None:
        result = await detector.detect_async(solid_color_image, "async.png")
        assert isinstance(result, ColorDetectionResult)
        assert len(result.dominant_colors) == 3


class TestParametrizedEdgeCases:
    """Parametrized tests covering many edge cases."""

    @pytest.mark.parametrize(
        "size, expected_valid", [
            ((50, 50, 3), True),
            ((100, 100, 3), True),
            ((1000, 1000, 3), True),
            ((5000, 5000, 3), True),
            ((49, 100, 3), False),
            ((100, 49, 3), False),
        ],
    )
    def test_various_sizes(
        self,
        detector: ColorDetector,
        size: tuple[int, int, int],
        expected_valid: bool,
    ) -> None:
        img = np.random.randint(0, 255, size, dtype=np.uint8)
        if expected_valid:
            result = detector.detect(img, f"{size[0]}x{size[1]}.png")
            assert isinstance(result, ColorDetectionResult)
        else:
            with pytest.raises(InvalidImageError):
                detector.detect(img, f"{size[0]}x{size[1]}.png")

    @pytest.mark.parametrize(
        "color_bgr, expected_name", [
            ((0, 0, 255), "red"),
            ((0, 128, 0), "green"),
            ((255, 0, 0), "blue"),
            ((0, 0, 0), "black"),
            ((255, 255, 255), "white"),
            ((0, 165, 255), "orange"),
            ((128, 0, 128), "purple"),
            ((128, 128, 128), "gray"),
        ],
    )
    def test_color_identification(
        self,
        detector: ColorDetector,
        color_bgr: tuple[int, int, int],
        expected_name: str,
    ) -> None:
        img = np.full((100, 100, 3), color_bgr, dtype=np.uint8)
        result = detector.detect(img, f"{expected_name}.png")
        assert result.dominant_colors[0].name == expected_name

    @pytest.mark.parametrize(
        "n_colors, expected_count", [
            (0, 1),
            (1, 1),
            (5, 5),
            (10, 10),
            (20, 10),
        ],
    )
    def test_color_count_clamping(
        self,
        n_colors: int,
        expected_count: int,
    ) -> None:
        detector = ColorDetector(n_colors=n_colors)
        img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
        result = detector.detect(img, f"n{n_colors}.png")
        assert len(result.dominant_colors) == expected_count
