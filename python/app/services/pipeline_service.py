import uuid

import structlog

from ..pipeline import PipelineStage, PipelineState, run_full_pipeline

logger = structlog.get_logger(__name__)


def _map_status(stage: PipelineStage) -> str:
    mapping = {
        PipelineStage.COMPLETED: "completed",
        PipelineStage.FAILED: "failed",
        PipelineStage.PARTIAL: "partial",
    }
    return mapping.get(stage, stage.value)


async def process_full_pipeline(
    garment_id: str,
    image_url: str,
    user_id: str = "",
    request_id: str = "",
) -> PipelineState:
    pipeline_id = request_id or uuid.uuid4().hex

    pipeline = PipelineState(
        pipelineId=pipeline_id,
        garmentId=garment_id,
        userId=user_id,
        status=PipelineStage.PENDING,
        imageUrl=image_url,
        requestId=request_id,
    )

    logger.info(
        "pipeline_started",
        pipeline_id=pipeline_id,
        garment_id=garment_id,
        image_url=image_url,
    )

    result = await run_full_pipeline(pipeline)

    logger.info(
        "pipeline_finished",
        pipeline_id=pipeline_id,
        status=_map_status(result.status),
        total_duration_ms=result.total_duration_ms,
    )

    return result


async def process_single_step(
    step: str,
    garment_id: str,
    image_url: str,
    request_id: str = "",
) -> dict:
    pipeline_id = request_id or uuid.uuid4().hex

    pipeline = PipelineState(
        pipelineId=pipeline_id,
        garmentId=garment_id,
        imageUrl=image_url,
        requestId=request_id,
    )

    result = await run_full_pipeline(pipeline)

    step_result = result.results.get(step, {})

    status = _map_status(result.status)
    if status == "partial" and step_result:
        status = "completed"

    if status == "failed":
        return {
            "requestId": request_id,
            "step": step,
            "status": "failed",
            "result": None,
            "error": {
                "code": "PIPELINE_FAILED",
                "message": result.error or "Unknown error",
                "retryable": False,
            },
            "processingMs": result.total_duration_ms or 0,
        }

    return {
        "requestId": request_id,
        "step": step,
        "status": status,
        "result": step_result,
        "error": None,
        "processingMs": result.total_duration_ms or 0,
    }
