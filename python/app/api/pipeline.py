import structlog
from fastapi import APIRouter

from ..pipeline import PipelineStage
from ..schemas import (
    FullPipelineRequest,
    FullPipelineResponse,
    PipelineStepRequest,
    PipelineStepResponse,
)
from ..services import process_full_pipeline, process_single_step

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/pipeline", tags=["pipeline"])


@router.post("/full", response_model=FullPipelineResponse)
async def run_full_pipeline_endpoint(request: FullPipelineRequest):
    result = await process_full_pipeline(
        garment_id=request.garment_id,
        image_url=request.image_url,
        user_id=request.user_id,
        request_id=request.request_id,
    )

    status_value = result.status.value
    if status_value == PipelineStage.PARTIAL.value:
        status_value = "partial"

    return FullPipelineResponse(
        pipelineId=result.pipeline_id,
        garmentId=result.garment_id,
        status=status_value,
        steps=[
            {
                "step": s.name.value if hasattr(s.name, "value") else str(s.name),
                "status": s.status,
                "started_at": s.started_at,
                "completed_at": s.completed_at,
                "error": s.error,
                "result": result.results.get(
                    s.name.value if hasattr(s.name, "value") else str(s.name)
                ),
            }
            for s in result.stages.values()
        ],
        error=result.error,
        started_at=result.started_at or result.stages.get("downloading", {}).started_at,
        completed_at=result.completed_at,
        total_processing_ms=result.total_duration_ms or 0,
    )


@router.post("/step", response_model=PipelineStepResponse)
async def run_pipeline_step_endpoint(request: PipelineStepRequest):
    result = await process_single_step(
        step=request.step,
        garment_id=request.garment_id,
        image_url=request.image_url,
        request_id=request.request_id,
    )

    return PipelineStepResponse(**result)


@router.get("/health")
async def pipeline_health():
    return {"status": "ok", "service": "pipeline"}
