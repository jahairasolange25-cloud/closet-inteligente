from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class PipelineStepRequest(BaseModel):
    step: Literal["background_removal", "classification", "attribute_extraction", "thumbnail"]
    garment_id: str = Field(..., alias="garmentId")
    image_url: str = Field(..., alias="imageUrl")
    request_id: str = Field(default="", alias="requestId")

    model_config = {"populate_by_name": True}


class PipelineStepResponse(BaseModel):
    request_id: str = Field(default="", alias="requestId")
    step: str
    status: Literal["completed", "failed", "partial"]
    result: Optional[dict] = None
    error: Optional[dict] = None
    processing_ms: float = 0

    model_config = {"populate_by_name": True}


class FullPipelineRequest(BaseModel):
    garment_id: str = Field(..., alias="garmentId")
    image_url: str = Field(..., alias="imageUrl")
    request_id: str = Field(default="", alias="requestId")
    user_id: str = Field(default="", alias="userId")

    model_config = {"populate_by_name": True}


class PipelineStageResult(BaseModel):
    step: str
    status: Literal["completed", "failed", "skipped"]
    started_at: datetime
    completed_at: Optional[datetime] = None
    error: Optional[str] = None
    result: Optional[dict] = None


class FullPipelineResponse(BaseModel):
    pipeline_id: str = Field(default="", alias="pipelineId")
    garment_id: str = Field(default="", alias="garmentId")
    status: Literal["pending", "processing", "completed", "failed", "partial"]
    steps: list[PipelineStageResult] = []
    error: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    total_processing_ms: float = 0

    model_config = {"populate_by_name": True}


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "0.1.0"
    service: str = "closet-ai"
    uptime_seconds: Optional[float] = None
    models: Optional[dict[str, Any]] = None
    pipeline_config: Optional[dict[str, Any]] = None
    disk: Optional[dict[str, Any]] = None
    memory: Optional[dict[str, Any]] = None
