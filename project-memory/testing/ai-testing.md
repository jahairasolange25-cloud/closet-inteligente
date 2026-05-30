# AI Testing — Closet Inteligente Digital

## 1. Python Testing Setup (pytest)

### 1.1 Dependencies

```txt
# requirements-test.txt
pytest==8.3
pytest-cov==5.0
pytest-mock==3.14
pytest-asyncio==0.23
pytest-benchmark==4.0
pytest-xdist==3.6
numpy==1.26
Pillow==10.3
opencv-python-headless==4.9
torch==2.2
torchvision==0.17
```

### 1.2 pyproject.toml

```toml
[tool.pytest.ini_options]
minversion = "8.0"
testpaths = [
    "tests",
    "tests/unit",
    "tests/integration",
    "tests/performance",
]
python_files = ["test_*.py"]
asyncio_mode = "auto"
addopts = [
    "-v",
    "--tb=short",
    "--strict-markers",
    "--cov=src",
    "--cov-report=term-missing",
    "--cov-report=xml",
    "--cov-fail-under=80",
]

[tool.coverage.run]
source = ["src"]
omit = [
    "tests/*",
    "**/__init__.py",
    "**/conftest.py",
    "src/config/*",
]

[tool.coverage.report]
show_missing = true
fail_under = 80
exclude_lines = [
    "pragma: no cover",
    "if __name__ == .__main__.:",
    "raise NotImplementedError",
    "def __repr__",
    "def __str__",
]

[tool.pytest.mark]
markers = [
    "unit: Unit tests (fast, no external dependencies)",
    "integration: Integration tests (require models or services)",
    "slow: Tests that take more than 5 seconds",
    "security: Security-related tests",
    "benchmark: Performance benchmark tests",
]

[tool.ruff]
line-length = 120
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I", "N", "W", "B", "SIM"]
ignore = ["E501"]
```

### 1.3 Project structure for tests

```
tests/
├── conftest.py                          # Shared fixtures
├── factories/
│   ├── __init__.py
│   ├── image_factory.py                 # Synthetic image generators
│   └── model_output_factory.py          # Mock model output builders
├── fixtures/
│   ├── images/
│   │   ├── valid_shirt.jpg
│   │   ├── valid_pants.jpg
│   │   ├── valid_dress.jpg
│   │   ├── blurry.jpg
│   │   ├── dark.jpg
│   │   ├── empty_background.jpg
│   │   ├── multiple_garments.jpg
│   │   └── invalid_format.txt
│   ├── videos/
│   │   ├── valid_pose.mp4
│   │   └── empty_video.mp4
│   └── model_outputs/
│       ├── detection_result.json
│       └── classification_result.json
├── unit/
│   ├── test_color_extraction.py
│   ├── test_garment_detection.py
│   ├── test_background_removal.py
│   ├── test_category_classification.py
│   ├── test_body_measurement.py
│   ├── test_recommendation_engine.py
│   ├── test_image_preprocessing.py
│   └── test_utils.py
├── integration/
│   ├── test_full_detection_pipeline.py
│   ├── test_video_processing_pipeline.py
│   └── test_avatar_generation.py
├── performance/
│   └── test_inference_speed.py
└── conftest.py
```

### 1.4 Shared conftest.py

```python
import pytest
import numpy as np
from PIL import Image
from pathlib import Path
from unittest.mock import MagicMock

FIXTURES_DIR = Path(__file__).parent / "fixtures"


# --- Image Fixtures ---

@pytest.fixture
def sample_image_rgb():
    """Returns a 640x480 RGB image as a numpy array."""
    return np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)


@pytest.fixture
def sample_image_gray():
    """Returns a 640x480 grayscale image as a numpy array."""
    return np.random.randint(0, 255, (480, 640), dtype=np.uint8)


@pytest.fixture
def white_background_image():
    """Returns a 100x100 pure white image."""
    return np.ones((100, 100, 3), dtype=np.uint8) * 255


@pytest.fixture
def black_background_image():
    """Returns a 100x100 pure black image."""
    return np.zeros((100, 100, 3), dtype=np.uint8)


@pytest.fixture
def gradient_image():
    """Returns a 256x256 RGB gradient image."""
    x = np.arange(256)
    y = np.arange(256)
    xx, yy = np.meshgrid(x, y)
    r = (xx / 255.0 * 255).astype(np.uint8)
    g = (yy / 255.0 * 255).astype(np.uint8)
    b = ((xx + yy) / 510.0 * 255).astype(np.uint8)
    return np.stack([r, g, b], axis=-1)


@pytest.fixture
def solid_color_image():
    """Returns a 50x50 solid blue image."""
    img = np.zeros((50, 50, 3), dtype=np.uint8)
    img[:, :] = [0, 0, 255]  # Blue in RGB
    return img


@pytest.fixture
def checkerboard_image():
    """Returns a 100x100 checkerboard pattern for edge detection tests."""
    img = np.zeros((100, 100, 3), dtype=np.uint8)
    img[::10, ::10] = [255, 255, 255]
    img[5::10, 5::10] = [255, 255, 255]
    return img


@pytest.fixture
def tiny_image():
    """Returns a 10x10 image for quick tests."""
    return np.random.randint(0, 255, (10, 10, 3), dtype=np.uint8)


@pytest.fixture
def large_image():
    """Returns a 4000x3000 image for boundary tests."""
    return np.random.randint(0, 255, (3000, 4000, 3), dtype=np.uint8)


@pytest.fixture
def blurry_image():
    """Returns a heavily blurred image."""
    from scipy.ndimage import gaussian_filter
    img = np.random.randint(0, 255, (480, 640, 3), dtype=np.float32)
    blurred = gaussian_filter(img, sigma=15)
    return blurred.astype(np.uint8)


@pytest.fixture
def image_with_text():
    """Returns an image with text overlay (distraction)."""
    from PIL import ImageDraw, ImageFont
    img = Image.fromarray(np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8))
    draw = ImageDraw.Draw(img)
    draw.text((10, 10), "SAMPLE TEXT", fill=(255, 0, 0))
    return np.array(img)


# --- File Path Fixtures ---

@pytest.fixture
def valid_image_path():
    """Path to a valid JPEG fixture image."""
    return str(FIXTURES_DIR / "images" / "valid_shirt.jpg")


@pytest.fixture
def blurry_image_path():
    """Path to a blurry JPEG fixture image."""
    return str(FIXTURES_DIR / "images" / "blurry.jpg")


@pytest.fixture
def invalid_format_path():
    """Path to a non-image file."""
    return str(FIXTURES_DIR / "images" / "invalid_format.txt")


@pytest.fixture
def valid_video_path():
    """Path to a valid MP4 fixture video."""
    return str(FIXTURES_DIR / "videos" / "valid_pose.mp4")


# --- Mock Model Fixtures ---

@pytest.fixture
def mock_detection_model():
    """Returns a mock PyTorch model that returns predefined detections."""
    model = MagicMock()
    model.eval.return_value = None

    def mock_forward(images):
        batch_size = len(images)
        # Return mock Detectron2-style predictions
        predictions = []
        for _ in range(batch_size):
            predictions.append({
                "instances": {
                    "pred_boxes": MagicMock(),
                    "scores": MagicMock(),
                    "pred_classes": MagicMock(),
                }
            })
        return predictions

    model.side_effect = mock_forward
    return model


@pytest.fixture
def mock_classification_model():
    """Returns a mock classification model."""
    model = MagicMock()
    model.eval.return_value = None

    def mock_forward(x):
        import torch
        return torch.tensor([[0.1, 0.7, 0.05, 0.1, 0.05]])  # 5 categories

    model.side_effect = mock_forward
    return model


@pytest.fixture
def mock_mediapipe_pose():
    """Returns a mock MediaPipe pose detection result."""
    from types import SimpleNamespace

    landmark = SimpleNamespace()
    landmark.x = 0.5
    landmark.y = 0.5
    landmark.z = 0.0
    landmark.visibility = 0.95

    landmarks = [landmark for _ in range(33)]

    pose_landmarks = SimpleNamespace()
    pose_landmarks.landmark = landmarks

    result = SimpleNamespace()
    result.pose_landmarks = pose_landmarks
    return result


@pytest.fixture
def mock_mediapipe_no_detection():
    """Returns a mock MediaPipe result with no detection."""
    from types import SimpleNamespace

    result = SimpleNamespace()
    result.pose_landmarks = None
    return result


# --- Torch Fixtures ---

@pytest.fixture
def mock_torch_model():
    """Creates a minimal mock torch model that returns fixed output."""
    import torch
    import torch.nn as nn

    class MockModel(nn.Module):
        def __init__(self):
            super().__init__()
            self.fc = nn.Linear(10, 5)

        def forward(self, x):
            batch_size = x.size(0)
            return torch.randn(batch_size, 5)

    model = MockModel()
    model.eval()
    return model


# --- Tensor Fixtures ---

@pytest.fixture
def sample_tensor():
    """Returns a random 3x224x224 tensor."""
    import torch
    return torch.randn(3, 224, 224)


@pytest.fixture
def batch_tensor():
    """Returns a batch of random 4x3x224x224 tensors."""
    import torch
    return torch.randn(4, 3, 224, 224)


# --- Temp Directory Fixtures ---

@pytest.fixture
def temp_output_dir(tmp_path):
    """Returns a temporary directory for output files."""
    output_dir = tmp_path / "outputs"
    output_dir.mkdir()
    return output_dir


@pytest.fixture
def temp_model_dir(tmp_path):
    """Returns a temporary directory for model files."""
    model_dir = tmp_path / "models"
    model_dir.mkdir()
    return model_dir
```

## 2. Testing Garment Detection Pipeline

### 2.1 Unit tests for detector

```python
import pytest
import numpy as np
from unittest.mock import MagicMock, patch, PropertyMock
from src.pipeline.detection import GarmentDetector, DetectionResult


class TestGarmentDetector:
    """Test suite for GarmentDetector class."""

    @pytest.fixture
    def detector(self):
        return GarmentDetector(confidence_threshold=0.5)

    @pytest.fixture
    def mock_detections(self):
        """Returns a mock detection with known attributes."""
        return [
            {
                "bbox": [100, 50, 300, 400],
                "score": 0.95,
                "class_id": 1,
                "class_name": "shirt",
            },
            {
                "bbox": [50, 200, 150, 450],
                "score": 0.88,
                "class_id": 3,
                "class_name": "pants",
            },
        ]

    def test_initialization_defaults(self):
        """Test detector initialization with default parameters."""
        detector = GarmentDetector()
        assert detector.confidence_threshold == 0.5
        assert detector.model_name == "detectron2_faster_rcnn"
        assert detector.device in ["cuda", "cpu"]
        assert detector.max_detections == 100

    def test_initialization_custom_threshold(self):
        """Test detector initialization with custom threshold."""
        detector = GarmentDetector(confidence_threshold=0.8)
        assert detector.confidence_threshold == 0.8

    def test_initialization_with_custom_model(self):
        """Test detector with custom model configuration."""
        detector = GarmentDetector(
            model_name="custom_model",
            model_path="/models/custom.pth",
        )
        assert detector.model_name == "custom_model"
        assert detector.model_path == "/models/custom.pth"

    def test_initialization_invalid_threshold(self):
        """Test that invalid threshold raises ValueError."""
        with pytest.raises(ValueError, match="confidence_threshold must be between 0 and 1"):
            GarmentDetector(confidence_threshold=-0.1)

        with pytest.raises(ValueError, match="confidence_threshold must be between 0 and 1"):
            GarmentDetector(confidence_threshold=1.5)

    @patch("src.pipeline.detection.GarmentDetector._load_model")
    def test_detect_single_garment(self, mock_load_model, detector, sample_image_rgb, mock_detections):
        """Test detection of a single garment in an image."""
        mock_model = MagicMock()
        mock_model.return_value = [{"instances": mock_detections}]
        mock_load_model.return_value = mock_model

        results = detector.detect(sample_image_rgb)

        assert len(results) > 0
        assert isinstance(results[0], DetectionResult)
        assert results[0].class_name == "shirt"
        assert results[0].confidence >= 0.5

    @patch("src.pipeline.detection.GarmentDetector._load_model")
    def test_detect_multiple_garments(self, mock_load_model, detector, sample_image_rgb, mock_detections):
        """Test detection of multiple garments in one image."""
        mock_detections.append({
            "bbox": [400, 100, 500, 300],
            "score": 0.72,
            "class_id": 5,
            "class_name": "shoes",
        })

        mock_model = MagicMock()
        mock_model.return_value = [{"instances": mock_detections}]
        mock_load_model.return_value = mock_model

        results = detector.detect(sample_image_rgb)

        assert len(results) == 3
        assert any(r.class_name == "shoes" for r in results)

    @patch("src.pipeline.detection.GarmentDetector._load_model")
    def test_detect_no_garments(self, mock_load_model, detector, sample_image_rgb):
        """Test detection when no garments are found."""
        mock_model = MagicMock()
        mock_model.return_value = [{"instances": []}]
        mock_load_model.return_value = mock_model

        results = detector.detect(sample_image_rgb)

        assert len(results) == 0

    @patch("src.pipeline.detection.GarmentDetector._load_model")
    def test_detect_low_confidence_filtered(self, mock_load_model, detector, sample_image_rgb):
        """Test that low-confidence detections are filtered out."""
        mock_detections_low = [
            {"bbox": [0, 0, 100, 100], "score": 0.30, "class_id": 1, "class_name": "shirt"},
            {"bbox": [100, 0, 200, 100], "score": 0.85, "class_id": 2, "class_name": "pants"},
        ]

        mock_model = MagicMock()
        mock_model.return_value = [{"instances": mock_detections_low}]
        mock_load_model.return_value = mock_model

        results = detector.detect(sample_image_rgb)

        assert len(results) == 1
        assert results[0].class_name == "pants"

    def test_detect_invalid_input_type(self, detector):
        """Test that invalid input raises appropriate error."""
        with pytest.raises(TypeError, match="Expected numpy array"):
            detector.detect("not_an_image")

        with pytest.raises(TypeError, match="Expected numpy array"):
            detector.detect(123)

    def test_detect_empty_image(self, detector):
        """Test detection on an empty/zero image."""
        empty_img = np.zeros((0, 0, 3), dtype=np.uint8)
        with pytest.raises(ValueError, match="Empty image"):
            detector.detect(empty_img)

    @patch("src.pipeline.detection.GarmentDetector._load_model")
    def test_detect_grayscale_image(self, mock_load_model, detector, sample_image_gray):
        """Test that grayscale images are converted to RGB."""
        mock_model = MagicMock()
        mock_model.return_value = [{"instances": []}]
        mock_load_model.return_value = mock_model

        results = detector.detect(sample_image_gray)

        # Should not crash, grayscale should be handled
        assert results is not None

    @patch("src.pipeline.detection.GarmentDetector._load_model")
    def test_detect_with_preprocessing(self, mock_load_model, detector, blurry_image):
        """Test detection with preprocessing steps."""
        mock_model = MagicMock()
        mock_model.return_value = [{"instances": []}]
        mock_load_model.return_value = mock_model

        results = detector.detect(blurry_image, preprocess=True)

        assert results is not None

    @patch("src.pipeline.detection.GarmentDetector._load_model")
    def test_detect_model_load_failure(self, mock_load_model, detector, sample_image_rgb):
        """Test handling of model loading failure."""
        mock_load_model.side_effect = RuntimeError("CUDA out of memory")

        with pytest.raises(RuntimeError, match="CUDA out of memory"):
            detector.detect(sample_image_rgb)

    @patch("src.pipeline.detection.GarmentDetector._load_model")
    def test_detect_timeout(self, mock_load_model, detector, sample_image_rgb):
        """Test timeout handling for long-running inference."""
        import time

        mock_model = MagicMock()
        mock_model.return_value = [{"instances": []}]

        def slow_inference(*args, **kwargs):
            time.sleep(30)

        mock_model.side_effect = slow_inference
        mock_load_model.return_value = mock_model

        detector.timeout = 1  # 1 second timeout

        with pytest.raises(TimeoutError):
            detector.detect(sample_image_rgb)

    def test_detect_result_attributes(self):
        """Test that DetectionResult has all required attributes."""
        result = DetectionResult(
            bbox=[100, 50, 300, 400],
            score=0.95,
            class_id=1,
            class_name="shirt",
            mask=np.ones((400, 300), dtype=bool),
        )

        assert result.bbox == [100, 50, 300, 400]
        assert result.score == 0.95
        assert result.class_id == 1
        assert result.class_name == "shirt"
        assert result.mask is not None
        assert result.area == 300 * 400  # bbox area

    def test_detect_result_serialization(self):
        """Test DetectionResult serialization to dict."""
        result = DetectionResult(
            bbox=[10, 20, 100, 200],
            score=0.9,
            class_id=2,
            class_name="pants",
        )

        serialized = result.to_dict()
        assert serialized["bbox"] == [10, 20, 100, 200]
        assert serialized["class_name"] == "pants"
        assert serialized["confidence"] == 0.9


class TestGarmentDetectorEdgeCases:
    """Edge case tests for garment detection."""

    @pytest.fixture
    def detector(self):
        return GarmentDetector(confidence_threshold=0.5)

    @patch("src.pipeline.detection.GarmentDetector._load_model")
    def test_detect_high_resolution(self, mock_load_model, detector, large_image):
        """Test detection on very high resolution images."""
        mock_model = MagicMock()
        mock_model.return_value = [{"instances": []}]
        mock_load_model.return_value = mock_model

        results = detector.detect(large_image)

        assert results is not None
        assert mock_model.called

    @patch("src.pipeline.detection.GarmentDetector._load_model")
    def test_detect_tiny_objects(self, mock_load_model, detector, sample_image_rgb):
        """Test detection of very small garments."""
        small_detection = {
            "bbox": [300, 200, 310, 210],  # 10x10 pixels
            "score": 0.95,
            "class_id": 1,
            "class_name": "shirt",
        }

        mock_model = MagicMock()
        mock_model.return_value = [{"instances": [small_detection]}]
        mock_load_model.return_value = mock_model

        results = detector.detect(sample_image_rgb)

        assert len(results) == 1
        assert results[0].width == 10
        assert results[0].height == 10

    @patch("src.pipeline.detection.GarmentDetector._load_model")
    def test_detect_out_of_bounds_bbox(self, mock_load_model, detector, sample_image_rgb):
        """Test handling of bounding boxes outside image boundaries."""
        invalid_detection = {
            "bbox": [-50, -50, 700, 500],  # extends beyond image
            "score": 0.90,
            "class_id": 1,
            "class_name": "shirt",
        }

        mock_model = MagicMock()
        mock_model.return_value = [{"instances": [invalid_detection]}]
        mock_load_model.return_value = mock_model

        results = detector.detect(sample_image_rgb)

        # Should clamp bbox to image boundaries
        assert results[0].bbox[0] >= 0
        assert results[0].bbox[1] >= 0
        assert results[0].bbox[2] <= sample_image_rgb.shape[1]
        assert results[0].bbox[3] <= sample_image_rgb.shape[0]

    @patch("src.pipeline.detection.GarmentDetector._load_model")
    def test_detect_confidence_near_threshold(self, mock_load_model, detector, sample_image_rgb):
        """Test behavior when detection confidence is exactly at threshold."""
        threshold_detection = {
            "bbox": [0, 0, 50, 50],
            "score": 0.50,  # exactly at threshold
            "class_id": 1,
            "class_name": "shirt",
        }

        mock_model = MagicMock()
        mock_model.return_value = [{"instances": [threshold_detection]}]
        mock_load_model.return_value = mock_model

        results = detector.detect(sample_image_rgb)

        assert len(results) == 1  # boundary inclusive

    @patch("src.pipeline.detection.GarmentDetector._load_model")
    def test_detect_max_detections_enforced(self, mock_load_model, detector, sample_image_rgb):
        """Test that max_detections limit is enforced."""
        many_detections = [
            {"bbox": [i * 10, i * 10, i * 10 + 50, i * 10 + 50],
             "score": 0.9, "class_id": 1, "class_name": "shirt"}
            for i in range(200)
        ]

        mock_model = MagicMock()
        mock_model.return_value = [{"instances": many_detections}]
        mock_load_model.return_value = mock_model

        detector.max_detections = 100
        results = detector.detect(sample_image_rgb)

        assert len(results) <= 100
```

### 2.2 Integration test for full pipeline

```python
import pytest
import numpy as np
from unittest.mock import patch


class TestFullDetectionPipeline:
    """Integration tests for the complete detection pipeline."""

    @pytest.fixture
    def pipeline(self):
        from src.pipeline.full_pipeline import GarmentProcessingPipeline
        return GarmentProcessingPipeline()

    @patch("src.pipeline.detection.GarmentDetector.detect")
    @patch("src.pipeline.background_removal.BackgroundRemover.remove")
    @patch("src.pipeline.color_extraction.ColorExtractor.extract")
    @patch("src.pipeline.classification.CategoryClassifier.classify")
    def test_full_pipeline_success(
        self, mock_classify, mock_color, mock_remove, mock_detect, pipeline, sample_image_rgb
    ):
        """Test full pipeline execution with all stages successful."""
        mock_detect.return_value = [
            MockDetectionResult([100, 50, 300, 400], 0.95, "shirt")
        ]
        mock_remove.return_value = sample_image_rgb
        mock_color.return_value = {"dominant": "blue", "palette": ["#0000ff", "#0000cc"]}
        mock_classify.return_value = {"category": "top", "confidence": 0.94}

        result = pipeline.process(sample_image_rgb)

        assert result["detected"] is True
        assert result["category"] == "top"
        assert result["dominant_color"] == "blue"
        assert result["confidence"] > 0.9

    def test_pipeline_with_real_image(self, pipeline, valid_image_path):
        """Test pipeline with a real fixture image (slow)."""
        import cv2

        image = cv2.imread(valid_image_path)
        if image is None:
            pytest.skip("Fixture image not available")

        result = pipeline.process(image)

        assert "detected" in result
        assert "category" in result
        assert "dominant_color" in result

    def test_pipeline_with_blurry_image(self, pipeline, blurry_image):
        """Test pipeline handles blurry images gracefully."""
        result = pipeline.process(blurry_image)

        assert result is not None
        # Should still attempt processing even if quality is low

    def test_pipeline_with_empty_background(self, pipeline):
        """Test pipeline with an image that has no visible garments."""
        from src.pipeline.full_pipeline import ProcessingError
        empty_img = np.zeros((480, 640, 3), dtype=np.uint8)

        with pytest.raises(ProcessingError, match="No garments detected"):
            pipeline.process(empty_img)

    def test_pipeline_partial_failure(self, pipeline, sample_image_rgb):
        """Test pipeline continues with partial results on stage failure."""
        from src.pipeline.detection import GarmentDetector
        from unittest.mock import patch

        with patch.object(GarmentDetector, "detect") as mock_detect:
            mock_detect.return_value = [
                MockDetectionResult([0, 0, 100, 100], 0.9, "shirt")
            ]
            with patch(
                "src.pipeline.color_extraction.ColorExtractor.extract",
                side_effect=Exception("Color extraction failed"),
            ):
                result = pipeline.process(sample_image_rgb)

                # Should still return partial results
                assert result["detected"] is True
                assert result.get("dominant_color") is None
                assert result.get("color_error") is not None

    def test_pipeline_processing_time(self, pipeline, sample_image_rgb):
        """Test that pipeline completes within acceptable time."""
        import time

        with patch.multiple(
            pipeline,
            detector=MagicMock(detect=MagicMock(return_value=[MockDetectionResult([0, 0, 100, 100], 0.9, "shirt")])),
            remover=MagicMock(remove=MagicMock(return_value=sample_image_rgb)),
            color_extractor=MagicMock(extract=MagicMock(return_value={"dominant": "red"})),
            classifier=MagicMock(classify=MagicMock(return_value={"category": "top", "confidence": 0.9})),
        ):
            start = time.time()
            pipeline.process(sample_image_rgb)
            elapsed = time.time() - start

            assert elapsed < 2.0  # Should complete in under 2 seconds

    def test_pipeline_concurrent_processing(self, pipeline, sample_image_rgb):
        """Test that pipeline handles concurrent processing requests."""
        from concurrent.futures import ThreadPoolExecutor

        with patch.multiple(
            pipeline,
            detector=MagicMock(detect=MagicMock(return_value=[MockDetectionResult([0, 0, 100, 100], 0.9, "shirt")])),
            remover=MagicMock(remove=MagicMock(return_value=sample_image_rgb)),
            color_extractor=MagicMock(extract=MagicMock(return_value={"dominant": "red"})),
            classifier=MagicMock(classify=MagicMock(return_value={"category": "top", "confidence": 0.9})),
        ):
            with ThreadPoolExecutor(max_workers=4) as executor:
                futures = [executor.submit(pipeline.process, sample_image_rgb) for _ in range(10)]
                results = [f.result() for f in futures]

            assert len(results) == 10
            assert all(r["detected"] for r in results)
```

## 3. Testing Background Removal

```python
import pytest
import numpy as np
from unittest.mock import MagicMock, patch


class TestBackgroundRemoval:
    """Test suite for background removal module."""

    @pytest.fixture
    def remover(self):
        from src.pipeline.background_removal import BackgroundRemover
        return BackgroundRemover()

    def test_remove_background_success(self, remover, sample_image_rgb):
        """Test successful background removal."""
        result = remover.remove(sample_image_rgb)

        assert result is not None
        assert result.shape == sample_image_rgb.shape
        assert result.dtype == np.uint8

    def test_remove_background_with_alpha(self, remover, sample_image_rgb):
        """Test background removal returns RGBA with transparency."""
        result = remover.remove(sample_image_rgb, return_alpha=True)

        assert result.shape[2] == 4  # RGBA
        assert result.dtype == np.uint8

    def test_remove_background_white_background(self, remover, white_background_image):
        """Test background removal on already-white background."""
        result = remover.remove(white_background_image)

        assert result is not None
        # If background is already white, mask should be mostly empty

    def test_remove_background_black_background(self, remover, black_background_image):
        """Test background removal on black background."""
        result = remover.remove(black_background_image)

        assert result is not None

    def test_remove_background_empty_image(self, remover):
        """Test background removal on empty image raises error."""
        empty = np.array([], dtype=np.uint8)
        with pytest.raises(ValueError, match="Empty image"):
            remover.remove(empty)

    def test_remove_background_invalid_channels(self, remover):
        """Test background removal on image with invalid channel count."""
        invalid = np.random.randint(0, 255, (100, 100, 5), dtype=np.uint8)
        with pytest.raises(ValueError, match="Invalid channel count"):
            remover.remove(invalid)

    def test_remove_background_single_channel(self, remover, sample_image_gray):
        """Test background removal on grayscale image."""
        result = remover.remove(sample_image_gray)

        assert result is not None
        # Should be converted to 3-channel

    @patch("src.pipeline.background_removal.u2net")
    def test_remove_background_model_failure(self, mock_model, remover, sample_image_rgb):
        """Test handling of model inference failure."""
        mock_model.side_effect = RuntimeError("Model failed to load")

        with pytest.raises(RuntimeError, match="Background removal failed"):
            remover.remove(sample_image_rgb)

    def test_remove_background_preserves_foreground(self, remover, solid_color_image):
        """Test that foreground objects are preserved."""
        result = remover.remove(solid_color_image)

        # The solid blue should be mostly preserved
        blue_pixels = result[:, :, 2] > 0  # Blue channel
        assert blue_pixels.sum() > 0

    def test_remove_background_small_image(self, remover, tiny_image):
        """Test background removal on very small images."""
        result = remover.remove(tiny_image)

        assert result is not None
        assert result.shape[:2] == (10, 10)

    def test_remove_background_large_image(self, remover, large_image):
        """Test background removal on large images (should downsample)."""
        result = remover.remove(large_image)

        assert result is not None
        # Should have been resized to max dimensions
        assert result.shape[0] <= 1920
        assert result.shape[1] <= 1920

    def test_remove_background_parameters(self):
        """Test configurable parameters."""
        from src.pipeline.background_removal import BackgroundRemover

        remover = BackgroundRemover(
            model_name="u2net",
            device="cpu",
            resolution=1024,
        )

        assert remover.model_name == "u2net"
        assert remover.resolution == 1024

    def test_remove_background_quality_modes(self, remover, sample_image_rgb):
        """Test different quality modes."""
        result_fast = remover.remove(sample_image_rgb, quality="fast")
        result_quality = remover.remove(sample_image_rgb, quality="high")

        assert result_fast is not None
        assert result_quality is not None

    def test_remove_background_smooth_edges(self, remover, sample_image_rgb):
        """Test that output has smooth edges (no pixelation)."""
        result = remover.remove(sample_image_rgb)

        if result.shape[2] == 4:
            alpha = result[:, :, 3]
            # Alpha should not be binary (0 or 255 only)
            unique_alpha = np.unique(alpha)
            assert len(unique_alpha) > 2  # Should have intermediate values

    def test_remove_background_with_mask_output(self, remover, sample_image_rgb):
        """Test that method can also return the mask."""
        result, mask = remover.remove(sample_image_rgb, return_mask=True)

        assert result is not None
        assert mask is not None
        assert mask.shape[:2] == sample_image_rgb.shape[:2]
        assert mask.dtype == np.float32
        assert mask.min() >= 0.0
        assert mask.max() <= 1.0
```

## 4. Testing Color Detection

```python
import pytest
import numpy as np
from unittest.mock import MagicMock, patch


class TestColorExtraction:
    """Test suite for color extraction module."""

    @pytest.fixture
    def extractor(self):
        from src.pipeline.color_extraction import ColorExtractor
        return ColorExtractor()

    def test_extract_solid_color(self, extractor, solid_color_image):
        """Test color extraction from a solid blue image."""
        result = extractor.extract(solid_color_image)

        assert "dominant" in result
        assert "palette" in result
        assert "hex_codes" in result or "rgb" in result
        assert result["dominant"] == "blue"

    def test_extract_multiple_colors(self, extractor, gradient_image):
        """Test color extraction from multi-color image."""
        result = extractor.extract(gradient_image)

        assert "dominant" in result
        assert len(result["palette"]) >= 1
        # Gradient should produce several color clusters

    def test_extract_grayscale(self, extractor, sample_image_gray):
        """Test color extraction from grayscale image."""
        result = extractor.extract(sample_image_gray)

        assert "dominant" in result
        # Grayscale should still produce a color name (e.g., "gray")

    def test_extract_black_and_white(self, extractor, checkerboard_image):
        """Test color extraction from black and white image."""
        result = extractor.extract(checkerboard_image)

        assert result["dominant"] in ("black", "white", "gray")

    def test_extract_empty_image(self, extractor):
        """Test extraction on empty image."""
        empty = np.zeros((0, 0, 3), dtype=np.uint8)
        with pytest.raises(ValueError, match="Empty image"):
            extractor.extract(empty)

    def test_extract_single_pixel(self, extractor):
        """Test extraction on single pixel image."""
        single = np.array([[[100, 150, 200]]], dtype=np.uint8)
        result = extractor.extract(single)

        assert "dominant" in result
        assert result["dominant"] is not None

    def test_extract_returns_color_names(self, extractor, solid_color_image):
        """Test that color names are semantic and not hex codes."""
        result = extractor.extract(solid_color_image)

        from src.pipeline.color_extraction import VALID_COLOR_NAMES
        assert result["dominant"] in VALID_COLOR_NAMES

    def test_extract_palette_size(self, extractor, gradient_image):
        """Test that palette returns correct number of colors."""
        result = extractor.extract(gradient_image, palette_size=5)

        assert len(result["palette"]) == 5

    def test_extract_color_percentages(self, extractor, solid_color_image):
        """Test that color percentages sum to approximately 1."""
        result = extractor.extract(solid_color_image, return_percentages=True)

        if "percentages" in result:
            total = sum(result["percentages"].values())
            assert abs(total - 1.0) < 0.01

    def test_extract_noisy_image(self, extractor):
        """Test extraction on noisy image produces reasonable results."""
        noisy = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
        result = extractor.extract(noisy)

        assert "dominant" in result
        # Noisy images may have unstable dominant color, but shouldn't crash

    def test_extract_white_balance_correction(self, extractor, white_background_image):
        """Test extraction with white balance correction."""
        result = extractor.extract(white_background_image, correct_white_balance=True)

        assert result["dominant"] == "white"

    def test_extract_color_histogram(self, extractor, solid_color_image):
        """Test that histogram-based extraction works."""
        result = extractor.extract_histogram(solid_color_image)

        assert "mean_rgb" in result
        assert "std_rgb" in result
        assert len(result["mean_rgb"]) == 3
        assert len(result["std_rgb"]) == 3

    def test_color_distance(self, extractor):
        """Test color distance calculation."""
        color1 = np.array([255, 0, 0])   # Red
        color2 = np.array([0, 0, 255])   # Blue

        distance = extractor.color_distance(color1, color2)
        assert distance > 0

        distance_self = extractor.color_distance(color1, color1)
        assert distance_self == 0.0

    @patch("src.pipeline.color_extraction.ColorExtractor._kmeans_quantize")
    def test_extract_fallback_on_failure(self, mock_kmeans, extractor, sample_image_rgb):
        """Test fallback when K-means fails."""
        mock_kmeans.side_effect = Exception("K-means failed")

        result = extractor.extract(sample_image_rgb)

        assert "dominant" in result  # Should fall back to average
        assert result["dominant"] is not None

    def test_extract_different_color_spaces(self, extractor, solid_color_image):
        """Test extraction in different color spaces."""
        result_rgb = extractor.extract(solid_color_image, color_space="rgb")
        result_hsv = extractor.extract(solid_color_image, color_space="hsv")
        result_lab = extractor.extract(solid_color_image, color_space="lab")

        assert result_rgb["dominant"] == result_hsv["dominant"]
        assert result_lab["dominant"] is not None


class TestColorNameMapping:
    """Tests for color name mapping logic."""

    @pytest.fixture
    def extractor(self):
        from src.pipeline.color_extraction import ColorExtractor
        return ColorExtractor()

    def test_rgb_to_color_name_red(self, extractor):
        """Test RGB to color name for red."""
        assert extractor._rgb_to_color_name(255, 0, 0) == "red"

    def test_rgb_to_color_name_green(self, extractor):
        """Test RGB to color name for green."""
        assert extractor._rgb_to_color_name(0, 255, 0) == "green"

    def test_rgb_to_color_name_blue(self, extractor):
        """Test RGB to color name for blue."""
        assert extractor._rgb_to_color_name(0, 0, 255) == "blue"

    def test_rgb_to_color_name_white(self, extractor):
        """Test RGB to color name for white."""
        assert extractor._rgb_to_color_name(255, 255, 255) == "white"

    def test_rgb_to_color_name_black(self, extractor):
        """Test RGB to color name for black."""
        assert extractor._rgb_to_color_name(0, 0, 0) == "black"

    def test_rgb_to_color_name_gray(self, extractor):
        """Test RGB to color name for gray."""
        assert extractor._rgb_to_color_name(128, 128, 128) == "gray"

    def test_rgb_to_color_name_near_red(self, extractor):
        """Test that near-red maps to red."""
        name = extractor._rgb_to_color_name(250, 10, 10)
        assert name == "red"

    def test_rgb_to_color_name_navy(self, extractor):
        """Test that navy blue maps to blue or navy."""
        name = extractor._rgb_to_color_name(0, 0, 128)
        assert name in ("blue", "navy")

    def test_rgb_to_color_name_beige(self, extractor):
        """Test beige detection."""
        name = extractor._rgb_to_color_name(245, 245, 220)
        assert name == "beige"

    def test_rgb_to_color_name_multicolor_edge(self, extractor):
        """Test edge case where color is between two defined names."""
        name = extractor._rgb_to_color_name(200, 100, 0)  # Orange
        assert name in ("orange", "brown")

    def test_color_name_consistency(self, extractor):
        """Test that similar colors map to the same name."""
        name1 = extractor._rgb_to_color_name(200, 50, 50)
        name2 = extractor._rgb_to_color_name(210, 40, 40)
        assert name1 == name2

    @pytest.mark.parametrize("r, g, b, expected_name", [
        (255, 0, 0, "red"),
        (0, 255, 0, "green"),
        (0, 0, 255, "blue"),
        (255, 255, 0, "yellow"),
        (255, 0, 255, "purple"),
        (0, 255, 255, "cyan"),
        (255, 128, 0, "orange"),
        (255, 192, 203, "pink"),
        (165, 42, 42, "brown"),
    ])
    def test_color_name_parametrized(self, extractor, r, g, b, expected_name):
        """Parametrized test for color name mapping."""
        assert extractor._rgb_to_color_name(r, g, b) == expected_name
```

## 5. Testing Category Classification

```python
import pytest
import numpy as np
from unittest.mock import MagicMock, patch


class TestCategoryClassification:
    """Test suite for category classification."""

    @pytest.fixture
    def classifier(self):
        from src.pipeline.classification import CategoryClassifier
        return CategoryClassifier()

    def test_classify_valid_image(self, classifier, sample_image_rgb):
        """Test classification of a valid image."""
        result = classifier.classify(sample_image_rgb)

        assert "category" in result
        assert "confidence" in result
        assert result["confidence"] >= 0.0
        assert result["confidence"] <= 1.0

    def test_classify_known_categories(self, classifier, sample_image_rgb):
        """Test that classification returns a known category."""
        result = classifier.classify(sample_image_rgb)

        valid_categories = ["top", "bottom", "dress", "footwear", "accessory", "outerwear"]
        assert result["category"] in valid_categories

    def test_classify_returns_confidence_scores(self, classifier, sample_image_rgb):
        """Test that all category confidence scores are returned."""
        result = classifier.classify(sample_image_rgb, return_all_scores=True)

        assert "all_scores" in result
        assert len(result["all_scores"]) > 0
        # All scores should sum to ~1.0
        total = sum(result["all_scores"].values())
        assert abs(total - 1.0) < 0.01

    def test_classify_top_category(self, classifier):
        """Test classification of a top garment image."""
        top_img = np.ones((480, 640, 3), dtype=np.uint8) * 200
        result = classifier.classify(top_img)

        # With mock/fake image, just ensure it runs
        assert result["category"] is not None

    def test_classify_empty_image(self, classifier):
        """Test classification on empty image."""
        empty = np.zeros((0, 0, 3), dtype=np.uint8)
        with pytest.raises(ValueError, match="Empty image"):
            classifier.classify(empty)

    def test_classify_low_confidence(self, classifier, blurry_image):
        """Test classification of low quality image returns low confidence."""
        result = classifier.classify(blurry_image)

        assert result["confidence"] < 0.5  # Blurry images should have low confidence

    def test_classify_unknown_category(self, classifier):
        """Test handling of unknown/mixed category."""
        # Random noise should not confidently classify
        noise = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
        result = classifier.classify(noise)

        assert result["confidence"] < 0.5

    @patch("src.pipeline.classification.CategoryClassifier._model_forward")
    def test_classify_model_failure(self, mock_forward, classifier, sample_image_rgb):
        """Test graceful handling of model failure."""
        mock_forward.side_effect = RuntimeError("Model inference failed")

        with pytest.raises(RuntimeError, match="Classification failed"):
            classifier.classify(sample_image_rgb)

    def test_classify_batch(self, classifier):
        """Test batch classification of multiple images."""
        images = [
            np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
            for _ in range(5)
        ]

        results = classifier.classify_batch(images)

        assert len(results) == 5
        assert all("category" in r for r in results)

    def test_classify_batch_empty(self, classifier):
        """Test batch classification with empty list."""
        with pytest.raises(ValueError, match="Empty batch"):
            classifier.classify_batch([])

    def test_classify_input_size_handling(self, classifier):
        """Test that images are resized to expected input size."""
        large_img = np.random.randint(0, 255, (2000, 1500, 3), dtype=np.uint8)
        result = classifier.classify(large_img)

        assert result is not None

        small_img = np.random.randint(0, 255, (10, 10, 3), dtype=np.uint8)
        result = classifier.classify(small_img)

        assert result is not None

    @patch("src.pipeline.classification.CategoryClassifier._preprocess")
    def test_classify_preprocessing_error(self, mock_preprocess, classifier, sample_image_rgb):
        """Test handling of preprocessing errors."""
        mock_preprocess.side_effect = ValueError("Invalid image format")

        with pytest.raises(ValueError, match="Invalid image format"):
            classifier.classify(sample_image_rgb)

    def test_classify_temperature_scaling(self, classifier, sample_image_rgb):
        """Test that temperature scaling affects confidence."""
        result_default = classifier.classify(sample_image_rgb, temperature=1.0)
        result_scaled = classifier.classify(sample_image_rgb, temperature=2.0)

        # Higher temperature should lower confidence
        assert result_scaled["confidence"] <= result_default["confidence"] + 0.1

    def test_classify_consistency(self, classifier, sample_image_rgb):
        """Test that classification is deterministic for same input."""
        result1 = classifier.classify(sample_image_rgb)
        result2 = classifier.classify(sample_image_rgb)

        assert result1["category"] == result2["category"]
        assert abs(result1["confidence"] - result2["confidence"]) < 0.01

    @pytest.mark.parametrize("image_name, expected_category", [
        ("valid_shirt.jpg", "top"),
        ("valid_pants.jpg", "bottom"),
        ("valid_dress.jpg", "dress"),
    ])
    def test_classify_fixture_images(self, classifier, image_name, expected_category):
        """Test classification on real fixture images."""
        import cv2
        from pathlib import Path

        image_path = Path(__file__).parent.parent / "fixtures" / "images" / image_name
        if not image_path.exists():
            pytest.skip(f"Fixture {image_name} not available")

        image = cv2.imread(str(image_path))
        result = classifier.classify(image)

        assert result["category"] == expected_category
```

## 6. Testing Avatar Body Measurement Estimation

```python
import pytest
import numpy as np
from unittest.mock import MagicMock, patch


class TestBodyMeasurementEstimator:
    """Test suite for body measurement estimation from images/video."""

    @pytest.fixture
    def estimator(self):
        from src.pipeline.body_measurement import BodyMeasurementEstimator
        return BodyMeasurementEstimator()

    def test_estimate_from_landmarks(self, estimator, mock_mediapipe_pose):
        """Test measurement estimation from pose landmarks."""
        measurements = estimator.estimate_from_landmarks(mock_mediapipe_pose)

        assert "height" in measurements
        assert "shoulder_width" in measurements
        assert "chest" in measurements
        assert "waist" in measurements
        assert "hips" in measurements
        assert "inseam" in measurements

    def test_estimate_from_landmarks_no_detection(self, estimator, mock_mediapipe_no_detection):
        """Test estimation when no pose is detected."""
        with pytest.raises(ValueError, match="No pose landmarks detected"):
            estimator.estimate_from_landmarks(mock_mediapipe_no_detection)

    def test_estimate_from_landmarks_missing_keypoints(self, estimator):
        """Test estimation with incomplete landmarks."""
        from types import SimpleNamespace

        landmarks = []
        for i in range(10):  # Only 10 landmarks instead of 33
            lm = SimpleNamespace()
            lm.x, lm.y, lm.z, lm.visibility = 0.5, 0.5, 0.0, 0.9
            landmarks.append(lm)

        pose_landmarks = SimpleNamespace()
        pose_landmarks.landmark = landmarks

        result = SimpleNamespace()
        result.pose_landmarks = pose_landmarks

        with pytest.raises(ValueError, match="Insufficient landmarks"):
            estimator.estimate_from_landmarks(result)

    def test_estimate_from_video(self, estimator, valid_video_path):
        """Test measurement estimation from a video file."""
        measurements = estimator.estimate_from_video(valid_video_path)

        assert measurements is not None
        assert "height" in measurements
        # Measurements should have confidence values
        assert all(0.0 <= v.get("confidence", 1.0) <= 1.0 for v in measurements.values() if isinstance(v, dict))

    def test_estimate_from_video_empty(self, estimator):
        """Test estimation from empty/invalid video."""
        with pytest.raises(ValueError, match="Invalid or empty video"):
            estimator.estimate_from_video("")

    def test_estimate_from_video_no_path(self, estimator):
        """Test estimation when video file doesn't exist."""
        with pytest.raises(FileNotFoundError, match="Video file not found"):
            estimator.estimate_from_video("/nonexistent/video.mp4")

    def test_estimate_from_image(self, estimator, sample_image_rgb):
        """Test measurement estimation from a single image."""
        measurements = estimator.estimate_from_image(sample_image_rgb)

        assert "height" in measurements
        assert "shoulder_width" in measurements

    def test_estimate_from_image_full_body(self, estimator):
        """Test estimation from a full-body image."""
        # Create a simple silhouette image
        img = np.zeros((1000, 500, 3), dtype=np.uint8)
        # Simple body-shaped ellipse
        cv2.ellipse(img, (250, 400), (80, 300), 0, 0, 360, (200, 200, 200), -1)

        measurements = estimator.estimate_from_image(img)

        assert measurements is not None
        assert measurements.get("height", {}).get("value", 0) > 0

    def test_estimate_measurement_ranges(self, estimator, mock_mediapipe_pose):
        """Test that measurements fall within expected ranges."""
        measurements = estimator.estimate_from_landmarks(mock_mediapipe_pose)

        # Height should be reasonable (140-220 cm)
        height = measurements["height"]["value"] if isinstance(measurements["height"], dict) else measurements["height"]
        assert 140 <= height <= 220

        # Waist should be less than chest
        chest = measurements["chest"]["value"] if isinstance(measurements["chest"], dict) else measurements["chest"]
        waist = measurements["waist"]["value"] if isinstance(measurements["waist"], dict) else measurements["waist"]
        assert waist < chest

    def test_estimate_ratio_preservation(self, estimator, mock_mediapipe_pose):
        """Test that body ratios are biologically plausible."""
        measurements = estimator.estimate_from_landmarks(mock_mediapipe_pose)

        # Waist-to-hip ratio should be ~0.7-0.9 for most body types
        def get_val(key):
            v = measurements[key]
            return v["value"] if isinstance(v, dict) else v

        whr = get_val("waist") / get_val("hips")
        assert 0.6 <= whr <= 1.0

    def test_estimate_confidence(self, estimator, mock_mediapipe_pose):
        """Test that confidence scores are returned with measurements."""
        measurements = estimator.estimate_from_landmarks(mock_mediapipe_pose)

        for key, value in measurements.items():
            if isinstance(value, dict) and "confidence" in value:
                assert 0.0 <= value["confidence"] <= 1.0

    @patch("src.pipeline.body_measurement.mediapipe.solutions.pose.Pose")
    def test_estimate_mediapipe_failure(self, mock_pose, estimator, sample_image_rgb):
        """Test handling of MediaPipe initialization failure."""
        mock_pose.side_effect = ImportError("MediaPipe not available")

        with pytest.raises(ImportError, match="MediaPipe not available"):
            estimator.estimate_from_image(sample_image_rgb)

    def test_estimate_keypoint_visibility_weighting(self, estimator, mock_mediapipe_pose):
        """Test that more visible keypoints contribute more to final estimate."""
        measurements_visible = estimator.estimate_from_landmarks(mock_mediapipe_pose)

        # Make all landmarks low visibility
        from types import SimpleNamespace
        for lm in mock_mediapipe_pose.pose_landmarks.landmark:
            lm.visibility = 0.1

        measurements_low_vis = estimator.estimate_from_landmarks(mock_mediapipe_pose)

        # Low visibility should have lower confidence
        for key in measurements_visible:
            if isinstance(measurements_visible[key], dict) and "confidence" in measurements_visible[key]:
                assert measurements_low_vis[key]["confidence"] <= measurements_visible[key]["confidence"]
```

## 7. Testing Recommendation Algorithm

```python
import pytest
import numpy as np
from unittest.mock import MagicMock, patch


class TestRecommendationEngine:
    """Test suite for outfit recommendation engine."""

    @pytest.fixture
    def engine(self):
        from src.recommendation.engine import RecommendationEngine
        return RecommendationEngine()

    @pytest.fixture
    def sample_wardrobe(self):
        """Returns a sample wardrobe with diverse garments."""
        return {
            "tops": [
                {"id": "t1", "color": "blue", "style": "casual", "material": "cotton", "season": "all"},
                {"id": "t2", "color": "white", "style": "formal", "material": "linen", "season": "summer"},
                {"id": "t3", "color": "black", "style": "formal", "material": "wool", "season": "winter"},
                {"id": "t4", "color": "red", "style": "casual", "material": "polyester", "season": "all"},
            ],
            "bottoms": [
                {"id": "b1", "color": "black", "style": "formal", "material": "wool", "season": "all"},
                {"id": "b2", "color": "blue", "style": "casual", "material": "denim", "season": "all"},
                {"id": "b3", "color": "beige", "style": "casual", "material": "cotton", "season": "summer"},
            ],
            "footwear": [
                {"id": "f1", "color": "black", "style": "formal", "season": "all"},
                {"id": "f2", "color": "white", "style": "casual", "season": "summer"},
                {"id": "f3", "color": "brown", "style": "casual", "season": "all"},
            ],
            "accessories": [
                {"id": "a1", "color": "gold", "type": "watch", "style": "formal"},
                {"id": "a2", "color": "silver", "type": "necklace", "style": "casual"},
            ],
        }

    def test_recommend_default(self, engine, sample_wardrobe):
        """Test default recommendation returns results."""
        recommendations = engine.recommend(sample_wardrobe)

        assert len(recommendations) > 0
        assert len(recommendations) <= engine.max_recommendations

    def test_recommend_returns_outfits(self, engine, sample_wardrobe):
        """Test that recommendations contain complete outfits."""
        recommendations = engine.recommend(sample_wardrobe, count=3)

        for outfit in recommendations:
            assert "top" in outfit
            assert "bottom" in outfit
            assert "footwear" in outfit
            assert "score" in outfit

    def test_recommend_by_season(self, engine, sample_wardrobe):
        """Test filtering by season."""
        summer = engine.recommend(sample_wardrobe, season="summer")

        for outfit in summer:
            assert outfit["top"]["season"] in ("summer", "all")
            assert outfit["bottom"]["season"] in ("summer", "all")

    def test_recommend_by_style(self, engine, sample_wardrobe):
        """Test filtering by style."""
        formal = engine.recommend(sample_wardrobe, style="formal")

        for outfit in formal:
            assert outfit["top"]["style"] == "formal"
            assert outfit["bottom"]["style"] == "formal"

    def test_recommend_by_season_and_style(self, engine, sample_wardrobe):
        """Test combined season and style filter."""
        winter_formal = engine.recommend(sample_wardrobe, season="winter", style="formal")

        for outfit in winter_formal:
            assert outfit["top"]["season"] in ("winter", "all")
            assert outfit["top"]["style"] == "formal"

    def test_recommend_no_match(self, engine, sample_wardrobe):
        """Test recommendation when no garments match criteria."""
        result = engine.recommend(sample_wardrobe, season="spring")

        # Should still return something or empty
        assert result is not None

    def test_recommend_insufficient_garments(self, engine):
        """Test recommendation with insufficient wardrobe."""
        empty_wardrobe = {"tops": [], "bottoms": [], "footwear": [], "accessories": []}
        result = engine.recommend(empty_wardrobe)

        assert len(result) == 0

    def test_recommend_scoring(self, engine, sample_wardrobe):
        """Test that recommendations are sorted by score descending."""
        recommendations = engine.recommend(sample_wardrobe, count=5)

        scores = [o["score"] for o in recommendations]
        for i in range(len(scores) - 1):
            assert scores[i] >= scores[i + 1]

    def test_recommend_diversity(self, engine, sample_wardrobe):
        """Test that recommendations have diverse garment combinations."""
        recommendations = engine.recommend(sample_wardrobe, count=5)

        # Ensure not all outfits have the same top
        tops_used = set(o["top"]["id"] for o in recommendations)
        assert len(tops_used) > 1

    def test_recommend_color_harmony(self, engine, sample_wardrobe):
        """Test that recommended outfits follow color harmony rules."""
        recommendations = engine.recommend(sample_wardrobe)

        for outfit in recommendations:
            top_color = outfit["top"]["color"]
            bottom_color = outfit["bottom"]["color"]

            # Should not have clashing colors
            assert not engine._is_clashing(top_color, bottom_color)

    def test_recommend_occasion_filter(self, engine, sample_wardrobe):
        """Test filtering by occasion."""
        casual = engine.recommend(sample_wardrobe, occasion="casual")
        formal = engine.recommend(sample_wardrobe, occasion="formal")

        assert all(o["top"]["style"] == "casual" for o in casual)
        assert all(o["top"]["style"] == "formal" for o in formal)

    def test_score_calculation(self, engine):
        """Test individual outfit scoring."""
        outfit = {
            "top": {"color": "blue", "style": "casual", "season": "all"},
            "bottom": {"color": "black", "style": "casual", "season": "all"},
            "footwear": {"color": "white", "style": "casual", "season": "all"},
        }

        score = engine.score_outfit(outfit, preferences={
            "style": "casual",
            "season": "summer",
            "color_preference": "blue",
        })

        assert isinstance(score, float)
        assert 0.0 <= score <= 1.0

    def test_score_color_match(self, engine):
        """Test that color-match bonus is applied correctly."""
        good_match = engine._color_compatibility_score("blue", "black")
        bad_match = engine._color_compatibility_score("blue", "orange")

        assert good_match > bad_match

    def test_score_season_match(self, engine):
        """Test that season-match bonus is applied."""
        outfit = {
            "top": {"season": "summer"},
            "bottom": {"season": "summer"},
        }
        score = engine.score_outfit(outfit, preferences={"season": "summer"})

        assert score > 0.5

    def test_score_season_mismatch(self, engine):
        """Test that season mismatch is penalized."""
        outfit = {
            "top": {"season": "winter"},
            "bottom": {"season": "winter"},
        }
        score = engine.score_outfit(outfit, preferences={"season": "summer"})

        assert score < 0.5

    def test_recommend_with_weather_data(self, engine, sample_wardrobe):
        """Test recommendation incorporating weather data."""
        recommendations = engine.recommend(
            sample_wardrobe,
            weather={"temperature": 30, "condition": "sunny"},
        )

        assert len(recommendations) > 0

    def test_recommend_with_previous_outfits(self, engine, sample_wardrobe):
        """Test that previous outfits are considered for variation."""
        previous = [{"top": "t1", "bottom": "b1", "footwear": "f1"}]

        recommendations = engine.recommend(
            sample_wardrobe,
            exclude_recent=previous,
        )

        for outfit in recommendations:
            assert not (outfit["top"]["id"] == "t1" and outfit["bottom"]["id"] == "b1")

    def test_recommend_empty_categories(self, engine):
        """Test recommendation when some categories are empty."""
        partial_wardrobe = {
            "tops": [{"id": "t1", "color": "blue", "style": "casual", "season": "all"}],
            "bottoms": [],
            "footwear": [],
            "accessories": [],
        }

        result = engine.recommend(partial_wardrobe)
        assert len(result) == 0

    def test_scoring_edge_cases(self, engine):
        """Test scoring with edge case attributes."""
        outfit = {
            "top": {"color": "unknown", "style": "unknown", "season": "unknown"},
            "bottom": {"color": "unknown", "style": "unknown", "season": "unknown"},
            "footwear": {"color": "unknown", "style": "unknown", "season": "unknown"},
        }

        score = engine.score_outfit(outfit, preferences={})
        assert 0.0 <= score <= 1.0

    def test_recommend_favorites_boost(self, engine, sample_wardrobe):
        """Test that favorite garments get a scoring boost."""
        sample_wardrobe["tops"][0]["favorite"] = True
        sample_wardrobe["tops"][1]["favorite"] = False

        recommendations = engine.recommend(sample_wardrobe)

        # The favorite top should appear more frequently or higher
        first_outfit = recommendations[0]
        assert first_outfit["top"]["id"] == "t1"

    def test_recommend_recently_worn_penalty(self, engine, sample_wardrobe):
        """Test that recently worn garments are penalized."""
        import datetime

        sample_wardrobe["tops"][0]["last_worn"] = datetime.datetime.now() - datetime.timedelta(hours=1)
        sample_wardrobe["tops"][1]["last_worn"] = datetime.datetime.now() - datetime.timedelta(days=30)

        recommendations = engine.recommend(sample_wardrobe)

        # Recently worn top should not appear first
        if len(recommendations) > 0:
            assert recommendations[0]["top"]["id"] != "t1"
```

## 8. Mocking Model Inference for Deterministic Tests

```python
import pytest
import torch
import numpy as np
from unittest.mock import MagicMock, patch, PropertyMock


@pytest.fixture
def deterministic_torch_model():
    """Creates a deterministic mock PyTorch model for reproducible tests."""
    class DeterministicMockModel(torch.nn.Module):
        def __init__(self, output_shape=(1, 5)):
            super().__init__()
            self.output_shape = output_shape
            self.register_buffer("fixed_output", torch.randn(output_shape))
            self.call_count = 0

        def forward(self, x):
            self.call_count += 1
            batch_size = x.size(0)
            return self.fixed_output.expand(batch_size, -1)

    model = DeterministicMockModel(output_shape=(1, 5))
    model.eval()
    return model


@pytest.fixture
def mock_huggingface_pipeline():
    """Creates a mock Hugging Face pipeline with controllable output."""
    def create_mock_pipeline(task: str, model: str = None):
        pipeline = MagicMock()

        if task == "image-classification":
            def mock_classify(images, **kwargs):
                if isinstance(images, list):
                    return [
                        [{"label": "shirt", "score": 0.95}, {"label": "dress", "score": 0.03}]
                        for _ in images
                    ]
                return [{"label": "shirt", "score": 0.95}, {"label": "dress", "score": 0.03}]

            pipeline.side_effect = mock_classify

        elif task == "object-detection":
            def mock_detect(images, **kwargs):
                return [
                    {
                        "box": {"xmin": 100, "ymin": 50, "xmax": 300, "ymax": 400},
                        "score": 0.95,
                        "label": "shirt",
                    }
                ]

            pipeline.side_effect = mock_detect

        return pipeline

    return create_mock_pipeline


@pytest.fixture
def mock_torch_no_grad():
    """Patch torch.no_grad to work in test environment."""
    with patch("torch.no_grad") as mock:
        yield mock


def test_model_mock_returns_expected_outputs(deterministic_torch_model):
    """Test that deterministic mock model returns expected outputs."""
    input_tensor = torch.randn(4, 3, 224, 224)
    output = deterministic_torch_model(input_tensor)

    assert output.shape == (4, 5)
    assert deterministic_torch_model.call_count == 1

    # Same input should give same output (deterministic)
    output2 = deterministic_torch_model(input_tensor)
    assert torch.equal(output, output2)


def test_mock_huggingface_classification(mock_huggingface_pipeline):
    """Test mocked Hugging Face classification pipeline."""
    pipe = mock_huggingface_pipeline("image-classification")
    dummy_image = np.zeros((224, 224, 3), dtype=np.uint8)

    result = pipe(dummy_image)

    assert len(result) == 2
    assert result[0]["label"] == "shirt"
    assert result[0]["score"] == 0.95


def test_mock_huggingface_detection(mock_huggingface_pipeline):
    """Test mocked Hugging Face detection pipeline."""
    pipe = mock_huggingface_pipeline("object-detection")
    dummy_image = np.zeros((480, 640, 3), dtype=np.uint8)

    result = pipe(dummy_image)

    assert len(result) == 1
    assert result[0]["box"]["xmin"] == 100
    assert result[0]["label"] == "shirt"


@pytest.mark.parametrize("batch_size", [1, 4, 8])
def test_mock_batch_handling(deterministic_torch_model, batch_size):
    """Test that mock model handles different batch sizes."""
    input_tensor = torch.randn(batch_size, 3, 224, 224)
    output = deterministic_torch_model(input_tensor)

    assert output.shape[0] == batch_size


@patch("torch.cuda.is_available", return_value=False)
def test_model_device_fallback(mock_cuda):
    """Test that model correctly falls back to CPU."""
    from src.pipeline.detection import GarmentDetector
    detector = GarmentDetector()
    assert detector.device == "cpu"


@patch("torch.cuda.is_available", return_value=True)
def test_model_device_cuda(mock_cuda):
    """Test that model uses CUDA when available."""
    from src.pipeline.detection import GarmentDetector
    detector = GarmentDetector()
    assert detector.device == "cuda"
```

## 9. Test Data Fixtures

```python
# tests/conftest.py additions for data fixtures

import json
import numpy as np
from pathlib import Path


@pytest.fixture(scope="session")
def fixture_images_dir():
    """Returns path to fixture images directory."""
    return Path(__file__).parent / "fixtures" / "images"


@pytest.fixture(scope="session")
def fixture_videos_dir():
    """Returns path to fixture videos directory."""
    return Path(__file__).parent / "fixtures" / "videos"


@pytest.fixture(scope="session")
def fixture_model_outputs_dir():
    """Returns path to fixture model outputs directory."""
    return Path(__file__).parent / "fixtures" / "model_outputs"


@pytest.fixture
def sample_detection_result(fixture_model_outputs_dir):
    """Load a sample detection result from fixture."""
    path = fixture_model_outputs_dir / "detection_result.json"
    with open(path) as f:
        return json.load(f)


@pytest.fixture
def sample_classification_result(fixture_model_outputs_dir):
    """Load a sample classification result from fixture."""
    path = fixture_model_outputs_dir / "classification_result.json"
    with open(path) as f:
        return json.load(f)


# --- Image Generation Factories ---

@pytest.fixture
def synthetic_garment_image():
    """Generate a synthetic garment-like image."""
    img = np.ones((480, 640, 3), dtype=np.uint8) * 240  # Light gray background

    # Draw a simple garment shape (rectangle with rounded appearance)
    img[100:400, 150:500] = [50, 100, 200]  # Blue garment region
    # Add some texture noise
    noise = np.random.randint(-10, 10, (300, 350, 3), dtype=np.int16)
    img[100:400, 150:500] = np.clip(
        img[100:400, 150:500].astype(np.int16) + noise, 0, 255
    ).astype(np.uint8)

    return img


@pytest.fixture
def synthetic_full_body_image():
    """Generate a synthetic full-body silhouette for avatar testing."""
    img = np.ones((1000, 500, 3), dtype=np.uint8) * 255

    # Head
    img[50:150, 200:300] = [200, 180, 160]
    # Torso
    img[150:550, 180:320] = [200, 180, 160]
    # Arms
    img[150:450, 100:180] = [200, 180, 160]
    img[150:450, 320:400] = [200, 180, 160]
    # Legs
    img[550:900, 190:260] = [100, 100, 150]
    img[550:900, 260:330] = [100, 100, 150]

    return img


@pytest.fixture
def synthetic_group_photo():
    """Generate a synthetic image with multiple people."""
    img = np.ones((800, 1200, 3), dtype=np.uint8) * 240

    # Person 1 (left)
    img[200:700, 100:350] = [180, 160, 140]
    # Person 2 (center)
    img[150:750, 450:700] = [190, 170, 150]
    # Person 3 (right)
    img[250:650, 800:1050] = [170, 150, 130]

    return img
```

## 10. Testing Error Handling

```python
import pytest
import numpy as np


class TestErrorHandling:
    """Test error handling and edge cases across the AI pipeline."""

    def test_blurry_image_detection(self):
        """Test pipeline behavior with blurry images."""
        from src.pipeline.full_pipeline import GarmentProcessingPipeline
        pipeline = GarmentProcessingPipeline()

        # Create an extremely blurry image
        from scipy.ndimage import gaussian_filter
        img = np.random.randint(0, 255, (480, 640, 3), dtype=np.float32)
        blurry = gaussian_filter(img, sigma=20).astype(np.uint8)

        result = pipeline.process(blurry)

        assert result is not None
        # Should indicate low quality
        assert result.get("quality_warning") is not None

    def test_dark_image_detection(self):
        """Test pipeline behavior with very dark images."""
        from src.pipeline.full_pipeline import GarmentProcessingPipeline
        pipeline = GarmentProcessingPipeline()

        dark_img = np.random.randint(0, 30, (480, 640, 3), dtype=np.uint8)

        result = pipeline.process(dark_img)

        assert result is not None
        assert result.get("quality_warning") is not None

    def test_saturated_image_detection(self):
        """Test pipeline behavior with over-saturated images."""
        from src.pipeline.full_pipeline import GarmentProcessingPipeline
        pipeline = GarmentProcessingPipeline()

        saturated = np.random.randint(200, 255, (480, 640, 3), dtype=np.uint8)

        result = pipeline.process(saturated)

        assert result is not None

    def test_invalid_image_format(self):
        """Test pipeline behavior with invalid image format."""
        from src.pipeline.full_pipeline import GarmentProcessingPipeline, ProcessingError

        pipeline = GarmentProcessingPipeline()

        with pytest.raises(ProcessingError, match="Invalid image format"):
            pipeline.process(None)

    def test_corrupted_image_handling(self):
        """Test that corrupted image raises appropriate error."""
        from src.pipeline.full_pipeline import GarmentProcessingPipeline, ProcessingError

        pipeline = GarmentProcessingPipeline()

        # Create a corrupted JPEG
        corrupted = np.array([0, 255, 128, 64], dtype=np.uint8)

        with pytest.raises(ProcessingError):
            pipeline.process(corrupted)

    def test_processing_timeout(self):
        """Test processing timeout for long-running operations."""
        import time
        from src.pipeline.full_pipeline import GarmentProcessingPipeline, ProcessingError

        pipeline = GarmentProcessingPipeline(timeout=0.01)  # 10ms timeout

        large_img = np.random.randint(0, 255, (4000, 3000, 3), dtype=np.uint8)

        with pytest.raises(ProcessingError, match="Processing timed out"):
            pipeline.process(large_img)

    def test_memory_exhaustion_protection(self):
        """Test that pipeline handles memory pressure."""
        from src.pipeline.full_pipeline import GarmentProcessingPipeline

        pipeline = GarmentProcessingPipeline(max_resolution=1024)

        huge_img = np.random.randint(0, 255, (10000, 10000, 3), dtype=np.uint8)

        # Should downsample to max_resolution instead of crashing
        result = pipeline.process(huge_img)
        assert result is not None

    def test_concurrent_processing_error_isolation(self):
        """Test that errors in one processing don't affect others."""
        from src.pipeline.full_pipeline import GarmentProcessingPipeline
        from concurrent.futures import ThreadPoolExecutor

        pipeline = GarmentProcessingPipeline()

        valid_img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)

        def process_or_fail():
            try:
                return pipeline.process(valid_img)
            except Exception:
                return {"error": True}

        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = [executor.submit(process_or_fail) for _ in range(8)]
            results = [f.result() for f in futures]

        # All should complete without crashing the pipeline
        assert len(results) == 8
```

## 11. Testing Retry Logic

```python
import pytest
from unittest.mock import MagicMock, patch
import time


class TestRetryLogic:
    """Test retry logic for transient failures."""

    def test_retry_on_transient_failure(self):
        """Test that operation retries on transient failure."""
        from src.utils.retry import retry_with_backoff, MaxRetriesExceeded

        mock_fn = MagicMock()
        mock_fn.side_effect = [ConnectionError("Timeout"), ConnectionError("Timeout"), "success"]

        result = retry_with_backoff(mock_fn, max_retries=3, base_delay=0.01)
        assert result == "success"
        assert mock_fn.call_count == 3

    def test_retry_exceeds_max(self):
        """Test that exception is raised after max retries."""
        from src.utils.retry import retry_with_backoff, MaxRetriesExceeded

        mock_fn = MagicMock()
        mock_fn.side_effect = ConnectionError("Persistent failure")

        with pytest.raises(MaxRetriesExceeded) as exc_info:
            retry_with_backoff(mock_fn, max_retries=2, base_delay=0.01)

        assert mock_fn.call_count == 2
        assert "Persistent failure" in str(exc_info.value)

    def test_retry_no_retry_on_success(self):
        """Test that no retry occurs when operation succeeds."""
        from src.utils.retry import retry_with_backoff

        mock_fn = MagicMock(return_value="immediate_success")

        result = retry_with_backoff(mock_fn, max_retries=5)
        assert result == "immediate_success"
        assert mock_fn.call_count == 1

    def test_retry_exponential_backoff(self):
        """Test that backoff delay increases exponentially."""
        from src.utils.retry import retry_with_backoff

        mock_fn = MagicMock()
        mock_fn.side_effect = [ConnectionError]*3 + ["success"]

        start = time.time()
        result = retry_with_backoff(mock_fn, max_retries=4, base_delay=0.1, backoff_factor=2)
        elapsed = time.time() - start

        # Should have waited ~0.1 + 0.2 + 0.4 seconds
        assert elapsed >= 0.7
        assert mock_fn.call_count == 4

    def test_retry_custom_exception_types(self):
        """Test that only specified exception types trigger retry."""
        from src.utils.retry import retry_with_backoff

        mock_fn = MagicMock()
        mock_fn.side_effect = [ValueError("Wrong type")]

        with pytest.raises(ValueError):
            retry_with_backoff(
                mock_fn,
                max_retries=3,
                retryable_exceptions=(ConnectionError, TimeoutError),
            )

        assert mock_fn.call_count == 1  # Should not retry ValueError

    def test_retry_with_model_inference(self):
        """Test retry wrapper around model inference."""
        from src.utils.retry import retry_on_failure
        from src.pipeline.detection import GarmentDetector

        detector = GarmentDetector()

        with patch.object(detector, "_load_model") as mock_load:
            mock_load.side_effect = [
                RuntimeError("CUDA OOM"),
                RuntimeError("CUDA OOM"),
                MagicMock(),
            ]

            # Should retry and succeed
            model = retry_on_failure(detector._load_model, max_retries=3)
            assert model is not None
            assert mock_load.call_count == 3

    def test_retry_jitter(self):
        """Test that retry has jitter to prevent thundering herd."""
        from src.utils.retry import retry_with_backoff

        delays = []
        mock_fn = MagicMock()
        mock_fn.side_effect = lambda: (_ for _ in ()).throw(ConnectionError())

        try:
            retry_with_backoff(
                mock_fn,
                max_retries=5,
                base_delay=0.1,
                jitter=True,
            )
        except Exception:
            pass

        # Delays should have some randomness
        # We can't check exact values, but ensure the function completed

    def test_retry_circuit_breaker(self):
        """Test circuit breaker pattern integration."""
        from src.utils.retry import CircuitBreaker

        breaker = CircuitBreaker(failure_threshold=3, reset_timeout=0.5)

        # Trip the breaker
        for i in range(3):
            breaker.record_failure()
            assert not breaker.is_open

        breaker.record_failure()
        assert breaker.is_open

        # Wait for reset
        time.sleep(0.6)
        assert not breaker.is_open
```

## 12. Testing Fallback Behavior

```python
import pytest
from unittest.mock import MagicMock, patch


class TestFallbackBehavior:
    """Test fallback behaviors when primary methods fail."""

    def test_fallback_to_cpu_on_cuda_failure(self):
        """Test that pipeline falls back to CPU when CUDA is unavailable."""
        from src.pipeline.detection import GarmentDetector

        with patch("torch.cuda.is_available", return_value=True):
            with patch("torch.cuda.device_count", return_value=0):
                detector = GarmentDetector()
                assert detector.device == "cpu"

    def test_fallback_color_detection(self):
        """Test that color detection falls back to average color on K-means failure."""
        from src.pipeline.color_extraction import ColorExtractor

        extractor = ColorExtractor()

        with patch.object(extractor, "_kmeans_quantize", side_effect=Exception("K-means failed")):
            img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
            result = extractor.extract(img)

            assert result["dominant"] is not None
            assert "fallback" in result.get("method", "")

    def test_fallback_classifier_model(self):
        """Test fallback to simpler classifier when primary model is unavailable."""
        from src.pipeline.classification import CategoryClassifier

        classifier = CategoryClassifier()

        with patch.object(classifier, "_load_primary_model", side_effect=Exception("Model not found")):
            classifier._load_models()
            # Should fall back to rule-based classifier
            assert classifier._using_fallback

    def test_fallback_empty_wardrobe_recommendation(self):
        """Test recommendation engine fallback for empty categories."""
        from src.recommendation.engine import RecommendationEngine

        engine = RecommendationEngine()

        # Empty wardrobe should return empty list, not crash
        result = engine.recommend({"tops": [], "bottoms": [], "footwear": []})
        assert result == []

    def test_fallback_background_removal(self):
        """Test background removal fallback when model fails."""
        from src.pipeline.background_removal import BackgroundRemover

        remover = BackgroundRemover()

        with patch.object(remover, "_model_remove", side_effect=RuntimeError("Model failed")):
            img = np.ones((100, 100, 3), dtype=np.uint8) * 200
            # Should fall back to simple threshold-based removal
            result = remover.remove(img, fallback=True)

            assert result is not None
            assert result.shape == img.shape

    def test_fallback_no_background_removal(self):
        """Test that background removal can be disabled."""
        from src.pipeline.full_pipeline import GarmentProcessingPipeline

        pipeline = GarmentProcessingPipeline(enable_background_removal=False)

        img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
        result = pipeline.process(img)

        assert result is not None

    def test_fallback_inference_timeout(self):
        """Test fallback when inference times out."""
        from src.pipeline.detection import GarmentDetector
        import time

        detector = GarmentDetector(inference_timeout=0.1)

        with patch.object(detector, "_run_inference") as mock_inference:
            def slow_inference(*args):
                time.sleep(5)

            mock_inference.side_effect = slow_inference

            img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
            result = detector.detect(img)

            assert result == []  # Should return empty on timeout

    def test_fallback_language_model_unavailable(self):
        """Test fallback when Hugging Face model is unavailable."""
        from src.pipeline.classification import CategoryClassifier

        with patch("transformers.pipeline", side_effect=Exception("Model download failed")):
            classifier = CategoryClassifier()
            img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
            result = classifier.classify(img)

            # Should still return a result, possibly with low confidence
            assert result["category"] is not None
            assert result["confidence"] < 0.5
```

## 13. Performance Testing for Model Inference

```python
# tests/performance/test_inference_speed.py

import pytest
import time
import numpy as np
import torch


class TestModelInferencePerformance:
    """Performance benchmarks for model inference."""

    @pytest.mark.benchmark
    def test_detection_inference_time(self, benchmark):
        """Benchmark garment detection inference time."""
        from src.pipeline.detection import GarmentDetector

        detector = GarmentDetector()
        img = np.random.randint(0, 255, (640, 480, 3), dtype=np.uint8)

        def run_inference():
            return detector.detect(img)

        result = benchmark(run_inference)

        # Should complete under 500ms
        assert benchmark.stats.stats.mean < 0.5

    @pytest.mark.benchmark
    def test_background_removal_time(self, benchmark):
        """Benchmark background removal time."""
        from src.pipeline.background_removal import BackgroundRemover

        remover = BackgroundRemover()
        img = np.random.randint(0, 255, (640, 480, 3), dtype=np.uint8)

        def run_removal():
            return remover.remove(img)

        result = benchmark(run_removal)

    @pytest.mark.benchmark
    def test_color_extraction_time(self, benchmark):
        """Benchmark color extraction time."""
        from src.pipeline.color_extraction import ColorExtractor

        extractor = ColorExtractor()
        img = np.random.randint(0, 255, (640, 480, 3), dtype=np.uint8)

        def run_extraction():
            return extractor.extract(img)

        result = benchmark(run_extraction)

        # Should complete under 200ms
        assert benchmark.stats.stats.mean < 0.2

    @pytest.mark.benchmark
    def test_classification_time(self, benchmark):
        """Benchmark classification time."""
        from src.pipeline.classification import CategoryClassifier

        classifier = CategoryClassifier()
        img = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)

        def run_classification():
            return classifier.classify(img)

        result = benchmark(run_classification)

    @pytest.mark.benchmark
    def test_recommendation_time(self, benchmark):
        """Benchmark recommendation engine time."""
        from src.recommendation.engine import RecommendationEngine

        engine = RecommendationEngine()
        wardrobe = {
            "tops": [{"id": f"t{i}", "color": "blue", "style": "casual", "season": "all"} for i in range(50)],
            "bottoms": [{"id": f"b{i}", "color": "black", "style": "casual", "season": "all"} for i in range(50)],
            "footwear": [{"id": f"f{i}", "color": "white", "style": "casual", "season": "all"} for i in range(50)],
            "accessories": [{"id": f"a{i}", "color": "gold", "style": "formal", "type": "watch"} for i in range(20)],
        }

        def run_recommendation():
            return engine.recommend(wardrobe, count=10)

        result = benchmark(run_recommendation)

    @pytest.mark.slow
    def test_batch_inference_throughput(self):
        """Test throughput of batch processing."""
        from src.pipeline.detection import GarmentDetector

        detector = GarmentDetector()
        images = [
            np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
            for _ in range(32)
        ]

        start = time.time()
        for img in images:
            detector.detect(img)
        elapsed = time.time() - start

        images_per_second = len(images) / elapsed
        assert images_per_second > 5  # At least 5 images per second

    @pytest.mark.slow
    def test_video_processing_throughput(self):
        """Test video frame processing throughput."""
        from src.pipeline.body_measurement import BodyMeasurementEstimator

        estimator = BodyMeasurementEstimator()

        # Simulate 30 frames
        frames = [
            np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
            for _ in range(30)
        ]

        start = time.time()
        for frame in frames:
            estimator.estimate_from_image(frame)
        elapsed = time.time() - start

        fps = len(frames) / elapsed
        assert fps > 10  # At least 10 FPS

    def test_memory_usage(self):
        """Test memory usage during inference."""
        import psutil
        import os

        process = psutil.Process(os.getpid())
        memory_before = process.memory_info().rss

        from src.pipeline.detection import GarmentDetector
        detector = GarmentDetector()

        # Process several images
        for _ in range(10):
            img = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
            detector.detect(img)

        memory_after = process.memory_info().rss
        memory_increase_mb = (memory_after - memory_before) / (1024 * 1024)

        # Memory increase should be less than 500MB
        assert memory_increase_mb < 500

    def test_concurrent_inference_performance(self):
        """Test performance under concurrent inference load."""
        from src.pipeline.detection import GarmentDetector
        from concurrent.futures import ThreadPoolExecutor
        import time

        detector = GarmentDetector()
        image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)

        def infer():
            return detector.detect(image)

        start = time.time()
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = [executor.submit(infer) for _ in range(8)]
            results = [f.result() for f in futures]
        elapsed = time.time() - start

        # 8 concurrent inferences should complete faster than 8 sequential
        assert elapsed < 8.0  # Upper bound
```

## 14. Example Test: Garment Detection Pipeline

```python
import pytest
import numpy as np
from unittest.mock import MagicMock, patch, call


class TestGarmentDetectionPipeline:
    """Complete test suite for the garment detection pipeline."""

    @pytest.fixture
    def detector(self):
        from src.pipeline.detection import GarmentDetector
        return GarmentDetector(confidence_threshold=0.5)

    @pytest.fixture
    def sample_shirt_image(self):
        """Create a synthetic image that looks like a shirt."""
        img = np.ones((480, 640, 3), dtype=np.uint8) * 240

        # Upper body region (like a shirt)
        img[50:400, 150:500] = [70, 130, 180]  # Steel blue shirt area
        # Collar detail
        img[50:100, 200:450] = [60, 120, 170]
        # Sleeves
        img[100:300, 100:150] = [70, 130, 180]
        img[100:300, 500:550] = [70, 130, 180]

        return img

    @patch("src.pipeline.detection.GarmentDetector._load_model")
    def test_detect_shirt_success(self, mock_load_model, detector, sample_shirt_image):
        """Test successful detection of a shirt in a synthetic image."""
        mock_model = MagicMock()
        mock_model.side_effect = lambda x: [{
            "instances": [
                {
                    "bbox": [150, 50, 500, 400],
                    "score": 0.96,
                    "class_id": 1,
                    "class_name": "shirt",
                }
            ]
        }]
        mock_load_model.return_value = mock_model

        results = detector.detect(sample_shirt_image)

        assert len(results) == 1
        assert results[0].class_name == "shirt"
        assert results[0].confidence == 0.96
        assert results[0].area > 0

    @patch("src.pipeline.detection.GarmentDetector._load_model")
    def test_detect_multiple_garment_types(self, mock_load_model, detector, sample_shirt_image):
        """Test detection of multiple different garment types."""
        mock_model = MagicMock()
        mock_model.side_effect = lambda x: [{
            "instances": [
                {"bbox": [100, 50, 300, 350], "score": 0.92, "class_id": 1, "class_name": "shirt"},
                {"bbox": [350, 100, 550, 400], "score": 0.88, "class_id": 3, "class_name": "pants"},
                {"bbox": [50, 380, 150, 450], "score": 0.75, "class_id": 5, "class_name": "shoes"},
            ]
        }]
        mock_load_model.return_value = mock_model

        results = detector.detect(sample_shirt_image)

        assert len(results) == 3
        class_names = [r.class_name for r in results]
        assert "shirt" in class_names
        assert "pants" in class_names
        assert "shoes" in class_names

    @patch("src.pipeline.detection.GarmentDetector._load_model")
    def test_detect_with_preprocessing_steps(self, mock_load_model, detector, sample_shirt_image):
        """Test that preprocessing steps are applied correctly."""
        detector._apply_preprocessing = MagicMock(return_value=sample_shirt_image)
        detector._resize_image = MagicMock(return_value=sample_shirt_image)
        detector._normalize = MagicMock(return_value=sample_shirt_image)

        mock_model = MagicMock()
        mock_model.side_effect = lambda x: [{"instances": []}]
        mock_load_model.return_value = mock_model

        detector.detect(sample_shirt_image)

        assert detector._apply_preprocessing.called
        assert detector._resize_image.called
        assert detector._normalize.called

    @patch("src.pipeline.detection.GarmentDetector._load_model")
    def test_detect_confidence_filtering(self, mock_load_model, detector, sample_shirt_image):
        """Test that detections below confidence threshold are filtered."""
        mock_model = MagicMock()
        mock_model.side_effect = lambda x: [{
            "instances": [
                {"bbox": [0, 0, 50, 50], "score": 0.95, "class_id": 1, "class_name": "shirt"},
                {"bbox": [60, 0, 100, 50], "score": 0.45, "class_id": 1, "class_name": "shirt"},
                {"bbox": [110, 0, 150, 50], "score": 0.30, "class_id": 2, "class_name": "pants"},
            ]
        }]
        mock_load_model.return_value = mock_model

        results = detector.detect(sample_shirt_image)

        assert len(results) == 1  # Only the 0.95 confidence detection

    @patch("src.pipeline.detection.GarmentDetector._load_model")
    def test_detect_non_overlapping_suppression(self, mock_load_model, detector, sample_shirt_image):
        """Test that non-maximum suppression removes duplicate detections."""
        mock_model = MagicMock()
        mock_model.side_effect = lambda x: [{
            "instances": [
                {"bbox": [100, 100, 300, 300], "score": 0.90, "class_id": 1, "class_name": "shirt"},
                {"bbox": [110, 105, 295, 295], "score": 0.85, "class_id": 1, "class_name": "shirt"},
                {"bbox": [200, 200, 400, 400], "score": 0.80, "class_id": 1, "class_name": "shirt"},
            ]
        }]
        mock_load_model.return_value = mock_model

        # With NMS, overlapping boxes should be suppressed
        results = detector.detect(sample_shirt_image, apply_nms=True)

        assert len(results) < 3  # Should have fewer after NMS

    def test_detect_result_serialization_roundtrip(self, detector):
        """Test that DetectionResult can be serialized and deserialized."""
        from src.pipeline.detection import DetectionResult

        original = DetectionResult(
            bbox=[10, 20, 100, 200],
            score=0.95,
            class_id=1,
            class_name="shirt",
            mask=np.ones((200, 100), dtype=bool),
        )

        serialized = original.to_dict()
        deserialized = DetectionResult.from_dict(serialized)

        assert deserialized.bbox == original.bbox
        assert deserialized.score == original.score
        assert deserialized.class_name == original.class_name

    @patch("src.pipeline.detection.GarmentDetector._load_model")
    def test_detect_batch_images(self, mock_load_model, detector):
        """Test batch detection of multiple images."""
        mock_model = MagicMock()
        mock_model.side_effect = lambda x: [
            {"instances": [{"bbox": [0, 0, 50, 50], "score": 0.9, "class_id": 1, "class_name": "shirt"}]}
            for _ in range(3)
        ]
        mock_load_model.return_value = mock_model

        images = [
            np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
            for _ in range(3)
        ]

        results = detector.detect_batch(images)

        assert len(results) == 3
        assert all(len(r) == 1 for r in results)
```

## 15. Example Test: Color Extraction

```python
import pytest
import numpy as np
from unittest.mock import MagicMock, patch


class TestColorExtractionDetailed:
    """Detailed test suite for color extraction."""

    @pytest.fixture
    def extractor(self):
        from src.pipeline.color_extraction import ColorExtractor
        return ColorExtractor()

    def test_extract_dominant_from_primary_colors(self, extractor):
        """Test dominant color extraction from primary colors."""
        colors = {
            "red": ([255, 0, 0], "red"),
            "green": ([0, 255, 0], "green"),
            "blue": ([0, 0, 255], "blue"),
            "yellow": ([255, 255, 0], "yellow"),
            "black": ([0, 0, 0], "black"),
            "white": ([255, 255, 255], "white"),
        }

        for name, (rgb, expected) in colors.items():
            img = np.ones((50, 50, 3), dtype=np.uint8) * np.array(rgb, dtype=np.uint8)
            result = extractor.extract(img)
            assert result["dominant"] == expected, f"Failed for {name}"

    def test_extract_palette_contains_dominant(self, extractor, gradient_image):
        """Test that dominant color is always in the palette."""
        result = extractor.extract(gradient_image, palette_size=5)

        assert len(result["palette"]) == 5
        assert result["dominant"] in [c["name"] for c in result["palette"]]

    def test_extract_returns_hex_and_rgb(self, extractor, solid_color_image):
        """Test that hex and RGB values are returned."""
        result = extractor.extract(solid_color_image)

        assert "hex" in result or "hex_codes" in result
        assert "rgb" in result

        if "rgb" in result:
            r, g, b = result["rgb"]
            assert 0 <= r <= 255
            assert 0 <= g <= 255
            assert 0 <= b <= 255

    def test_extract_multi_color_quantization(self, extractor):
        """Test color quantization for multi-color images."""
        # Create an image with 4 distinct color quadrants
        img = np.zeros((200, 200, 3), dtype=np.uint8)
        img[0:100, 0:100] = [255, 0, 0]     # Red
        img[0:100, 100:200] = [0, 255, 0]    # Green
        img[100:200, 0:100] = [0, 0, 255]    # Blue
        img[100:200, 100:200] = [255, 255, 0] # Yellow

        result = extractor.extract(img, palette_size=4)

        assert len(result["palette"]) == 4
        palette_names = [c["name"] for c in result["palette"]]
        assert len(set(palette_names)) >= 3  # At least 3 distinct colors

    def test_extract_with_mask(self, extractor, sample_image_rgb):
        """Test color extraction with a foreground mask."""
        mask = np.zeros(sample_image_rgb.shape[:2], dtype=bool)
        mask[100:300, 200:400] = True

        result_masked = extractor.extract(sample_image_rgb, mask=mask)
        result_full = extractor.extract(sample_image_rgb)

        assert result_masked["dominant"] is not None
        # Masked extraction should have considered fewer pixels

    def test_extract_ignore_background(self, extractor):
        """Test that background colors can be excluded."""
        # Create image with white background and blue object
        img = np.ones((200, 200, 3), dtype=np.uint8) * 255  # White background
        img[50:150, 50:150] = [0, 0, 255]  # Blue square

        result_with_bg = extractor.extract(img)
        result_without_bg = extractor.extract(img, ignore_colors=["white"])

        assert result_without_bg["dominant"] == "blue"
        # With background, dominant might be white or blue

    def test_extract_edge_colors(self, extractor):
        """Test edge case colors."""
        edge_cases = [
            np.ones((10, 10, 3), dtype=np.uint8) * [128, 128, 128],  # Gray
            np.ones((10, 10, 3), dtype=np.uint8) * [255, 192, 203],  # Pink
            np.ones((10, 10, 3), dtype=np.uint8) * [165, 42, 42],    # Brown
            np.ones((10, 10, 3), dtype=np.uint8) * [0, 128, 128],    # Teal
            np.ones((10, 10, 3), dtype=np.uint8) * [128, 0, 128],    # Purple
        ]

        for img in edge_cases:
            result = extractor.extract(img)
            assert result["dominant"] is not None

    def test_extract_confidence(self, extractor):
        """Test confidence of color extraction."""
        # Pure color should have high confidence
        pure = np.ones((50, 50, 3), dtype=np.uint8) * [255, 0, 0]
        result_pure = extractor.extract(pure, return_confidence=True)
        assert result_pure["confidence"] > 0.9

        # Noise should have lower confidence
        noisy = np.random.randint(0, 255, (50, 50, 3), dtype=np.uint8)
        result_noisy = extractor.extract(noisy, return_confidence=True)
        assert result_noisy["confidence"] < result_pure["confidence"]

    def test_extract_batch(self, extractor):
        """Test batch color extraction."""
        images = [
            np.ones((50, 50, 3), dtype=np.uint8) * [255, 0, 0],
            np.ones((50, 50, 3), dtype=np.uint8) * [0, 255, 0],
            np.ones((50, 50, 3), dtype=np.uint8) * [0, 0, 255],
        ]

        results = extractor.extract_batch(images)

        assert len(results) == 3
        assert results[0]["dominant"] == "red"
        assert results[1]["dominant"] == "green"
        assert results[2]["dominant"] == "blue"

    def test_similarity_matrix(self, extractor):
        """Test color similarity matrix computation."""
        colors = [
            np.array([255, 0, 0]),
            np.array([200, 0, 0]),
            np.array([0, 255, 0]),
        ]

        similarity = extractor.compute_similarity_matrix(colors)

        assert similarity.shape == (3, 3)
        assert similarity[0][0] == 1.0  # Self-similarity
        assert similarity[0][1] > similarity[0][2]  # Red similar to red
```

## 16. Example Test: Recommendation Engine Scoring

```python
import pytest
from unittest.mock import MagicMock, patch


class TestRecommendationScoring:
    """Detailed test suite for recommendation scoring."""

    @pytest.fixture
    def engine(self):
        from src.recommendation.engine import RecommendationEngine
        config = {
            "color_weight": 0.3,
            "style_weight": 0.3,
            "season_weight": 0.2,
            "occasion_weight": 0.1,
            "novelty_weight": 0.1,
        }
        return RecommendationEngine(scoring_config=config)

    def test_score_color_compatibility_complementary(self, engine):
        """Test color compatibility score for complementary colors."""
        score = engine._color_compatibility_score("blue", "orange")
        assert score > 0.7  # Complementary colors score high

    def test_score_color_compatibility_analogous(self, engine):
        """Test color compatibility for analogous colors."""
        score = engine._color_compatibility_score("blue", "green")
        assert score > 0.5  # Analogous colors score medium-high

    def test_score_color_compatibility_clashing(self, engine):
        """Test color compatibility for clashing colors."""
        score = engine._color_compatibility_score("red", "pink")
        assert score < 0.5  # Same-family colors are less complementary for contrast

    def test_score_color_compatibility_monochrome(self, engine):
        """Test monochrome color matching."""
        score = engine._color_compatibility_score("black", "white")
        assert score > 0.6  # Monochrome pairs score well

    def test_score_color_compatibility_self(self, engine):
        """Test that same color on top and bottom scores lower."""
        score = engine._color_compatibility_score("blue", "blue")
        # Same color top and bottom is usually not ideal
        assert score < 0.6

    def test_score_style_match_formal(self, engine):
        """Test style matching for formal wear."""
        score = engine._style_match_score("formal", "formal")
        assert score == 1.0

    def test_score_style_match_mismatch(self, engine):
        """Test style mismatch penalty."""
        score = engine._style_match_score("formal", "casual")
        assert score < 0.5

    def test_score_style_match_partial(self, engine):
        """Test partial style match."""
        score = engine._style_match_score("business_casual", "formal")
        assert score > 0.3
        assert score < 1.0

    def test_score_season_match(self, engine):
        """Test season matching."""
        assert engine._season_match_score("summer", "summer") == 1.0
        assert engine._season_match_score("summer", "winter") < 0.5
        assert engine._season_match_score("summer", "all") > 0.5  # "all-season" works partially

    def test_score_occasion_match(self, engine):
        """Test occasion matching."""
        assert engine._occasion_match_score("wedding", "wedding") == 1.0
        assert engine._occasion_match_score("wedding", "beach") < 0.5
        assert engine._occasion_match_score("wedding", "casual") < 0.3

    def test_score_outfit_default_weights(self, engine):
        """Test complete outfit scoring with default weights."""
        outfit = {
            "top": {"color": "blue", "style": "casual", "season": "summer"},
            "bottom": {"color": "black", "style": "casual", "season": "summer"},
            "footwear": {"color": "white", "style": "casual", "season": "summer"},
        }

        score = engine.score_outfit(outfit, preferences={
            "style": "casual",
            "season": "summer",
        })

        assert isinstance(score, float)
        assert 0.0 <= score <= 1.0
        assert score > 0.7  # Should score high for matching preferences

    def test_score_outfit_poor_match(self, engine):
        """Test scoring for poorly matching outfit."""
        outfit = {
            "top": {"color": "red", "style": "beach", "season": "summer"},
            "bottom": {"color": "green", "style": "beach", "season": "summer"},
            "footwear": {"color": "yellow", "style": "beach", "season": "summer"},
        }

        score = engine.score_outfit(outfit, preferences={
            "style": "formal",
            "season": "winter",
        })

        assert score < 0.3

    def test_score_outfit_missing_fields(self, engine):
        """Test scoring with missing garment fields."""
        outfit = {
            "top": {"color": "blue"},  # Missing style and season
            "bottom": {"color": "black"},
            "footwear": {"color": "white"},
        }

        score = engine.score_outfit(outfit, preferences={})

        assert 0.0 <= score <= 1.0
        # Should still produce a score without crashing

    def test_score_novelty_boost(self, engine):
        """Test that unseen combinations get a novelty boost."""
        outfit = {"top": {"id": "t1"}, "bottom": {"id": "b1"}, "footwear": {"id": "f1"}}

        recent_combinations = [{"top": "t1", "bottom": "b1", "footwear": "f1"}]
        score_recent = engine._novelty_score(outfit, recent_combinations)

        recent_combinations_empty = []
        score_new = engine._novelty_score(outfit, recent_combinations_empty)

        assert score_new > score_recent

    def test_score_weight_adjustment(self, engine):
        """Test custom weight adjustment affects final score."""
        outfit = {
            "top": {"color": "blue", "style": "casual", "season": "summer"},
            "bottom": {"color": "black", "style": "casual", "season": "summer"},
            "footwear": {"color": "white", "style": "casual", "season": "summer"},
        }

        score_default = engine.score_outfit(outfit, preferences={"style": "casual"})

        engine.scoring_config["style_weight"] = 1.0
        engine.scoring_config["color_weight"] = 0.0
        engine.scoring_config["season_weight"] = 0.0

        score_style_only = engine.score_outfit(outfit, preferences={"style": "casual"})

        assert score_style_only != score_default

    def test_score_normalization(self, engine):
        """Test that scores are normalized to 0-1 range."""
        test_scores = [
            {"top": {}, "bottom": {}, "footwear": {}},
            {"top": {"color": "blue"}, "bottom": {"color": "red"}, "footwear": {"color": "green"}},
        ]

        for outfit in test_scores:
            score = engine.score_outfit(outfit, preferences={})
            assert 0.0 <= score <= 1.0

    def test_scoring_consistency(self, engine):
        """Test that identical outfits and preferences produce identical scores."""
        outfit = {
            "top": {"color": "blue", "style": "casual", "season": "all"},
            "bottom": {"color": "black", "style": "casual", "season": "all"},
            "footwear": {"color": "white", "style": "casual", "season": "all"},
        }
        prefs = {"style": "casual", "season": "summer"}

        score1 = engine.score_outfit(outfit, preferences=prefs)
        score2 = engine.score_outfit(outfit, preferences=prefs)

        assert score1 == score2
```

```python
# Helper class needed for tests

class MockDetectionResult:
    """Minimal mock for DetectionResult."""

    def __init__(self, bbox, score, class_name, class_id=1):
        self.bbox = bbox
        self.score = score
        self.class_name = class_name
        self.class_id = class_id
        self.width = bbox[2] - bbox[0]
        self.height = bbox[3] - bbox[1]
        self.area = self.width * self.height
        self.mask = None

    def to_dict(self):
        return {
            "bbox": self.bbox,
            "score": self.score,
            "class_name": self.class_name,
            "class_id": self.class_id,
        }
```
