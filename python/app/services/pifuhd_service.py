import os
import uuid
from pathlib import Path

import cv2
import structlog

from .pose_extractor import extract_pose_landmarks
from .skin_tone import extract_skin_color
from .body_mesh_generator import generate_body_mesh, smplx_available

logger = structlog.get_logger(__name__)


def ensure_avatar_service_ready() -> None:
    """Raise RuntimeError if the minimum requirements are not met."""
    try:
        import mediapipe  # noqa: F401, PLC0415
    except ImportError:
        raise RuntimeError(
            "mediapipe is not installed. Cannot generate avatar. "
            "Ensure the service was deployed with the [ml] extras."
        )


def extract_best_frame(video_path: str, output_dir: str, image_size: int = 1024) -> str:
    """Extract the middle frame of a video, resized to *image_size* on the longest edge."""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video: {video_path}")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_frames <= 0:
        cap.release()
        raise RuntimeError("Video has no frames")

    target_frame = total_frames // 2
    cap.set(cv2.CAP_PROP_POS_FRAMES, target_frame)
    ret, frame = cap.read()
    cap.release()

    if not ret:
        raise RuntimeError("Could not read frame from video")

    h, w = frame.shape[:2]
    scale = image_size / max(h, w)
    if scale < 1.0:
        frame = cv2.resize(frame, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)

    frame_id = uuid.uuid4().hex
    frame_path = os.path.join(output_dir, f"{frame_id}.png")
    cv2.imwrite(frame_path, frame, [cv2.IMWRITE_PNG_COMPRESSION, 3])
    logger.info("frame_extracted", path=frame_path, frame=target_frame, total=total_frames)
    return frame_path


def generate_avatar_glb(
    video_path: str,
    output_dir: str,
    mesh_resolution: int = 512,  # kept for API compatibility; not used
) -> str:
    """Generate a GLB avatar from a video file.

    Pipeline:
      1. Extract pose landmarks via MediaPipe.
      2. Extract skin colour via MediaPipe Face Mesh.
      3. Build a body mesh (SMPL-X if model is available, geometric fallback otherwise).
      4. Export as GLB and return the file path.
    """
    os.makedirs(output_dir, exist_ok=True)

    logger.info("avatar_generation_start", video=video_path)

    # Step 1 — Pose
    pose_data = extract_pose_landmarks(video_path)
    logger.info(
        "pose_extracted",
        frames_detected=pose_data["num_frames_detected"],
        has_face=pose_data["face_landmarks"] is not None,
    )

    # Step 2 — Skin colour
    skin_color, skin_confidence = extract_skin_color(video_path)
    logger.info("skin_color_done", color=skin_color, confidence=round(skin_confidence, 2))

    # Step 3 — Body mesh
    mesh = generate_body_mesh(
        pose_data=pose_data,
        skin_color=skin_color,
        height_cm=170.0,  # default height; can be passed in future iterations
    )

    # Step 4 — Export GLB
    glb_id = uuid.uuid4().hex
    glb_path = os.path.join(output_dir, f"{glb_id}.glb")
    mesh.export(glb_path, file_type="glb")

    size_kb = Path(glb_path).stat().st_size // 1024
    logger.info(
        "avatar_generation_complete",
        glb_path=glb_path,
        size_kb=size_kb,
        smplx=smplx_available(),
    )
    return glb_path
