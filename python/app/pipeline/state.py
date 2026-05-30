from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class PipelineStage(str, Enum):
    PENDING = "pending"
    DOWNLOADING = "downloading"
    PREPROCESSING = "preprocessing"
    BACKGROUND_REMOVED = "background_removed"
    CLASSIFYING = "classifying"
    EXTRACTING_COLORS = "extracting_colors"
    GENERATING_ASSETS = "generating_assets"
    COMPLETED = "completed"
    PARTIAL = "partial"
    FAILED = "failed"


STAGE_ORDER: list[PipelineStage] = [
    PipelineStage.DOWNLOADING,
    PipelineStage.PREPROCESSING,
    PipelineStage.BACKGROUND_REMOVED,
    PipelineStage.CLASSIFYING,
    PipelineStage.EXTRACTING_COLORS,
    PipelineStage.GENERATING_ASSETS,
    PipelineStage.COMPLETED,
]

VALID_TRANSITIONS: dict[PipelineStage, list[PipelineStage]] = {
    PipelineStage.PENDING: [PipelineStage.DOWNLOADING, PipelineStage.FAILED],
    PipelineStage.DOWNLOADING: [PipelineStage.PREPROCESSING, PipelineStage.FAILED],
    PipelineStage.PREPROCESSING: [
        PipelineStage.BACKGROUND_REMOVED, PipelineStage.FAILED, PipelineStage.PARTIAL,
    ],
    PipelineStage.BACKGROUND_REMOVED: [
        PipelineStage.CLASSIFYING, PipelineStage.FAILED, PipelineStage.PARTIAL,
    ],
    PipelineStage.CLASSIFYING: [
        PipelineStage.EXTRACTING_COLORS, PipelineStage.FAILED, PipelineStage.PARTIAL,
    ],
    PipelineStage.EXTRACTING_COLORS: [
        PipelineStage.GENERATING_ASSETS, PipelineStage.FAILED, PipelineStage.PARTIAL,
    ],
    PipelineStage.GENERATING_ASSETS: [
        PipelineStage.COMPLETED, PipelineStage.PARTIAL, PipelineStage.FAILED,
    ],
    PipelineStage.COMPLETED: [],
    PipelineStage.PARTIAL: [],
    PipelineStage.FAILED: [],
}


class StageResult(BaseModel):
    name: PipelineStage
    status: str = "pending"
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_ms: Optional[float] = None
    error: Optional[str] = None


class PipelineState(BaseModel):
    pipeline_id: str = Field(default="", alias="pipelineId")
    garment_id: str = Field(default="", alias="garmentId")
    user_id: str = Field(default="", alias="userId")
    status: PipelineStage = PipelineStage.PENDING
    current_stage: Optional[PipelineStage] = None
    stages: dict[str, StageResult] = Field(default_factory=dict)
    image_url: str = Field(default="", alias="imageUrl")
    local_path: str = Field(default="", alias="localPath")
    processed_paths: dict[str, str] = Field(default_factory=dict)
    results: dict = Field(default_factory=dict)
    error: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    total_duration_ms: Optional[float] = None
    request_id: str = Field(default="", alias="requestId")

    model_config = {"populate_by_name": True}


def validate_transition(current: PipelineStage, next_stage: PipelineStage) -> bool:
    return next_stage in VALID_TRANSITIONS.get(current, [])
