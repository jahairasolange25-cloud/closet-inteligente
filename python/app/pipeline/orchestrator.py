import asyncio
import time
from datetime import datetime, timezone
from typing import Callable, Optional

import httpx
import structlog

from ..core.config import settings
from ..core.logging import bind_pipeline_context
from ..core.metrics import metrics_collector
from ..processors import (
    classify_garment,
    extract_dominant_colors,
    extract_metadata,
    generate_thumbnails,
    remove_background,
)
from ..utils.file_manager import TemporaryFileManager
from .state import (
    PipelineStage,
    PipelineState,
    StageResult,
)

logger = structlog.get_logger(__name__)

file_manager = TemporaryFileManager(settings.upload_dir)


async def run_full_pipeline(
    pipeline: PipelineState,
) -> PipelineState:
    pipeline.started_at = datetime.now(timezone.utc)
    pipeline.status = PipelineStage.DOWNLOADING
    metrics_collector.record_pipeline_start()
    bind_pipeline_context(pipeline_id=pipeline.pipeline_id, garment_id=pipeline.garment_id)

    stages = [
        (PipelineStage.DOWNLOADING, _download_image, settings.step_timeout_seconds),
        (
            PipelineStage.BACKGROUND_REMOVED,
            _process_background_removal,
            settings.step_timeout_seconds,
        ),
        (PipelineStage.CLASSIFYING, _process_classification, settings.step_timeout_seconds),
        (
            PipelineStage.EXTRACTING_COLORS,
            _process_color_extraction,
            settings.step_timeout_seconds,
        ),
        (
            PipelineStage.GENERATING_ASSETS,
            _process_thumbnail_generation,
            settings.step_timeout_seconds,
        ),
    ]

    total_start = time.monotonic()
    any_failed = False

    for stage_name, stage_fn, stage_timeout in stages:
        if await _is_cancelled(pipeline):
            pipeline.status = PipelineStage.FAILED
            pipeline.error = "Pipeline cancelled"
            logger.warning("pipeline_cancelled", pipeline_id=pipeline.pipeline_id)
            break

        stage_result = StageResult(name=stage_name)
        stage_result.started_at = datetime.now(timezone.utc)
        pipeline.current_stage = stage_result.name
        pipeline.stages[stage_name.value] = stage_result

        stage_start = time.monotonic()
        try:
            result = await _execute_with_retry(
                stage_fn=stage_fn,
                pipeline=pipeline,
                stage_name=stage_name,
                stage_result=stage_result,
                timeout=stage_timeout,
            )
            stage_result.status = "completed"
            stage_result.duration_ms = round((time.monotonic() - stage_start) * 1000, 1)
            stage_result.completed_at = datetime.now(timezone.utc)
            if result:
                pipeline.results.update(result)

            metrics_collector.record_stage(stage_name.value, stage_result.duration_ms, success=True)

            bind_pipeline_context(
                pipeline_id=pipeline.pipeline_id,
                garment_id=pipeline.garment_id,
                stage=stage_name.value,
                duration_ms=stage_result.duration_ms,
            )
            logger.info(
                "pipeline_stage_completed",
                stage=stage_name.value,
                duration_ms=stage_result.duration_ms,
            )

        except asyncio.CancelledError:
            stage_result.status = "failed"
            stage_result.duration_ms = round((time.monotonic() - stage_start) * 1000, 1)
            stage_result.completed_at = datetime.now(timezone.utc)
            stage_result.error = "Stage cancelled"
            pipeline.status = PipelineStage.FAILED
            pipeline.error = "Pipeline cancelled during stage"
            metrics_collector.record_stage(
                stage_name.value, stage_result.duration_ms, success=False,
            )
            _cleanup(pipeline)
            return pipeline

        except Exception as e:
            stage_result.status = "failed"
            stage_result.duration_ms = round((time.monotonic() - stage_start) * 1000, 1)
            stage_result.completed_at = datetime.now(timezone.utc)
            stage_result.error = str(e)
            any_failed = True

            metrics_collector.record_stage(
                stage_name.value, stage_result.duration_ms, success=False,
            )

            bind_pipeline_context(
                pipeline_id=pipeline.pipeline_id,
                garment_id=pipeline.garment_id,
                stage=stage_name.value,
                duration_ms=stage_result.duration_ms,
            )
            logger.error(
                "pipeline_stage_failed",
                stage=stage_name.value,
                error=str(e),
            )

    pipeline.total_duration_ms = round((time.monotonic() - total_start) * 1000, 1)
    completed_stages = [s for s in pipeline.stages.values() if s.status == "completed"]
    failed_stages = [s for s in pipeline.stages.values() if s.status == "failed"]

    if not any_failed:
        pipeline.status = PipelineStage.COMPLETED
        pipeline.completed_at = datetime.now(timezone.utc)
        metrics_collector.record_pipeline_completed(pipeline.total_duration_ms)
        bind_pipeline_context(
            pipeline_id=pipeline.pipeline_id, duration_ms=pipeline.total_duration_ms,
        )
        logger.info(
            "pipeline_completed",
            total_duration_ms=pipeline.total_duration_ms,
        )
    elif completed_stages and failed_stages:
        pipeline.status = PipelineStage.PARTIAL
        pipeline.completed_at = datetime.now(timezone.utc)
        metrics_collector.record_pipeline_failed(pipeline.total_duration_ms)
        bind_pipeline_context(
            pipeline_id=pipeline.pipeline_id, duration_ms=pipeline.total_duration_ms,
        )
        logger.warning(
            "pipeline_partial_completed",
            total_duration_ms=pipeline.total_duration_ms,
            failed_stages=[s for s in pipeline.stages.values() if s.status == "failed"],
        )
    else:
        pipeline.status = PipelineStage.FAILED
        pipeline.completed_at = datetime.now(timezone.utc)
        metrics_collector.record_pipeline_failed(pipeline.total_duration_ms)
        bind_pipeline_context(
            pipeline_id=pipeline.pipeline_id, duration_ms=pipeline.total_duration_ms,
        )
        logger.error(
            "pipeline_failed",
            total_duration_ms=pipeline.total_duration_ms,
            failed_stages=failed_stages,
        )

    return pipeline


async def _execute_with_retry(
    stage_fn: Callable,
    pipeline: PipelineState,
    stage_name: PipelineStage,
    stage_result: StageResult,
    timeout: float,
) -> Optional[dict]:
    last_exception: Optional[Exception] = None
    max_attempts = settings.retry_max_attempts
    base_delay = settings.retry_base_delay_ms / 1000.0

    for attempt in range(1, max_attempts + 1):
        try:
            bind_pipeline_context(
                pipeline_id=pipeline.pipeline_id,
                garment_id=pipeline.garment_id,
                stage=stage_name.value,
                attempt=attempt,
            )

            result = await asyncio.wait_for(
                stage_fn(pipeline),
                timeout=timeout,
            )
            return result

        except asyncio.TimeoutError as e:
            last_exception = e
            if attempt < max_attempts:
                logger.warning(
                    "pipeline_stage_retry",
                    stage=stage_name.value,
                    attempt=attempt,
                    reason="timeout",
                )
                delay = base_delay * (2 ** (attempt - 1))
                await asyncio.sleep(delay)
            else:
                raise

        except (httpx.RequestError, httpx.HTTPStatusError) as e:
            last_exception = e
            if attempt < max_attempts:
                logger.warning(
                    "pipeline_stage_retry",
                    stage=stage_name.value,
                    attempt=attempt,
                    reason=str(e)[:100],
                )
                delay = base_delay * (2 ** (attempt - 1))
                await asyncio.sleep(delay)
            else:
                raise

        except Exception:
            raise

    raise last_exception or RuntimeError(f"Stage {stage_name} failed after {max_attempts} attempts")


async def _is_cancelled(pipeline: PipelineState) -> bool:
    if not settings.cancellation_redis_url:
        return False
    try:
        import redis.asyncio as aioredis
        r = aioredis.from_url(settings.cancellation_redis_url)
        cancelled = await r.get(f"pipeline:cancel:{pipeline.pipeline_id}")
        await r.aclose()
        return cancelled is not None
    except Exception:
        return False


async def _download_image(pipeline: PipelineState) -> dict:
    image_url = pipeline.image_url
    local_path = file_manager.create_temp_path(prefix=f"{pipeline.garment_id}_", suffix=".png")
    pipeline.local_path = local_path

    if image_url.startswith("http://") or image_url.startswith("https://"):
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(image_url)
            response.raise_for_status()
            with open(local_path, "wb") as f:
                f.write(response.content)
    else:
        import shutil
        src = image_url
        if image_url.startswith("file://"):
            src = image_url[7:]
        shutil.copy2(src, local_path)

    return {"local_path": local_path}


async def _process_background_removal(pipeline: PipelineState) -> dict:
    from ..services.model_cache import model_cache

    no_bg_path = file_manager.create_temp_path(
        prefix=f"{pipeline.garment_id}_nobg_", suffix=".png",
    )
    t0 = time.monotonic()
    output_path, confidence = remove_background(
        pipeline.local_path, no_bg_path, model_cache_obj=model_cache,
    )
    inference_ms = round((time.monotonic() - t0) * 1000, 1)
    metrics_collector.record_model_inference(inference_ms)

    pipeline.processed_paths["no_bg"] = output_path

    return {
        "masked_image_url": output_path,
        "confidence": confidence,
    }


async def _process_classification(pipeline: PipelineState) -> dict:
    image_path = pipeline.processed_paths.get("no_bg", pipeline.local_path)
    t0 = time.monotonic()
    classification = classify_garment(image_path)
    inference_ms = round((time.monotonic() - t0) * 1000, 1)
    metrics_collector.record_model_inference(inference_ms)

    metadata = extract_metadata(image_path)

    confidence = classification.get("confidence", 0.0)
    if confidence < settings.confidence_threshold:
        classification["uncertain"] = True
        logger.info(
            "low_confidence_classification",
            category=classification.get("category"),
            confidence=confidence,
            threshold=settings.confidence_threshold,
        )
    else:
        classification["uncertain"] = False

    return {
        "classification": classification,
        "metadata": metadata,
    }


async def _process_color_extraction(pipeline: PipelineState) -> dict:
    image_path = pipeline.processed_paths.get("no_bg", pipeline.local_path)
    t0 = time.monotonic()
    colors = extract_dominant_colors(image_path)
    inference_ms = round((time.monotonic() - t0) * 1000, 1)
    metrics_collector.record_model_inference(inference_ms)

    palette = [c["hex"] for c in colors]
    return {
        "dominant_colors": colors,
        "palette_hex": palette,
    }


async def _process_thumbnail_generation(pipeline: PipelineState) -> dict:
    image_path = pipeline.processed_paths.get("no_bg", pipeline.local_path)
    thumbnails = generate_thumbnails(image_path)
    pipeline.processed_paths["thumbnail"] = thumbnails.get("thumbnail_url", "")
    pipeline.processed_paths["preview"] = thumbnails.get("preview_url", "")
    return thumbnails


def _cleanup(pipeline: PipelineState) -> None:
    paths = [pipeline.local_path] + list(pipeline.processed_paths.values())
    file_manager.cleanup(*paths)
