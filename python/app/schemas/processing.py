from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class EmbeddingRequest(BaseModel):
    image_url: str = Field(..., alias="imageUrl")
    dominant_colors: Optional[list[str]] = Field(default=None, alias="dominantColors")
    category: Optional[str] = None
    style_tags: Optional[list[str]] = Field(default=None, alias="styleTags")
    model: str = "resnet50-v1"

    model_config = {"populate_by_name": True}


class EmbeddingResponse(BaseModel):
    embedding: list[float]
    dimension: int
    color_embedding: list[float] = Field(default_factory=list)
    style_embedding: list[float] = Field(default_factory=list)
    model_version: str = "resnet50-v1"

    model_config = {"populate_by_name": True}


class ClassificationResult(BaseModel):
    category: str
    confidence: float
    all_predictions: list[dict[str, Any]] = Field(default_factory=list)
    model_version: str = "garment-classifier-v2"
    uncertain: bool = False

    model_config = {"populate_by_name": True}


class ColorResult(BaseModel):
    dominant_colors: list[dict[str, Any]] = Field(default_factory=list)
    palette_hex: list[str] = Field(default_factory=list)
    dominant_color: Optional[str] = None
    patterns: list[str] = Field(default_factory=list)
    is_monochromatic: bool = False
    is_neutral: bool = False

    model_config = {"populate_by_name": True}


class MetadataResult(BaseModel):
    width: int = 0
    height: int = 0
    aspect_ratio: float = 0.0
    file_size: int = 0
    format: str = "unknown"

    model_config = {"populate_by_name": True}


class ProcessingResult(BaseModel):
    pipeline_id: str = ""
    garment_id: str = ""
    status: str = "pending"
    classification: Optional[ClassificationResult] = None
    colors: Optional[ColorResult] = None
    metadata: Optional[MetadataResult] = None
    thumbnail_url: Optional[str] = None
    preview_url: Optional[str] = None
    embedding: Optional[list[float]] = None
    error: Optional[str] = None
    processing_ms: float = 0

    model_config = {"populate_by_name": True}
