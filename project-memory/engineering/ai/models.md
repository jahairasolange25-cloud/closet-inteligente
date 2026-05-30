# AI Models

## Overview

All AI/ML models used across the platform, their configurations, serving architecture, and training requirements.

---

## Model Inventory

| Model | Version | Task | Framework | Size | Language |
|-------|---------|------|-----------|------|----------|
| Garment Detector | v3 | Object detection | Detectron2 | 180 MB | Python |
| Garment Classifier | v2 | Category classification | Hugging Face | 340 MB | Python |
| Garment Embedding | v1 | Style similarity | Sentence Transformers | 120 MB | Python |
| Pose Estimator | — | Body landmarks | Mediapipe | 20 MB | Python |
| Color Extractor | v1 | Color clustering | OpenCV + scikit-learn | <1 MB | Python |

---

## 1. Detectron2 Configuration (Garment Detection)

### Model Architecture

```
Backbone: ResNet-50 FPN (Feature Pyramid Network)
Head: Mask R-CNN
Input size: 1333 × 800 (variable aspect ratio)
Output: Instance segmentation masks + bounding boxes + class labels
```

### Configuration File

```python
# configs/garment_detector.yaml
MODEL:
  WEIGHTS: "models/garment_detector_v3.pth"
  META_ARCHITECTURE: "GeneralizedRCNN"
  BACKBONE:
    NAME: "build_resnet_fpn_backbone"
  RESNETS:
    DEPTH: 50
    OUT_FEATURES: ["res2", "res3", "res4", "res5"]
  FPN:
    IN_FEATURES: ["res2", "res3", "res4", "res5"]
  ANCHOR_GENERATOR:
    SIZES: [[32], [64], [128], [256], [512]]
  ROI_HEADS:
    NAME: "StandardROIHeads"
    NUM_CLASSES: 28  # Garment categories
    SCORE_THRESH_TEST: 0.7
    NMS_THRESH_TEST: 0.5
    BATCH_SIZE_PER_IMAGE: 512
  ROI_MASK_HEAD:
    NAME: "MaskRCNNConvUpsampleHead"
    POOLER_RESOLUTION: 14
    CONV_DIM: 256
    NUM_CONV: 4
  PIXEL_MEAN: [103.530, 116.280, 123.675]
  PIXEL_STD: [1.0, 1.0, 1.0]
DATASETS:
  TRAIN: ("garment_train_v3",)
  TEST: ("garment_val_v3",)
DATALOADER:
  NUM_WORKERS: 4
  FILTER_EMPTY_ANNOTATIONS: True
SOLVER:
  IMS_PER_BATCH: 8
  BASE_LR: 0.001
  STEPS: (60000, 80000)
  MAX_ITER: 90000
  CHECKPOINT_PERIOD: 10000
TEST:
  EVAL_PERIOD: 10000
INPUT:
  MIN_SIZE_TRAIN: (640, 672, 704, 736, 768, 800)
  MAX_SIZE_TRAIN: 1333
  MIN_SIZE_TEST: 800
  MAX_SIZE_TEST: 1333
```

### Class Labels (28 Categories)

```python
CLASSES = [
    '__background__',  # index 0
    'tops', 't-shirts', 'shirts', 'blouses', 'sweaters',
    'jackets', 'coats', 'hoodies', 'vests',
    'bottoms', 'pants', 'jeans', 'shorts', 'skirts',
    'dresses', 'jumpsuits',
    'footwear', 'sneakers', 'boots', 'sandals', 'heels', 'flats',
    'accessories', 'bags', 'hats', 'belts', 'scarves', 'jewelry', 'glasses',
    'outerwear',
]
```

### Inference

```python
def detect_garment(image: np.ndarray) -> Detections:
    with torch.no_grad():
        outputs = predictor(image)

    instances = outputs["instances"].to("cpu")

    return {
        "boxes": instances.pred_boxes.tensor.numpy(),
        "scores": instances.scores.numpy(),
        "classes": instances.pred_classes.numpy(),
        "masks": instances.pred_masks.numpy(),
    }
```

### Performance Metrics

| Metric | Value |
|--------|-------|
| mAP@0.5 | 0.89 |
| mAP@0.5:0.95 | 0.72 |
| Inference time (GPU) | 120ms |
| Inference time (CPU) | 1800ms |
| Recall | 0.93 |
| Precision | 0.91 |

---

## 2. Hugging Face Transformers (Classification)

### Model Architecture

```
Base: ResNet-50 pretrained on ImageNet
Head: Classification head with 29 classes
Input: 224 × 224 RGB
```

### Configuration

```python
from transformers import AutoImageProcessor, AutoModelForImageClassification

model_name = "models/garment-classifier-v2"

processor = AutoImageProcessor.from_pretrained(model_name)
model = AutoModelForImageClassification.from_pretrained(
    model_name,
    num_labels=29,
    ignore_mismatched_sizes=True,
)

# Model configuration
config = model.config
config.hidden_dropout_prob = 0.3
config.attention_probs_dropout_prob = 0.3
config.num_labels = 29
config.id2label = {i: label for i, label in enumerate(CLASSES)}
config.label2id = {label: i for i, label in enumerate(CLASSES)}
```

### Training Hyperparameters

```python
training_args = {
    "learning_rate": 2e-5,
    "per_device_train_batch_size": 32,
    "per_device_eval_batch_size": 64,
    "num_train_epochs": 20,
    "weight_decay": 0.01,
    "warmup_ratio": 0.1,
    "logging_steps": 100,
    "evaluation_strategy": "epoch",
    "save_strategy": "epoch",
    "load_best_model_at_end": True,
    "metric_for_best_model": "accuracy",
    "remove_unused_columns": False,
    "fp16": True,  # Mixed precision training
}
```

### Performance Metrics

| Metric | Value |
|--------|-------|
| Top-1 Accuracy | 0.87 |
| Top-3 Accuracy | 0.96 |
| F1 (macro) | 0.85 |
| Inference time (GPU) | 30ms |
| Inference time (CPU) | 450ms |

### Class Weights (for imbalanced dataset)

```python
# Computed from training set distribution
CLASS_WEIGHTS = {
    't-shirts': 1.0,
    'pants': 1.1,
    'shoes': 1.2,
    'dresses': 1.3,
    'accessories': 2.0,
    'belts': 3.0,
    'vests': 3.5,
    'bowties': 5.0,  # Rare classes get higher weight
}
```

---

## 3. Mediapipe (Pose/Body Estimation)

### Configuration

```python
import mediapipe as mp

mp_pose = mp.solutions.pose

pose = mp_pose.Pose(
    static_image_mode=False,
    model_complexity=2,          # 0=lite, 1=full, 2=heavy (best accuracy)
    smooth_landmarks=True,
    enable_segmentation=False,
    smooth_segmentation=False,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.5,
)
```

### Landmarks (33 points)

```python
LANDMARKS = {
    0: 'nose',
    1: 'left_eye_inner',
    2: 'left_eye',
    3: 'left_eye_outer',
    4: 'right_eye_inner',
    5: 'right_eye',
    6: 'right_eye_outer',
    7: 'left_ear',
    8: 'right_ear',
    9: 'mouth_left',
    10: 'mouth_right',
    11: 'left_shoulder',
    12: 'right_shoulder',
    13: 'left_elbow',
    14: 'right_elbow',
    15: 'left_wrist',
    16: 'right_wrist',
    17: 'left_pinky',
    18: 'right_pinky',
    19: 'left_index',
    20: 'right_index',
    21: 'left_thumb',
    22: 'right_thumb',
    23: 'left_hip',
    24: 'right_hip',
    25: 'left_knee',
    26: 'right_knee',
    27: 'left_ankle',
    28: 'right_ankle',
    29: 'left_heel',
    30: 'right_heel',
    31: 'left_foot_index',
    32: 'right_foot_index',
}
```

### Performance Metrics

| Model Complexity | FPS (GPU) | FPS (CPU) | Accuracy |
|-----------------|-----------|-----------|----------|
| 0 (lite) | 60 | 30 | Good |
| 1 (full) | 30 | 15 | Better |
| 2 (heavy) | 15 | 8 | Best |

---

## 4. Color Extraction Algorithm

### Algorithm

```python
from sklearn.cluster import KMeans
import numpy as np
from PIL import Image

class ColorExtractor:
    def __init__(self, n_colors=5):
        self.n_colors = n_colors
        self.kmeans = KMeans(
            n_clusters=n_colors,
            random_state=42,
            n_init=10,
            max_iter=300,
        )

    def extract(self, image: Image.Image, mask: np.ndarray | None = None) -> dict:
        # Convert to RGB numpy array
        img_array = np.array(image.convert('RGB'))

        if mask is not None:
            # Only process foreground pixels
            pixel_mask = mask > 0
            pixels = img_array[pixel_mask]
        else:
            pixels = img_array.reshape(-1, 3)

        # Remove near-white and near-black background remnants
        brightness = np.mean(pixels, axis=1)
        valid = (brightness > 30) & (brightness < 240)
        pixels = pixels[valid]

        if len(pixels) < self.n_colors:
            return {'colors': [], 'dominant': None}

        # Fit KMeans
        self.kmeans.fit(pixels)

        # Get colors and percentages
        colors = self.kmeans.cluster_centers_.astype(int)
        labels = self.kmeans.labels_
        counts = np.bincount(labels)
        percentages = counts / counts.sum()

        # Sort by percentage descending
        order = np.argsort(percentages)[::-1]

        result = []
        sum_hues = 0
        count_hues = 0

        for idx in order:
            rgb = colors[idx].tolist()
            hex_color = '#{:02x}{:02x}{:02x}'.format(*rgb)
            name = self._closest_color_name(rgb)
            percentage = float(percentages[idx])
            hue = self._rgb_to_hue(rgb)

            result.append({
                'rgb': rgb,
                'hex': hex_color,
                'name': name,
                'percentage': percentage,
                'hue': hue,
            })

            if hue is not None and percentage > 0.1:
                sum_hues += hue * percentage
                count_hues += percentage

        avg_hue = sum_hues / count_hues if count_hues > 0 else None

        return {
            'colors': result,
            'dominant': result[0] if result else None,
            'averageHue': avg_hue,
            'isMonochromatic': self._is_monochromatic(result),
            'isNeutral': self._is_neutral(result),
        }

    def _rgb_to_hue(self, rgb):
        r, g, b = [x / 255.0 for x in rgb]
        mx = max(r, g, b)
        mn = min(r, g, b)
        if mx == mn:
            return None
        if mx == r:
            h = (g - b) / (mx - mn)
        elif mx == g:
            h = 2 + (b - r) / (mx - mn)
        else:
            h = 4 + (r - g) / (mx - mn)
        return h * 60 % 360

    def _is_monochromatic(self, colors):
        hues = [c['hue'] for c in colors if c['hue'] is not None]
        if len(hues) < 2:
            return True
        return max(hues) - min(hues) < 30

    def _is_neutral(self, colors):
        dominant_hue = colors[0]['hue'] if colors else None
        return dominant_hue is None  # Grayscale
```

### Performance

| Metric | Value |
|--------|-------|
| Clusters | 5 |
| Max iterations | 300 |
| Inference time | 50ms/image |
| Color name accuracy | 0.92 |
| Delta-E vs ground truth | < 5.0 |

---

## 5. Model Serving Architecture

### Architecture Diagram

```
                     ┌──────────────────────┐
                     │   NestJS Backend      │
                     │ (AiPipelineService)   │
                     └──────┬───────────────┘
                            │ HTTP/gRPC
                            v
              ┌─────────────────────────────┐
              │   Python AI Service (FastAPI) │
              │   Port: 5100                  │
              └──────┬──────────┬───────────┘
                     │          │
            ┌────────┴──┐  ┌───┴────────┐
            │ GPU Pod   │  │ CPU Pod    │
            │ (Detectron│  │ (Classifier│
            │  + Embed) │  │  + Color)  │
            └───────────┘  └────────────┘
```

### Deployment

```yaml
# docker-compose.ai.yml
services:
  ai-service:
    build:
      context: ./services/ai
      dockerfile: Dockerfile
    ports:
      - "5100:5100"
    environment:
      - CUDA_VISIBLE_DEVICES=0
      - MODEL_PATH=/models
      - BATCH_SIZE=4
      - WORKERS=2
    volumes:
      - model-data:/models
      - upload-data:/uploads
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5100/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### FastAPI Service Endpoints

```python
from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel

app = FastAPI(title="Closet AI Service", version="1.0.0")

class DetectionRequest(BaseModel):
    imageUrl: str

class ClassificationRequest(BaseModel):
    imageUrl: str
    detectionCategory: str | None = None

class ColorRequest(BaseModel):
    imageUrl: str

class EmbeddingRequest(BaseModel):
    imageUrl: str

class AvatarGenerationRequest(BaseModel):
    videoUrl: str
    height: float | None = None
    gender: str | None = None

class RecommendationRequest(BaseModel):
    userId: str
    garmentIds: list[str]
    context: dict = {}

@app.post("/detect")
async def detect_garment(req: DetectionRequest): ...

@app.post("/classify")
async def classify_garment(req: ClassificationRequest): ...

@app.post("/colors")
async def extract_colors(req: ColorRequest): ...

@app.post("/embeddings")
async def generate_embedding(req: EmbeddingRequest): ...

@app.post("/avatar/generate")
async def generate_avatar(req: AvatarGenerationRequest): ...

@app.post("/recommend")
async def get_recommendations(req: RecommendationRequest): ...

@app.get("/models/status")
async def model_status(): ...

@app.get("/health")
async def health_check(): ...
```

### Model Loading (on startup)

```python
import torch
import logging

logger = logging.getLogger(__name__)

class ModelManager:
    def __init__(self):
        self.models = {}
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

    def load_all(self):
        logger.info(f"Loading models on {self.device}...")
        self.models['detector'] = self.load_detectron()
        self.models['classifier'] = self.load_classifier()
        self.models['embedding'] = self.load_embedding_model()
        logger.info("All models loaded successfully")

    def load_detectron(self):
        from detectron2.engine import DefaultPredictor
        cfg = get_cfg()
        cfg.merge_from_file("configs/detectron2/mask_rcnn_R_50_FPN_3x.yaml")
        cfg.MODEL.WEIGHTS = "models/garment_detector_v3.pth"
        cfg.MODEL.DEVICE = self.device
        predictor = DefaultPredictor(cfg)
        return predictor

    def load_classifier(self):
        from transformers import AutoImageProcessor, AutoModelForImageClassification
        processor = AutoImageProcessor.from_pretrained("models/garment-classifier-v2")
        model = AutoModelForImageClassification.from_pretrained(
            "models/garment-classifier-v2"
        ).to(self.device)
        model.eval()
        return {'processor': processor, 'model': model}

    def load_embedding_model(self):
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer('models/garment-embedding-v1')
        model.to(self.device)
        return model
```

---

## 6. Model Versioning

### Version Registry

```sql
-- Track deployed models and their versions
CREATE TABLE model_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_name VARCHAR(100) NOT NULL,
  version VARCHAR(20) NOT NULL,
  model_type VARCHAR(50) NOT NULL, -- 'detectron', 'huggingface', 'mediapipe', 'custom'
  model_path TEXT NOT NULL,
  metrics JSONB,           -- accuracy, precision, recall, etc.
  training_dataset VARCHAR(100),
  training_date TIMESTAMPTZ,
  deployed_by VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(model_name, version)
);

CREATE INDEX idx_model_registry_active ON model_registry(model_name) WHERE is_active = TRUE;
```

### Version History

| Model | Current Version | Previous Version | Date | Accuracy Change |
|-------|----------------|-----------------|------|-----------------|
| Garment Detector | v3 | v2 | 2026-02-15 | +3.2% mAP |
| Garment Classifier | v2 | v1 | 2026-01-20 | +2.1% top-1 |
| Garment Embedding | v1 | — | 2026-01-10 | Baseline |

### Rollback Strategy

```typescript
async function rollbackModel(modelName: string, targetVersion: string): Promise<void> {
  const target = await prisma.modelRegistry.findUnique({
    where: {
      modelName_version: { modelName, version: targetVersion },
    },
  });

  if (!target) throw new Error(`Version ${targetVersion} not found`);

  // Deactivate current
  await prisma.modelRegistry.updateMany({
    where: { modelName, isActive: true },
    data: { isActive: false },
  });

  // Activate target
  await prisma.modelRegistry.update({
    where: { id: target.id },
    data: { isActive: true },
  });

  // Reload model in AI service
  await axios.post(`${AI_SERVICE_URL}/models/reload`, {
    modelName,
    version: targetVersion,
  });
}
```

---

## 7. Training Data Requirements

### Dataset Composition

| Category | Min Images | Source | Label Type |
|----------|-----------|--------|------------|
| Garment detection | 50,000 | User uploads (opt-in) + public datasets | Bounding box + mask |
| Category classification | 100,000 | User uploads + fashion datasets | Category label |
| Embedding model | 200,000 | User uploads + e-commerce catalogs | Image pairs |

### Consent Requirements

```typescript
// Only use images for training where user has explicitly consented
async function collectForTraining(): Promise<void> {
  const consentedUsers = await prisma.consent.findMany({
    where: {
      type: 'ai_training',
      accepted: true,
    },
    select: { userId: true },
  });

  const userIds = consentedUsers.map((c) => c.userId);

  const garments = await prisma.garment.findMany({
    where: {
      userId: { in: userIds },
      imageUrl: { not: null },
      processingStatus: 'completed',
      deletedAt: null,
    },
    select: {
      id: true,
      imageUrl: true,
      category: true,
      color: true,
      detectedDominantColors: true,
      detectedPatterns: true,
      detectionConfidence: true,
    },
    take: 10000, // Batch size
  });

  // Anonymize and prepare for training pipeline
  await prepareTrainingBatch(garments);
}
```

### Data Privacy

- All training data is anonymized (no user IDs stored in training set)
- Images stripped of EXIF data
- Faces automatically blurred using OpenCV face detection
- Users can opt out at any time (retroactive removal)
- Model weights don't memorize individual images

---

## 8. Model Performance Monitoring

```python
# Tracked per request
performance_metrics = {
    'model_name': str,
    'model_version': str,
    'request_type': str,        # 'detection', 'classification', 'color', 'embedding'
    'inference_time_ms': float,
    'input_size': int,          # bytes
    'gpu_memory_mb': float,
    'success': bool,
    'error_type': str | None,
}

# Aggregated metrics in Prometheus
# ai_inference_duration_seconds{model="detector",version="v3"}
# ai_inference_total{model="classifier",version="v2",status="success"}
# ai_gpu_memory_usage_bytes{device="0"}
```
