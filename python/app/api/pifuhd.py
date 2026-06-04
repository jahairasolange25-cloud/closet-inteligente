import os
import uuid

import structlog
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse

from ..core.config import settings
from ..services.pifuhd_service import generate_avatar_glb, ensure_avatar_service_ready
from ..services.body_mesh_generator import smplx_available

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/pifuhd", tags=["pifuhd"])

AVATAR_OUTPUT_DIR = os.path.join(settings.output_dir, "pifuhd")


@router.post("/generate-from-video")
async def generate_from_video(
    video: UploadFile = File(...),
    mesh_resolution: int = Form(512),
):
    if not video.content_type or not video.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="INVALID_VIDEO_TYPE")

    try:
        ensure_avatar_service_ready()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    generation_id = uuid.uuid4().hex
    work_dir = os.path.join(AVATAR_OUTPUT_DIR, generation_id)
    os.makedirs(work_dir, exist_ok=True)

    video_ext = os.path.splitext(video.filename or "video.mp4")[1] or ".mp4"
    video_path = os.path.join(work_dir, f"input{video_ext}")

    content = await video.read()
    with open(video_path, "wb") as f:
        f.write(content)

    try:
        glb_path = generate_avatar_glb(
            video_path=video_path,
            output_dir=work_dir,
            mesh_resolution=mesh_resolution,
        )
    except Exception as e:
        logger.error("avatar_generation_failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"AVATAR_GENERATION_FAILED: {e}")

    return FileResponse(
        path=glb_path,
        media_type="model/gltf-binary",
        filename=f"avatar_{generation_id}.glb",
        headers={"X-Generation-Id": generation_id},
    )


@router.get("/health")
async def pifuhd_health():
    mediapipe_ok = False
    try:
        import mediapipe  # noqa: F401, PLC0415
        mediapipe_ok = True
    except ImportError:
        pass

    smplx_model = smplx_available()
    ready = mediapipe_ok

    return {
        "status": "ok" if ready else "not_ready",
        "ready": ready,
        "backend": "mediapipe+smplx",
        "mediapipe": mediapipe_ok,
        "smplx_model": smplx_model,
        "geometric_fallback": True,
    }
