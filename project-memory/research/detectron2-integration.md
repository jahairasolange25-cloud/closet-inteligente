# Detectron2 Integration Guide

## Overview

Detectron2 serves as the core garment detection and segmentation engine for the Closet Inteligente Digital platform. It provides instance segmentation for individual garment items in user-uploaded photos, enabling automated cataloging, color extraction, and measurement estimation.

---

## 1. Environment Setup

### Python Version & CUDA Support

| Component | Requirement |
|-----------|-------------|
| Python | 3.9 – 3.11 (3.12 not fully supported by Detectron2) |
| CUDA | 11.8+ for GPU inference |
| PyTorch | 2.0 – 2.1 (matching CUDA version) |
| Detectron2 | 0.6+ (build from source or use prebuilt wheel) |

### Installation

```bash
# Create conda environment
conda create -n closet-detection python=3.10
conda activate closet-detection

# Install PyTorch with CUDA 11.8
pip install torch==2.1.0 torchvision==0.16.0 --index-url https://download.pytorch.org/whl/cu118

# Build Detectron2 from source
pip install -e "git+https://github.com/facebookresearch/detectron2.git@v0.6#egg=detectron2"

# Additional dependencies
pip install opencv-python==4.8.1.78
pip install numpy==1.24.3
pip install pillow==10.1.0
pip install fastapi==0.104.1
pip install uvicorn[standard]==0.24.0
pip install python-multipart==0.0.6
pip install pydantic==2.5.2
pip install redis==5.0.1
```

### Docker Image (Production)

```dockerfile
FROM pytorch/pytorch:2.1.0-cuda11.8-cudnn8-runtime

RUN apt-get update && apt-get install -y \
    git \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Detectron2
RUN pip install "git+https://github.com/facebookresearch/detectron2.git@v0.6#egg=detectron2"

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 2. Model Configuration

### Pre-trained Model Selection

| Model | Backbone | Mask AP | Speed | Use Case |
|-------|----------|---------|-------|----------|
| `mask_rcnn_R_50_FPN_3x` | ResNet-50 | 41.0 | Fast | General garment detection |
| `mask_rcnn_R_101_FPN_3x` | ResNet-101 | 42.9 | Medium | Higher accuracy needs |
| `mask_rcnn_X_101_32x8d_FPN_3x` | ResNeXt-101 | 44.3 | Slow | Maximum accuracy |

**Recommendation:** Start with `mask_rcnn_R_50_FPN_3x` for real-time inference, fine-tune on garment dataset for domain-specific accuracy.

### Configuration File

```python
# configs/garment_detection_config.py
from detectron2.config import get_cfg
from detectron2 import model_zoo

def get_garment_cfg():
    cfg = get_cfg()
    cfg.merge_from_file(model_zoo.get_config_file(
        "COCO-InstanceSegmentation/mask_rcnn_R_50_FPN_3x.yaml"
    ))
    
    # Model weights
    cfg.MODEL.WEIGHTS = model_zoo.get_checkpoint_url(
        "COCO-InstanceSegmentation/mask_rcnn_R_50_FPN_3x"
    )
    
    # Thresholds
    cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = 0.7
    cfg.MODEL.ROI_HEADS.NMS_THRESH_TEST = 0.5
    
    # Input size
    cfg.INPUT.MIN_SIZE_TEST = 800
    cfg.INPUT.MAX_SIZE_TEST = 1333
    
    # Data augmentation (for fine-tuning)
    cfg.INPUT.RANDOM_FLIP = "horizontal"
    cfg.INPUT.CROP.ENABLED = True
    cfg.INPUT.CROP.TYPE = "relative_range"
    cfg.INPUT.CROP.SIZE = [0.8, 0.8]
    
    # Batch size (per GPU)
    cfg.SOLVER.IMS_PER_BATCH = 4
    
    # Num workers
    cfg.DATALOADER.NUM_WORKERS = 4
    
    return cfg
```

### COCO Garment-Related Classes

Detectron2's COCO model includes these garment-relevant classes:
- `tie` (class 27)
- `suitcase` (class 28)
- `umbrella` (class 30)
- `handbag` (class 31)
- `backpack` (class 24)
- `skis` (class 32)
- `snowboard` (class 33)
- `sports ball` (class 34)
- `bottle` (class 39) – accessory
- `cup` (class 40)
- `fork` (class 41)
- `knife` (class 42)
- `spoon` (class 43)
- `bowl` (class 44)

For dedicated garment detection, **fine-tuning on a fashion dataset is mandatory** (DeepFashion2, iMaterialist Fashion).

---

## 3. Custom Fine-Tuning

### Dataset Preparation

Format: COCO JSON annotation format.

```python
# dataset/garment_dataset.py
import json
from detectron2.structures import BoxMode
from detectron2.data import DatasetCatalog, MetadataCatalog

GARMENT_CATEGORIES = [
    {"id": 1, "name": "shirt"},
    {"id": 2, "name": "t-shirt"},
    {"id": 3, "name": "dress"},
    {"id": 4, "name": "pants"},
    {"id": 5, "name": "jeans"},
    {"id": 6, "name": "skirt"},
    {"id": 7, "name": "jacket"},
    {"id": 8, "name": "coat"},
    {"id": 9, "name": "sweater"},
    {"id": 10, "name": "hoodie"},
    {"id": 11, "name": "shorts"},
    {"id": 12, "name": "shoes"},
    {"id": 13, "name": "hat"},
    {"id": 14, "name": "scarf"},
    {"id": 15, "name": "belt"},
    {"id": 16, "name": "bag"},
    {"id": 17, "name": "watch"},
    {"id": 18, "name": "sunglasses"},
]

def get_garment_dicts(img_dir, json_file):
    with open(json_file) as f:
        dataset = json.load(f)
    
    dataset_dicts = []
    for idx, ann in enumerate(dataset["annotations"]):
        record = {}
        filename = f"{ann['image_id']:012d}.jpg"
        record["file_name"] = f"{img_dir}/{filename}"
        record["image_id"] = idx
        record["height"] = ann["height"]
        record["width"] = ann["width"]
        
        objs = []
        for seg in ann["segmentations"]:
            px, py = seg[0::2], seg[1::2]
            poly = [(x, y) for x, y in zip(px, py)]
            poly = [p for x in poly for p in x]
            
            obj = {
                "bbox": [np.min(px), np.min(py), np.max(px), np.max(py)],
                "bbox_mode": BoxMode.XYXY_ABS,
                "segmentation": [poly],
                "category_id": ann["category_id"],
                "iscrowd": 0,
            }
            objs.append(obj)
        
        record["annotations"] = objs
        dataset_dicts.append(record)
    
    return dataset_dicts

def register_garment_dataset(train_img_dir, train_json, val_img_dir, val_json):
    for split, img_dir, json_file in [
        ("train", train_img_dir, train_json),
        ("val", val_img_dir, val_json),
    ]:
        DatasetCatalog.register(
            f"garment_{split}",
            lambda d=img_dir, j=json_file: get_garment_dicts(d, j)
        )
        MetadataCatalog.get(f"garment_{split}").set(
            thing_classes=[cat["name"] for cat in GARMENT_CATEGORIES]
        )
```

### Fine-Tuning Script

```python
# train_garment.py
import torch
from detectron2.engine import DefaultTrainer
from detectron2.data import build_detection_train_loader
from detectron2.data import DatasetMapper
from detectron2.evaluation import COCOEvaluator, inference_on_dataset
from detectron2.data import build_detection_test_loader

from configs.garment_detection_config import get_garment_cfg
from dataset.garment_dataset import register_garment_dataset

class GarmentTrainer(DefaultTrainer):
    @classmethod
    def build_evaluator(cls, cfg, dataset_name, output_folder=None):
        if output_folder is None:
            output_folder = os.path.join(cfg.OUTPUT_DIR, "inference")
        return COCOEvaluator(dataset_name, cfg, True, output_folder)

def main():
    register_garment_dataset(
        train_img_dir="data/train/images",
        train_json="data/train/annotations.json",
        val_img_dir="data/val/images",
        val_json="data/val/annotations.json",
    )
    
    cfg = get_garment_cfg()
    cfg.DATASETS.TRAIN = ("garment_train",)
    cfg.DATASETS.TEST = ("garment_val",)
    cfg.DATALOADER.NUM_WORKERS = 4
    
    # Fine-tuning: freeze backbone initially
    cfg.MODEL.BACKBONE.FREEZE_AT = 5  # 0=no freeze, 5=freeze all
    
    # Training hyperparameters
    cfg.SOLVER.BASE_LR = 0.00025
    cfg.SOLVER.MAX_ITER = 10000
    cfg.SOLVER.STEPS = (6000, 8000)
    cfg.SOLVER.GAMMA = 0.1
    cfg.SOLVER.WARMUP_FACTOR = 0.001
    cfg.SOLVER.WARMUP_ITERS = 500
    
    # Output
    cfg.OUTPUT_DIR = "output/garment_model"
    os.makedirs(cfg.OUTPUT_DIR, exist_ok=True)
    
    trainer = GarmentTrainer(cfg)
    trainer.resume_or_load(resume=False)
    trainer.train()
    
    # Evaluate
    evaluator = COCOEvaluator("garment_val", cfg, False, output_dir=cfg.OUTPUT_DIR)
    val_loader = build_detection_test_loader(cfg, "garment_val")
    results = inference_on_dataset(trainer.model, val_loader, evaluator)
    print(f"Evaluation results: {results}")

if __name__ == "__main__":
    main()
```

---

## 4. Inference Pipeline

### Core Inference Engine

```python
# inference/garment_detector.py
import cv2
import numpy as np
import torch
from detectron2.engine import DefaultPredictor
from detectron2.utils.visualizer import Visualizer
from detectron2.data import MetadataCatalog

from configs.garment_detection_config import get_garment_cfg


class GarmentDetector:
    def __init__(self, model_path: str = None, confidence_threshold: float = 0.7):
        self.cfg = get_garment_cfg()
        
        if model_path:
            self.cfg.MODEL.WEIGHTS = model_path
        
        self.cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = confidence_threshold
        self.cfg.MODEL.DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
        
        self.predictor = DefaultPredictor(self.cfg)
        self.metadata = MetadataCatalog.get(self.cfg.DATASETS.TRAIN[0] 
                                            if len(self.cfg.DATASETS.TRAIN) > 0 
                                            else "__unused")
    
    def detect(self, image: np.ndarray) -> dict:
        """
        Run detection on a single image.
        
        Args:
            image: BGR numpy array (OpenCV format)
            
        Returns:
            dict with keys: instances, image_shape
        """
        # Validate input
        if image is None or image.size == 0:
            raise ValueError("Invalid image input")
        
        # Ensure correct shape
        if len(image.shape) != 3:
            raise ValueError(f"Expected 3-channel image, got shape {image.shape}")
        
        # Run inference
        with torch.no_grad():
            outputs = self.predictor(image)
        
        return {
            "instances": outputs["instances"],
            "image_shape": image.shape,
        }
    
    def detect_batch(self, images: list[np.ndarray], batch_size: int = 4) -> list[dict]:
        """
        Run detection on a batch of images.
        
        Args:
            images: list of BGR numpy arrays
            batch_size: max images per batch
            
        Returns:
            list of detection result dicts
        """
        results = []
        for i in range(0, len(images), batch_size):
            batch = images[i:i + batch_size]
            batch_results = [self.detect(img) for img in batch]
            results.extend(batch_results)
        
        return results
    
    def extract_garments(self, image: np.ndarray, detection: dict = None) -> list[dict]:
        """
        Extract individual garment masks and metadata from detection results.
        
        Returns:
            List of dicts: {bbox, mask, class_name, confidence, cropped_image}
        """
        if detection is None:
            detection = self.detect(image)
        
        instances = detection["instances"]
        garments = []
        
        for i in range(len(instances)):
            bbox = instances.pred_boxes.tensor[i].cpu().numpy()
            mask = instances.pred_masks[i].cpu().numpy()
            class_id = instances.pred_classes[i].cpu().item()
            confidence = instances.scores[i].cpu().item()
            
            class_name = self.metadata.thing_classes[class_id] if self.metadata else str(class_id)
            
            # Extract cropped garment with mask applied
            x1, y1, x2, y2 = bbox.astype(int)
            masked_img = image.copy()
            masked_img[~mask] = 0
            cropped = masked_img[y1:y2, x1:x2]
            
            garments.append({
                "bbox": bbox.tolist(),
                "mask": mask,
                "class_id": class_id,
                "class_name": class_name,
                "confidence": float(confidence),
                "cropped_image": cropped,
            })
        
        return garments
    
    def get_garment_count(self, image: np.ndarray) -> int:
        """Quick count of detected garments."""
        detections = self.detect(image)
        return len(detections["instances"])
```

### Batch Async Inference

```python
# inference/async_detector.py
import asyncio
from concurrent.futures import ThreadPoolExecutor
import numpy as np
from inference.garment_detector import GarmentDetector


class AsyncGarmentDetector:
    def __init__(self, model_path: str = None):
        self.executor = ThreadPoolExecutor(max_workers=2)
        self.detector = GarmentDetector(model_path)
    
    async def detect(self, image: np.ndarray) -> dict:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor, self.detector.detect, image
        )
    
    async def extract_garments(self, image: np.ndarray) -> list[dict]:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor, self.detector.extract_garments, image
        )
    
    async def detect_batch(self, images: list[np.ndarray]) -> list[dict]:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor, self.detector.detect_batch, images
        )
```

---

## 5. Output Format

### Structured Detection Result

```python
# models/detection_result.py
from pydantic import BaseModel
from typing import List, Optional

class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    width: float
    height: float

class GarmentDetection(BaseModel):
    bbox: BoundingBox
    class_id: int
    class_name: str
    confidence: float
    mask_rle: str  # Run-length encoding for efficient storage
    area_pixels: int
    aspect_ratio: float

class DetectionResult(BaseModel):
    image_id: str
    image_width: int
    image_height: int
    garments: List[GarmentDetection]
    processing_time_ms: float
    model_version: str
    error: Optional[str] = None
```

### Run-Length Encoding for Masks

```python
# utils/mask_encoding.py
import numpy as np

def mask_to_rle(mask: np.ndarray) -> str:
    """
    Convert binary mask to run-length encoded string.
    Format: "counts" where counts alternates between 0 and 1 runs.
    """
    pixels = mask.flatten(order='F')
    pixels = np.concatenate([[0], pixels, [0]])
    runs = np.where(pixels[1:] != pixels[:-1])[0] + 1
    runs[1::2] -= runs[0::2]
    return ' '.join(str(r) for r in runs)

def rle_to_mask(rle: str, shape: tuple) -> np.ndarray:
    """
    Convert run-length encoded string back to binary mask.
    """
    runs = [int(x) for x in rle.split()]
    pixels = np.zeros(np.prod(shape), dtype=np.uint8)
    start = 0
    for i, length in enumerate(runs):
        if i % 2 == 1:  # odd indices are foreground runs
            pixels[start:start + length] = 1
        start += length
    return pixels.reshape(shape, order='F')
```

---

## 6. REST API Service

### FastAPI Inference Server

```python
# main.py
import os
import time
import uuid
import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from inference.async_detector import AsyncGarmentDetector
from models.detection_result import DetectionResult, GarmentDetection, BoundingBox
from utils.mask_encoding import mask_to_rle

MODEL_PATH = os.environ.get("MODEL_PATH", "output/garment_model/model_final.pth")
detector: AsyncGarmentDetector = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global detector
    detector = AsyncGarmentDetector(MODEL_PATH)
    yield

app = FastAPI(title="Closet Inteligente - Garment Detection API", lifespan=lifespan)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": detector is not None,
        "device": "cuda" if hasattr(detector, 'detector') and 
                          detector.detector.cfg.MODEL.DEVICE == "cuda" else "cpu"
    }

@app.post("/detect", response_model=DetectionResult)
async def detect_garments(
    file: UploadFile = File(...),
    confidence: float = 0.7,
):
    """
    Detect garments in an uploaded image.
    """
    start_time = time.time()
    image_id = str(uuid.uuid4())
    
    # Validate file type
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(400, "Unsupported image format. Use JPEG, PNG, or WebP.")
    
    # Read and decode image
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image is None:
        raise HTTPException(400, "Failed to decode image. File may be corrupted.")
    
    # Validate image dimensions
    height, width = image.shape[:2]
    if height < 100 or width < 100:
        raise HTTPException(400, "Image too small. Minimum 100x100 pixels.")
    if height > 4096 or width > 4096:
        raise HTTPException(400, "Image too large. Maximum 4096x4096 pixels.")
    
    try:
        # Run detection
        detection = await detector.detect(image)
        garments_data = await detector.extract_garments(image)
    except Exception as e:
        raise HTTPException(500, f"Detection failed: {str(e)}")
    
    # Format results
    garments = []
    for g in garments_data:
        bbox = g["bbox"]
        garments.append(GarmentDetection(
            bbox=BoundingBox(
                x1=bbox[0], y1=bbox[1],
                x2=bbox[2], y2=bbox[3],
                width=bbox[2] - bbox[0],
                height=bbox[3] - bbox[1],
            ),
            class_id=g["class_id"],
            class_name=g["class_name"],
            confidence=g["confidence"],
            mask_rle=mask_to_rle(g["mask"]),
            area_pixels=int(np.sum(g["mask"])),
            aspect_ratio=(bbox[2] - bbox[0]) / (bbox[3] - bbox[1]),
        ))
    
    processing_time = (time.time() - start_time) * 1000
    
    return DetectionResult(
        image_id=image_id,
        image_width=width,
        image_height=height,
        garments=garments,
        processing_time_ms=round(processing_time, 2),
        model_version="mask_rcnn_R_50_FPN_3x_garment_v1",
    )

@app.post("/detect/batch")
async def detect_batch(files: list[UploadFile] = File(...)):
    """
    Detect garments in multiple images.
    """
    results = []
    for file in files:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is not None:
            result = await detector.extract_garments(image)
            results.append({
                "filename": file.filename,
                "garments": len(result),
                "classes": [g["class_name"] for g in result],
            })
        else:
            results.append({
                "filename": file.filename,
                "error": "Failed to decode image",
            })
    
    return {"results": results, "total_images": len(files)}
```

### Health Check Endpoint (Detailed)

```python
@app.get("/health/detailed")
async def health_check_detailed():
    """Detailed health check with model metadata."""
    if detector is None:
        return JSONResponse(
            status_code=503,
            content={"status": "unavailable", "message": "Model not loaded"}
        )
    
    import torch
    import psutil
    
    model = detector.detector.predictor.model
    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    
    gpu_info = {}
    if torch.cuda.is_available():
        gpu_info = {
            "device_count": torch.cuda.device_count(),
            "current_device": torch.cuda.current_device(),
            "device_name": torch.cuda.get_device_name(0),
            "memory_allocated_gb": round(torch.cuda.memory_allocated(0) / 1024**3, 2),
            "memory_reserved_gb": round(torch.cuda.memory_reserved(0) / 1024**3, 2),
        }
    
    return {
        "status": "healthy",
        "model": {
            "name": "mask_rcnn_R_50_FPN_3x",
            "version": "garment_v1",
            "total_parameters": total_params,
            "trainable_parameters": trainable_params,
        },
        "hardware": {
            "cpu_percent": psutil.cpu_percent(),
            "memory_percent": psutil.virtual_memory().percent,
            **gpu_info,
        },
        "uptime": time.time() - start_time,
    }
```

---

## 7. Error Handling

### Structured Error Handling

```python
# inference/errors.py
class DetectionError(Exception):
    """Base exception for detection failures."""
    pass

class ImageDecodeError(DetectionError):
    """Raised when image cannot be decoded."""
    pass

class ImageTooSmallError(DetectionError):
    """Raised when image dimensions are below minimum."""
    pass

class ImageTooLargeError(DetectionError):
    """Raised when image dimensions exceed maximum."""
    pass

class NoGarmentsDetected(DetectionError):
    """Raised when no garments found in image."""
    pass

class ModelNotLoadedError(DetectionError):
    """Raised when model weights failed to load."""
    pass

class GPUOutOfMemoryError(DetectionError):
    """Raised when CUDA runs out of memory."""
    pass
```

### Error Handler Middleware

```python
# middleware/error_handler.py
from fastapi import Request
from fastapi.responses import JSONResponse
from inference.errors import *

ERROR_STATUS_MAP = {
    ImageDecodeError: 400,
    ImageTooSmallError: 400,
    ImageTooLargeError: 400,
    NoGarmentsDetected: 200,  # Return empty result, not an error
    ModelNotLoadedError: 503,
    GPUOutOfMemoryError: 507,
}

@app.exception_handler(DetectionError)
async def detection_error_handler(request: Request, exc: DetectionError):
    status = ERROR_STATUS_MAP.get(type(exc), 500)
    return JSONResponse(
        status_code=status,
        content={
            "error": type(exc).__name__,
            "message": str(exc),
            "status": status,
        }
    )
```

---

## 8. Performance Optimization

### Batch Processing

```python
# inference/batch_processor.py
import asyncio
import numpy as np
from typing import List
from inference.garment_detector import GarmentDetector


class BatchProcessor:
    """
    Processes images in configurable batches with adaptive sizing based on
    GPU memory availability.
    """
    
    def __init__(self, detector: GarmentDetector, max_batch_size: int = 8):
        self.detector = detector
        self.max_batch_size = max_batch_size
        self.current_batch_size = max_batch_size
    
    def _adaptive_batch_size(self) -> int:
        """Reduce batch size if GPU memory is constrained."""
        import torch
        if not torch.cuda.is_available():
            return 1
        
        free_mem = torch.cuda.mem_get_info()[0]
        free_mem_gb = free_mem / 1024**3
        
        if free_mem_gb < 1.0:
            return 1
        elif free_mem_gb < 2.0:
            return 2
        elif free_mem_gb < 4.0:
            return 4
        else:
            return self.max_batch_size
    
    async def process_queue(self, image_queue: asyncio.Queue, result_queue: asyncio.Queue):
        """Continuously process images from queue with adaptive batching."""
        while True:
            batch = []
            batch_size = self._adaptive_batch_size()
            
            # Gather batch
            for _ in range(batch_size):
                try:
                    item = await asyncio.wait_for(image_queue.get(), timeout=0.1)
                    batch.append(item)
                except asyncio.TimeoutError:
                    break
            
            if not batch:
                await asyncio.sleep(0.01)
                continue
            
            # Process batch
            images = [item["image"] for item in batch]
            try:
                results = self.detector.detect_batch(images)
                for item, result in zip(batch, results):
                    await result_queue.put({
                        "id": item["id"],
                        "result": result,
                        "error": None,
                    })
            except Exception as e:
                for item in batch:
                    await result_queue.put({
                        "id": item["id"],
                        "result": None,
                        "error": str(e),
                    })
```

### GPU Memory Management

```python
# inference/gpu_manager.py
import torch
import gc

class GPUMemoryManager:
    """Manages GPU memory for inference server."""
    
    def __init__(self, device_id: int = 0):
        self.device_id = device_id
        self.device = torch.device(f"cuda:{device_id}")
    
    def clear_cache(self):
        """Clear GPU cache after large batches."""
        torch.cuda.empty_cache()
        gc.collect()
    
    def get_memory_stats(self) -> dict:
        return {
            "allocated_gb": round(torch.cuda.memory_allocated(self.device) / 1024**3, 2),
            "reserved_gb": round(torch.cuda.memory_reserved(self.device) / 1024**3, 2),
            "max_allocated_gb": round(torch.cuda.max_memory_allocated(self.device) / 1024**3, 2),
        }
    
    def reset_peak_stats(self):
        torch.cuda.reset_peak_memory_stats(self.device)
    
    def context(self):
        """Context manager for memory tracking."""
        self.reset_peak_stats()
        return self
    
    def __enter__(self):
        self.reset_peak_stats()
        return self
    
    def __exit__(self, *args):
        stats = self.get_memory_stats()
        self.clear_cache()
        return stats
```

### Image Preprocessing Pipeline

```python
# preprocessing/image_pipeline.py
import cv2
import numpy as np
from typing import Tuple, Optional

class ImagePreprocessor:
    """Preprocesses images for optimal detection performance."""
    
    def __init__(self, target_size: Tuple[int, int] = (800, 1333)):
        self.target_size = target_size
    
    def resize_with_aspect_ratio(self, image: np.ndarray) -> np.ndarray:
        h, w = image.shape[:2]
        target_h, target_w = self.target_size
        
        scale = min(target_h / h, target_w / w)
        new_w = int(w * scale)
        new_h = int(h * scale)
        
        resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
        return resized
    
    def normalize_lighting(self, image: np.ndarray) -> np.ndarray:
        """Apply CLAHE for lighting normalization."""
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        lab = cv2.merge([l, a, b])
        return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
    
    def remove_background_guess(self, image: np.ndarray) -> np.ndarray:
        """Simple background removal using edge detection + flood fill.
        For production, use Detectron2 segmentation directly.
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)
        kernel = np.ones((5, 5), np.uint8)
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        return cv2.bitwise_and(image, image, mask=thresh)
    
    def preprocess(self, image: np.ndarray) -> np.ndarray:
        """Full preprocessing pipeline."""
        image = self.resize_with_aspect_ratio(image)
        image = self.normalize_lighting(image)
        return image
```

---

## 9. Integration with Python Service Layer

### Service Layer Pattern

```python
# services/garment_detection_service.py
import asyncio
from typing import List, Optional
from dataclasses import dataclass

from inference.async_detector import AsyncGarmentDetector
from preprocessing.image_pipeline import ImagePreprocessor
from inference.errors import *

@dataclass
class DetectionRequest:
    image_id: str
    image_bytes: bytes
    user_id: str
    priority: int = 0  # Higher = more urgent

@dataclass
class DetectionResponse:
    image_id: str
    garments: List[dict]
    error: Optional[str] = None


class GarmentDetectionService:
    """
    Orchestrates the full detection pipeline:
    image preprocessing -> model inference -> result formatting -> caching
    """
    
    def __init__(self, detector: AsyncGarmentDetector, cache_client=None):
        self.detector = detector
        self.preprocessor = ImagePreprocessor()
        self.cache = cache_client  # Redis client
        self.processing_queue = asyncio.Queue(maxsize=100)
    
    async def process_image(self, request: DetectionRequest) -> DetectionResponse:
        """Single image processing with caching."""
        # Check cache
        if self.cache:
            cached = await self.cache.get(f"detection:{request.image_id}")
            if cached:
                return DetectionResponse(**json.loads(cached))
        
        try:
            # Decode and preprocess
            import cv2
            import numpy as np
            nparr = np.frombuffer(request.image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                raise ImageDecodeError("Failed to decode image")
            
            image = self.preprocessor.preprocess(image)
            
            # Detect
            garments = await self.detector.extract_garments(image)
            
            # Validate
            if len(garments) == 0:
                # Not an error - just empty result
                pass
            
            response = DetectionResponse(
                image_id=request.image_id,
                garments=[{
                    "class_name": g["class_name"],
                    "confidence": g["confidence"],
                    "bbox": g["bbox"],
                    "area_pixels": int(np.sum(g["mask"])),
                } for g in garments],
            )
            
            # Cache result (15 min TTL)
            if self.cache:
                await self.cache.setex(
                    f"detection:{request.image_id}",
                    900,
                    response.model_dump_json()
                )
            
            return response
            
        except DetectionError as e:
            return DetectionResponse(
                image_id=request.image_id,
                garments=[],
                error=str(e),
            )
    
    async def process_batch(self, requests: List[DetectionRequest]) -> List[DetectionResponse]:
        """Batch processing with concurrency control."""
        semaphore = asyncio.Semaphore(5)  # Max 5 concurrent inferences
        
        async def limited_process(req):
            async with semaphore:
                return await self.process_image(req)
        
        tasks = [limited_process(req) for req in requests]
        return await asyncio.gather(*tasks)
```

---

## 10. Redis Caching Layer

```python
# cache/detection_cache.py
import json
import hashlib
from typing import Optional
import redis.asyncio as aioredis

class DetectionCache:
    """Redis-backed cache for detection results to avoid re-processing."""
    
    def __init__(self, redis_url: str = "redis://localhost:6379/0"):
        self.client = aioredis.from_url(redis_url, decode_responses=True)
        self.default_ttl = 900  # 15 minutes
    
    def _make_key(self, image_bytes: bytes, confidence: float) -> str:
        """Generate cache key from image content hash."""
        content_hash = hashlib.sha256(image_bytes).hexdigest()[:16]
        return f"garment_detection:{content_hash}:{confidence}"
    
    async def get(self, image_bytes: bytes, confidence: float) -> Optional[dict]:
        key = self._make_key(image_bytes, confidence)
        cached = await self.client.get(key)
        return json.loads(cached) if cached else None
    
    async def set(self, image_bytes: bytes, confidence: float, result: dict, ttl: int = None):
        key = self._make_key(image_bytes, confidence)
        await self.client.setex(
            key,
            ttl or self.default_ttl,
            json.dumps(result)
        )
    
    async def invalidate(self, image_bytes: bytes):
        """Invalidate all confidence variants for an image."""
        prefix = f"garment_detection:{hashlib.sha256(image_bytes).hexdigest()[:16]}:"
        cursor = 0
        while True:
            cursor, keys = await self.client.scan(cursor, match=f"{prefix}*")
            if keys:
                await self.client.delete(*keys)
            if cursor == 0:
                break
```

---

## 11. Testing

```python
# tests/test_garment_detector.py
import pytest
import cv2
import numpy as np
from inference.garment_detector import GarmentDetector

@pytest.fixture
def sample_image():
    """Create a synthetic test image with a simple shape."""
    img = np.ones((400, 400, 3), dtype=np.uint8) * 255
    cv2.rectangle(img, (50, 50), (200, 300), (100, 100, 200), -1)
    return img

@pytest.fixture
def detector():
    model_path = "output/garment_model/model_final.pth"
    return GarmentDetector(model_path, confidence_threshold=0.5)

def test_detect_returns_instances(detector, sample_image):
    result = detector.detect(sample_image)
    assert "instances" in result
    assert "image_shape" in result

def test_detect_raises_on_none(detector):
    with pytest.raises(ValueError):
        detector.detect(None)

def test_detect_raises_on_empty(detector):
    with pytest.raises(ValueError):
        detector.detect(np.array([]))

def test_extract_garments_structure(detector, sample_image):
    garments = detector.extract_garments(sample_image)
    for g in garments:
        assert "bbox" in g
        assert "class_name" in g
        assert "confidence" in g
        assert "mask" in g
        assert "cropped_image" in g

def test_garment_count(detector, sample_image):
    count = detector.get_garment_count(sample_image)
    assert count >= 0

def test_batch_detection(detector):
    images = [np.ones((300, 300, 3), dtype=np.uint8) * 255 for _ in range(3)]
    results = detector.detect_batch(images, batch_size=2)
    assert len(results) == 3
```

---

## 12. Deployment Checklist

- [ ] GPU driver (NVIDIA 525+) and CUDA 11.8 installed
- [ ] Docker container with PyTorch + Detectron2
- [ ] Model weights downloaded or built
- [ ] Redis running for cache layer
- [ ] Health endpoint `/health` responding
- [ ] Batch endpoint configured with max batch size
- [ ] GPU memory monitoring in place
- [ ] Logging to stdout/stderr (structured JSON)
- [ ] Prometheus metrics for request rate, latency, errors
- [ ] Horizontal scaling: multiple GPU containers behind load balancer
- [ ] Graceful shutdown: finish in-flight detections
- [ ] Model warmup: run dummy inference on startup
