# Garment Processing Pipeline

## Overview

9-step asynchronous pipeline for processing garment images. Orchestrated by NestJS `AiPipelineService` using BullMQ job queues. Python microservices handle AI/ML steps.

---

## Pipeline Architecture

```
Upload → [1] Validate → [2] Detect → [3] BgRemove → [4] ColorDetect → [5] Classify → [6] Compress → [7] Thumbnail → [8] SaveMeta → [9] Embedding → Complete

Queue: garment-pipeline
Steps execute sequentially. Failure at any step triggers retry (3 attempts, exponential backoff).
```

---

## Step 1: Upload and Validate Image

**Service:** `StorageService` (NestJS) / `GarmentImageUploader` (Python)

### Triggers
- User uploads image via `POST /garments/:id/upload`
- Image is received as `multipart/form-data`

### Validation Rules

| Check | Rule | Error Code |
|-------|------|------------|
| Format | JPEG, PNG, WebP only | INVALID_FORMAT |
| Max size | 15 MB | FILE_TOO_LARGE |
| Min resolution | 300 x 300 px | RESOLUTION_TOO_LOW |
| Max resolution | 4096 x 4096 px | RESOLUTION_TOO_HIGH |
| Aspect ratio | Between 1:3 and 3:1 | INVALID_ASPECT_RATIO |
| File integrity | Valid image header | CORRUPTED_FILE |
| Virus scan | No malware detected | SECURITY_SCAN_FAILED |

### Implementation

```python
def validate_image(image_path: str) -> ValidationResult:
    errors = []
    file_size = os.path.getsize(image_path)

    if file_size > 15 * 1024 * 1024:
        errors.append({"code": "FILE_TOO_LARGE", "message": "File exceeds 15MB limit"})

    with Image.open(image_path) as img:
        width, height = img.size

        if img.format not in ('JPEG', 'PNG', 'WEBP'):
            errors.append({"code": "INVALID_FORMAT",
                           "message": f"Format {img.format} not supported"})

        if width < 300 or height < 300:
            errors.append({"code": "RESOLUTION_TOO_LOW",
                           "message": f"Minimum 300x300, got {width}x{height}"})

        if width > 4096 or height > 4096:
            errors.append({"code": "RESOLUTION_TOO_HIGH",
                           "message": f"Maximum 4096x4096, got {width}x{height}"})

        aspect = width / height
        if aspect < 1/3 or aspect > 3:
            errors.append({"code": "INVALID_ASPECT_RATIO",
                           "message": f"Aspect ratio {aspect:.2f} out of range [0.33, 3.0]"})

    if errors:
        return ValidationResult(valid=False, errors=errors)

    return ValidationResult(valid=True, errors=[])
```

### Output

```typescript
{
  valid: boolean;
  errors: ValidationError[];
  metadata: {
    width: number;
    height: number;
    format: string;
    fileSize: number;
    checksum: string;    // SHA-256
  } | null;
}
```

### Error Handling
- Validation failure → garment marked `failed` with error details
- User notified via `garment:failed` notification
- Client receives 400 error with validation details

---

## Step 2: Garment Detection (Detectron2)

**Service:** `GarmentDetectionService` (Python)

### Model Configuration

```python
from detectron2.config import get_cfg
from detectron2.engine import DefaultPredictor

cfg = get_cfg()
cfg.merge_from_file("configs/detectron2/mask_rcnn_R_50_FPN_3x.yaml")
cfg.MODEL.WEIGHTS = "models/garment_detector_v3.pth"
cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = 0.7
cfg.MODEL.ROI_HEADS.NUM_CLASSES = 28  # garment categories
cfg.MODEL.DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
cfg.DATALOADER.NUM_WORKERS = 2

predictor = DefaultPredictor(cfg)
```

### Process

```python
def detect_garments(image_path: str) -> DetectionResult:
    image = cv2.imread(image_path)
    outputs = predictor(image)

    instances = outputs["instances"].to("cpu")
    boxes = instances.pred_boxes.tensor.numpy()
    scores = instances.scores.numpy()
    classes = instances.pred_classes.numpy()
    masks = instances.pred_masks.numpy()

    # Find the largest detected garment (highest confidence)
    best_idx = scores.argmax()
    confidence = float(scores[best_idx])
    category_id = int(classes[best_idx])
    bbox = boxes[best_idx].tolist()

    # Extract mask for background removal
    mask = masks[best_idx]

    return DetectionResult(
        detected=True,
        confidence=confidence,
        category_id=category_id,
        bbox=bbox,
        mask=mask.tolist(),
        class_name=ID_TO_LABEL[category_id]
    )
```

### Quality Thresholds

| Metric | Threshold | Action if below |
|--------|-----------|-----------------|
| Detection confidence | ≥ 0.7 | Retry with different model config |
| Bbox area ratio | ≥ 10% of image | Mark as partial detection |
| Single garment | 1 dominant detection | Flag multi-garment for user review |

### Output

```typescript
{
  detected: boolean;
  confidence: number;       // 0-1
  categoryId: number;
  className: string;
  bbox: [x1, y1, x2, y2];  // pixel coordinates
  mask: number[][];         // binary mask
}
```

### Error Handling
- `DETECTION_FAILED`: Model inference error → retry 3x
- `NO_GARMENT_FOUND`: Nothing detected → fallback to whole image
- `LOW_CONFIDENCE`: < 0.7 threshold → accept with warning flag

---

## Step 3: Background Removal (OpenCV)

**Service:** `BackgroundRemovalService` (Python)

### Algorithm

```python
def remove_background(image_path: str, mask: np.ndarray | None = None) -> np.ndarray:
    image = cv2.imread(image_path)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGBA)

    if mask is not None:
        # Use Detectron2 mask for precise removal
        mask = (mask * 255).astype(np.uint8)
        kernel = np.ones((5, 5), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        mask = cv2.GaussianBlur(mask, (5, 5), 0)
    else:
        # Fallback: GrabCut algorithm
        mask = np.zeros(image.shape[:2], np.uint8)
        bgd_model = np.zeros((1, 65), np.float64)
        fgd_model = np.zeros((1, 65), np.float64)
        rect = (10, 10, image.shape[1] - 10, image.shape[0] - 10)
        cv2.grabCut(image, mask, rect, bgd_model, fgd_model, 5, cv2.GC_INIT_WITH_RECT)
        mask = np.where((mask == 2) | (mask == 0), 0, 1).astype('uint8')

    # Apply mask
    result = image.copy()
    result[:, :, 3] = mask * 255

    # Optional: refine edges
    result = refine_edges(result, mask)

    return result
```

### Output
- RGBA image with transparent background
- White replaced with transparency
- Edges anti-aliased for smooth blending

### Quality Thresholds
- Foreground pixels ≥ 5% of total (otherwise empty image)
- Edge smoothness score ≥ 0.8

### Fallback
- Use GrabCut if Detectron2 mask unavailable
- Use threshold + contour detection if both fail → mark as `LOW_QUALITY_REMOVAL`

---

## Step 4: Color Detection (OpenCV k-means)

**Service:** `ColorDetectionService` (Python)

### Algorithm

```python
def detect_colors(image_path: str, n_colors: int = 5) -> ColorResult:
    image = cv2.imread(image_path)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # Remove background pixels (if alpha channel)
    if image.shape[2] == 4:
        mask = image[:, :, 3] > 0
        image = image[:, :, :3][mask]
    else:
        # Flatten
        image = image.reshape((-1, 3))

    # Convert to float
    image = np.float32(image)

    # K-means clustering
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 100, 0.2)
    _, labels, centers = cv2.kmeans(
        image, n_colors, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS
    )

    # Calculate percentages
    counts = np.bincount(labels.flatten())
    percentages = counts / counts.sum()

    # Sort by percentage descending
    sorted_indices = np.argsort(percentages)[::-1]
    colors = []

    for idx in sorted_indices:
        rgb = centers[idx].astype(int).tolist()
        hex_color = '#{:02x}{:02x}{:02x}'.format(*rgb)
        colors.append({
            'rgb': rgb,
            'hex': hex_color,
            'percentage': float(percentages[idx]),
            'name': closest_color_name(rgb)
        })

    # Dominant color = most frequent
    dominant = colors[0]

    # Detect patterns
    patterns = detect_patterns(cv2.imread(image_path))

    return ColorResult(
        dominantColors=[c['hex'] for c in colors[:3]],
        colorNames=[c['name'] for c in colors[:3]],
        fullPalette=colors,
        patterns=patterns,
        dominantColor=dominant['hex']
    )
```

### Color Name Mapping

```python
def closest_color_name(rgb):
    # CSS named colors reference
    named_colors = {
        'Negro': (0, 0, 0),
        'Blanco': (255, 255, 255),
        'Gris': (128, 128, 128),
        'Rojo': (255, 0, 0),
        'Azul': (0, 0, 255),
        'Verde': (0, 128, 0),
        'Amarillo': (255, 255, 0),
        'Naranja': (255, 165, 0),
        'Rosa': (255, 192, 203),
        'Morado': (128, 0, 128),
        'Marrón': (165, 42, 42),
        'Beige': (245, 245, 220),
        'Crema': (255, 253, 208),
        'Celeste': (135, 206, 250),
        'Turquesa': (64, 224, 208),
        'Oliva': (128, 128, 0),
        'Vino': (128, 0, 32),
        'Dorado': (255, 215, 0),
        'Plateado': (192, 192, 192),
    }
    min_dist = float('inf')
    closest = 'Desconocido'
    for name, ref_rgb in named_colors.items():
        dist = sum((a - b) ** 2 for a, b in zip(rgb, ref_rgb))
        if dist < min_dist:
            min_dist = dist
            closest = name
    return closest
```

### Pattern Detection

```python
def detect_patterns(image: np.ndarray) -> list[str]:
    patterns = []
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Check stripes
    fft = np.fft.fft2(gray)
    fft_shift = np.fft.fftshift(fft)
    magnitude = np.abs(fft_shift)
    peak_ratio = np.max(magnitude) / np.mean(magnitude)
    if peak_ratio > 50:
        patterns.append('rayas')

    # Check plaid
    edges = cv2.Canny(gray, 50, 150)
    lines = cv2.HoughLinesP(edges, 1, np.pi/180, 50, minLineLength=50, maxLineGap=10)
    if lines is not None and len(lines) > 20:
        horizontal = sum(1 for l in lines if abs(l[0][1] - l[0][3]) < 10)
        vertical = sum(1 for l in lines if abs(l[0][0] - l[0][2]) < 10)
        if horizontal > 10 and vertical > 10:
            patterns.append('cuadros')

    # Check denim texture
    if detect_denim_texture(gray):
        patterns.append('denim')

    # Check solid
    color_std = np.std(image.reshape(-1, 3), axis=0).mean()
    if color_std < 30:
        patterns.append('liso')

    # Check gradient
    if detect_gradient(image):
        patterns.append('degradado')

    return patterns
```

### Output

```typescript
{
  dominantColors: string[];     // hex array, top 3
  colorNames: string[];         // human-readable names
  fullPalette: Array<{
    rgb: [number, number, number];
    hex: string;
    percentage: number;
    name: string;
  }>;
  patterns: string[];           // e.g. ["liso", "rayas", "cuadros"]
  dominantColor: string;        // hex
}
```

---

## Step 5: Category Classification (Hugging Face)

**Service:** `ClassificationService` (Python)

### Model

```python
from transformers import AutoImageProcessor, AutoModelForImageClassification

processor = AutoImageProcessor.from_pretrained("models/garment-classifier-v2")
model = AutoModelForImageClassification.from_pretrained("models/garment-classifier-v2")

LABELS = [
    'tops', 't-shirts', 'shirts', 'blouses', 'sweaters',
    'jackets', 'coats', 'hoodies', 'vests',
    'bottoms', 'pants', 'jeans', 'shorts', 'skirts',
    'dresses', 'jumpsuits',
    'footwear', 'sneakers', 'boots', 'sandals', 'heels', 'flats',
    'accessories', 'bags', 'hats', 'belts', 'scarves', 'jewelry', 'glasses',
    'outerwear'
]
```

### Process

```python
def classify_garment(image_path: str, detection_category: str | None = None) -> ClassificationResult:
    image = Image.open(image_path).convert('RGB')
    inputs = processor(images=image, return_tensors="pt")

    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        probabilities = torch.nn.functional.softmax(logits, dim=-1)

    top_k = 5
    top_probs, top_indices = torch.topk(probabilities[0], top_k)

    predictions = []
    for i in range(top_k):
        idx = top_indices[i].item()
        predictions.append({
            'category': LABELS[idx],
            'confidence': float(top_probs[i]),
            'is_detectron_match': detection_category is not None
                                  and LABELS[idx] == detection_category
        })

    # Blend with Detectron2 result if available
    if detection_category:
        predictions = blend_predictions(predictions, detection_category)

    best = max(predictions, key=lambda p: p['confidence'])

    return ClassificationResult(
        category=best['category'],
        confidence=best['confidence'],
        allPredictions=predictions,
        modelVersion='garment-classifier-v2'
    )
```

### Quality Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| Top-1 confidence | ≥ 0.8 | Accept |
| Top-1 confidence | 0.5 – 0.8 | Accept but flag for review |
| Top-1 confidence | < 0.5 | Reject, mark for manual classification |
| Detectron2 agreement | Both agree | Increase confidence weight |
| Detectron2 disagreement | Conflicting | Use higher confidence source |

### Output

```typescript
{
  category: GarmentCategory;
  confidence: number;                    // 0-1
  allPredictions: Array<{
    category: string;
    confidence: number;
  }>;
  modelVersion: string;
}
```

---

## Step 6: Image Compression (Sharp)

**Service:** `ImageCompressionService` (NestJS with Sharp)

### Process

```typescript
import sharp from 'sharp';

async function compressImage(inputPath: string, outputPath: string): Promise<CompressionResult> {
  const metadata = await sharp(inputPath).metadata();

  const pipeline = sharp(inputPath)
    .withMetadata({ orientation: metadata.orientation })
    .rotate() // Auto-rotate based on EXIF
    .resize({
      width: Math.min(metadata.width!, 2048),
      height: Math.min(metadata.height!, 2048),
      fit: 'inside',
      withoutEnlargement: true,
    });

  let quality: number;
  let format: string;

  switch (metadata.format) {
    case 'jpeg':
      quality = 85;
      pipeline.jpeg({ quality, mozjpeg: true });
      format = 'JPEG';
      break;
    case 'png':
      quality = 80;
      pipeline.png({ quality, palette: true });
      format = 'PNG';
      break;
    case 'webp':
      quality = 80;
      pipeline.webp({ quality });
      format = 'WebP';
      break;
    default:
      pipeline.jpeg({ quality: 85, mozjpeg: true });
      format = 'JPEG';
  }

  await pipeline.toFile(outputPath);
  const outputMeta = await sharp(outputPath).metadata();

  return {
    originalSize: metadata.size || 0,
    compressedSize: outputMeta.size || 0,
    originalDimensions: { width: metadata.width || 0, height: metadata.height || 0 },
    compressedDimensions: { width: outputMeta.width || 0, height: outputMeta.height || 0 },
    format,
    compressionRatio: outputMeta.size ? metadata.size! / outputMeta.size : 1,
  };
}
```

### Compression Targets

| Original Format | Target Format | Quality | Max Dimension |
|-----------------|---------------|---------|---------------|
| JPEG | JPEG (mozjpeg) | 85% | 2048px |
| PNG | PNG (palette) | 80% | 2048px |
| WebP | WebP | 80% | 2048px |

### Size Targets
- Compressed image: max 2 MB
- Target compression ratio: ≥ 3:1 (e.g., 9MB → 3MB)

### Output

```typescript
{
  originalSize: number;          // bytes
  compressedSize: number;        // bytes
  originalDimensions: Dimensions;
  compressedDimensions: Dimensions;
  format: string;
  compressionRatio: number;
}
```

---

## Step 7: Thumbnail Generation (Sharp)

**Service:** `ThumbnailGenerator` (NestJS with Sharp)

### Process

```typescript
async function generateThumbnails(inputPath: string): Promise<ThumbnailResult> {
  const sizes = [
    { width: 64, height: 64, suffix: 'xs' },
    { width: 150, height: 150, suffix: 'sm' },
    { width: 300, height: 300, suffix: 'md' },
  ];

  const thumbnails = [];

  for (const size of sizes) {
    const outputPath = `thumbnails/${path.basename(inputPath, path.extname(inputPath))}_${size.suffix}.webp`;

    await sharp(inputPath)
      .resize(size.width, size.height, {
        fit: 'cover',
        position: 'center',
        withoutEnlargement: true,
      })
      .webp({ quality: 75 })
      .toFile(outputPath);

    const meta = await sharp(outputPath).metadata();
    thumbnails.push({
      url: outputPath,
      width: meta.width,
      height: meta.height,
      size: meta.size,
      suffix: size.suffix,
    });
  }

  return {
    thumbnails,
    primaryThumbnail: thumbnails.find(t => t.suffix === 'md')!.url,
  };
}
```

### Output

```typescript
{
  thumbnails: Array<{
    url: string;
    width: number;
    height: number;
    size: number;       // bytes
    suffix: 'xs' | 'sm' | 'md';
  }>;
  primaryThumbnail: string;  // 300x300 URL
}
```

---

## Step 8: Save Metadata to Database

**Service:** `GarmentMetadataService` (NestJS)

### Process

```typescript
async function saveMetadata(garmentId: string, pipelineResults: PipelineResults): Promise<void> {
  const detectedColors = [
    ...pipelineResults.colorDetection.dominantColors,
  ];

  const updateData: Prisma.GarmentUpdateInput = {
    processingStatus: 'completed',
    processingProgress: 100,
    color: detectedColors[0] || null,
    detectedDominantColors: detectedColors,
    detectedPatterns: pipelineResults.colorDetection.patterns,
    detectedCategory: pipelineResults.classification.category,
    detectionConfidence: pipelineResults.classification.confidence,
    imageUrl: pipelineResults.compression.url,
    thumbnailUrl: pipelineResults.thumbnail.primaryThumbnail,
  };

  if (!pipelineResults.detection.detected) {
    updateData.processingStatus = 'completed';
    updateData.processingError = 'Detección automática de baja calidad, revisar manualmente';
  }

  await prisma.garment.update({
    where: { id: garmentId },
    data: updateData,
  });

  // Save garment image record
  await prisma.garmentImage.create({
    data: {
      garmentId,
      userId: garment.userId,
      originalUrl: originalImageUrl,
      compressedUrl: pipelineResults.compression.url,
      thumbnailUrl: pipelineResults.thumbnail.primaryThumbnail,
      width: pipelineResults.compression.compressedDimensions.width,
      height: pipelineResults.compression.compressedDimensions.height,
      fileSize: pipelineResults.compression.compressedSize,
      mimeType: `image/${pipelineResults.compression.format.toLowerCase()}`,
      storageProvider: 'cloudinary',
      storageKey: cloudinaryKey,
      isPrimary: true,
      processingStatus: 'completed',
    },
  });

  // Emit completion event
  eventEmitter.emit('garment.processed', {
    garmentId,
    userId: garment.userId,
    detectedCategory: pipelineResults.classification.category,
    confidence: pipelineResults.classification.confidence,
    dominantColor: detectedColors[0],
  });
}
```

### Saved Fields

| DB Column | Source Step |
|-----------|-------------|
| `processing_status` | All (set to `completed`) |
| `processing_progress` | All (set to 100) |
| `color` | Step 4 (dominant color) |
| `detected_dominant_colors` | Step 4 |
| `detected_patterns` | Step 4 |
| `detected_category` | Step 5 |
| `detection_confidence` | Step 5 |
| `image_url` | Step 6 |
| `thumbnail_url` | Step 7 |

---

## Step 9: Send to AI Engine for Embedding

**Service:** `EmbeddingService` (Python / NestJS client)

### Process

```typescript
async function generateEmbedding(imageUrl: string): Promise<number[]> {
  const response = await axios.post(`${AI_SERVICE_URL}/embeddings`, {
    imageUrl,
    model: 'garment-embedding-v1',
  });

  return response.data.embedding; // 512-dim vector
}

async function saveEmbedding(garmentId: string, embedding: number[]): Promise<void> {
  await prisma.garment.update({
    where: { id: garmentId },
    data: {
      embedding,
      embeddingVersion: 1,
    },
  });
}
```

### Embedding Model

```python
# Python embedding service
from sentence_transformers import SentenceTransformer
import torch
import torchvision.transforms as transforms
from PIL import Image

model = SentenceTransformer('models/garment-embedding-v1')

def generate_embedding(image_url: str) -> list[float]:
    image = load_image(image_url)

    # Preprocess
    preprocess = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    input_tensor = preprocess(image).unsqueeze(0)

    with torch.no_grad():
        embedding = model.encode(input_tensor)

    return embedding[0].tolist()  # 512-dim float vector
```

### Output

```typescript
{
  embedding: number[];        // 512-dim float array
  modelVersion: string;       // 'garment-embedding-v1'
  dimensions: number;         // 512
}
```

### Usage
- Embeddings enable similarity search: `SELECT * FROM garments ORDER BY embedding <-> $1 LIMIT 10`
- Used by recommendation engine for style compatibility

---

## Pipeline Orchestration

```typescript
async function processGarmentPipeline(job: Job<{ garmentId: string; imageUrl: string }>) {
  const { garmentId, imageUrl } = job.data;
  let currentStep = 0;

  try {
    // Step 1: Validate (handled before queue)
    currentStep = 1;

    // Step 2: Detection
    currentStep = 2;
    const detection = await callStep('detection', { imageUrl });
    updateProgress(garmentId, 20);

    // Step 3: Background Removal
    currentStep = 3;
    const bgRemoved = await callStep('background-removal', {
      imageUrl,
      mask: detection.mask,
    });
    updateProgress(garmentId, 35);

    // Step 4: Color Detection
    currentStep = 4;
    const colors = await callStep('color-detection', { imageUrl });
    updateProgress(garmentId, 50);

    // Step 5: Classification
    currentStep = 5;
    const classification = await callStep('classification', {
      imageUrl,
      detectionCategory: detection.className,
    });
    updateProgress(garmentId, 65);

    // Steps 6-7: Compression & Thumbnail (run in parallel)
    currentStep = 6;
    const [compression, thumbnail] = await Promise.all([
      callStep('compression', { imageUrl }),
      callStep('thumbnail', { imageUrl }),
    ]);
    updateProgress(garmentId, 85);

    // Step 8: Save Metadata
    currentStep = 8;
    await saveMetadata(garmentId, { detection, bgRemoved, colors, classification, compression, thumbnail });
    updateProgress(garmentId, 95);

    // Step 9: Embedding
    currentStep = 9;
    const embedding = await callStep('embedding', { imageUrl: compression.url });
    await saveEmbedding(garmentId, embedding);
    updateProgress(garmentId, 100);

    // Notify
    await notifyCompletion(garmentId, 'completed');

  } catch (error) {
    await handlePipelineError(garmentId, currentStep, error);
    throw error; // Let BullMQ handle retry
  }
}
```

---

## Retry Policies

| Step | Max Retries | Backoff | Timeout |
|------|-------------|---------|---------|
| 1. Validate | 0 (instant) | — | 10s |
| 2. Detect | 3 | 2s, 4s, 8s | 60s |
| 3. BgRemove | 3 | 2s, 4s, 8s | 120s |
| 4. ColorDetect | 2 | 2s, 4s | 30s |
| 5. Classify | 3 | 2s, 4s, 8s | 60s |
| 6. Compress | 2 | 2s, 4s | 60s |
| 7. Thumbnail | 2 | 2s, 4s | 30s |
| 8. SaveMeta | 3 | 1s, 2s, 4s | 10s |
| 9. Embedding | 3 | 2s, 4s, 8s | 120s |

---

## Quality Dashboard Metrics

```python
# Tracked per pipeline run
pipeline_metrics = {
    'total_duration_ms': int,
    'step_durations_ms': dict[str, int],
    'detection_confidence': float,
    'classification_confidence': float,
    'compression_ratio': float,
    'color_accuracy': float,      # delta-E vs manual
    'success': bool,
    'error_step': str | None,
}
```

---

## Async Processing with BullMQ

```typescript
// Queue definition
const garmentPipelineQueue = new Queue('garment-pipeline', {
  connection: { host: process.env.REDIS_HOST, port: 6379 },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
    timeout: 300000, // 5 min total pipeline timeout
  },
});

// Worker
const worker = new Worker(
  'garment-pipeline',
  async (job) => processGarmentPipeline(job),
  {
    connection: { host: process.env.REDIS_HOST, port: 6379 },
    concurrency: 4,  // 4 parallel pipelines
    limiter: {
      max: 10,       // max 10 jobs per second
      duration: 1000,
    },
  }
);
```
