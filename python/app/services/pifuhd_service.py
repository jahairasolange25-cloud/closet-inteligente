import os
import sys
import time
import shutil
import subprocess
import threading
import uuid
from pathlib import Path

import cv2
import structlog

logger = structlog.get_logger(__name__)

PIFUHD_DIR = Path(__file__).resolve().parent.parent.parent / "pifuhd"
PIFUHD_CHECKPOINT = PIFUHD_DIR / "checkpoints" / "pifuhd.pt"
PIFUHD_RESULTS_DIR = PIFUHD_DIR / "results"
_SETUP_SCRIPT = Path(__file__).resolve().parent.parent.parent / "scripts" / "setup_pifuhd.py"

_setup_lock = threading.Lock()
_setup_thread: threading.Thread | None = None
_setup_error: str | None = None


def _run_setup_background() -> None:
    global _setup_error
    try:
        logger.info("pifuhd_setup_background_start")
        subprocess.check_call([sys.executable, str(_SETUP_SCRIPT)])
        logger.info("pifuhd_setup_background_complete")
    except Exception as exc:
        _setup_error = str(exc)
        logger.error("pifuhd_setup_background_failed", error=_setup_error)


def ensure_pifuhd_ready() -> None:
    global _setup_thread, _setup_error

    needs_setup = not PIFUHD_DIR.exists() or not PIFUHD_CHECKPOINT.exists()
    if not needs_setup:
        PIFUHD_RESULTS_DIR.mkdir(parents=True, exist_ok=True)
        return

    with _setup_lock:
        # Re-check inside lock to avoid double-start
        if PIFUHD_CHECKPOINT.exists():
            PIFUHD_RESULTS_DIR.mkdir(parents=True, exist_ok=True)
            return

        if _setup_thread is None or not _setup_thread.is_alive():
            _setup_error = None
            _setup_thread = threading.Thread(target=_run_setup_background, daemon=True)
            _setup_thread.start()

    if _setup_error:
        raise RuntimeError(f"PIFuHD setup failed: {_setup_error}")

    raise RuntimeError(
        "PIFuHD checkpoint is being downloaded (~1.5 GB), service will be ready shortly. "
        "Check GET /api/v1/pifuhd/health for status."
    )


def extract_best_frame(video_path: str, output_dir: str, image_size: int = 1024) -> str:
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
        new_w, new_h = int(w * scale), int(h * scale)
        frame = cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_AREA)

    frame_id = uuid.uuid4().hex
    frame_path = os.path.join(output_dir, f"{frame_id}.png")
    cv2.imwrite(frame_path, frame, [cv2.IMWRITE_PNG_COMPRESSION, 3])
    logger.info("frame_extracted", path=frame_path, frame=target_frame, total=total_frames)
    return frame_path


def create_rect_file(image_path: str) -> str:
    img = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise RuntimeError(f"Could not read image: {image_path}")

    h, w = img.shape[:2]
    crop_size = int(min(h, w) * 0.9)
    cx, cy = w // 2, h // 2
    x1 = cx - crop_size // 2
    y1 = cy - crop_size // 2

    rect_path = os.path.splitext(image_path)[0] + "_rect.txt"
    with open(rect_path, "w") as f:
        f.write(f"{x1} {y1} {crop_size} {crop_size}")
    logger.info("rect_file_created", path=rect_path, x=x1, y=y1, size=crop_size)
    return rect_path


def run_pifuhd_inference(image_path: str, output_dir: str, resolution: int = 512) -> str:
    ensure_pifuhd_ready()

    pid = uuid.uuid4().hex
    session_dir = os.path.join(output_dir, f"session_{pid}")
    os.makedirs(session_dir, exist_ok=True)

    shutil.copy2(image_path, session_dir)
    create_rect_file(os.path.join(session_dir, os.path.basename(image_path)))

    cmd = [
        sys.executable, "-m", "apps.simple_test",
        "-i", session_dir,
        "-o", session_dir,
        "-c", str(PIFUHD_CHECKPOINT),
        "-r", str(resolution),
        "--use_rect",
    ]

    logger.info("pifuhd_inference_starting", image=image_path, resolution=resolution)
    t0 = time.monotonic()

    result = subprocess.run(
        cmd,
        cwd=str(PIFUHD_DIR),
        capture_output=True,
        text=True,
        timeout=600,
    )

    elapsed = time.monotonic() - t0

    if result.returncode != 0:
        logger.error(
            "pifuhd_inference_failed",
            returncode=result.returncode,
            stderr=result.stderr[-2000:],
            stdout=result.stdout[-2000:],
        )
        raise RuntimeError(
            f"PIFuHD inference failed (exit {result.returncode}): {result.stderr[-500:]}"
        )

    logger.info("pifuhd_inference_completed", elapsed_ms=round(elapsed * 1000))

    # PIFuHD writes to {results_path}/{opt.name}/recon/ where opt.name comes from the checkpoint.
    # Search recursively to handle any checkpoint name (including empty string).
    obj_files = sorted(
        os.path.join(root, f)
        for root, _dirs, files in os.walk(session_dir)
        for f in files
        if f.endswith(".obj")
    )
    if not obj_files:
        raise RuntimeError("PIFuHD produced no OBJ files")

    obj_path = obj_files[0]
    logger.info("mesh_generated", obj_path=obj_path)
    return obj_path


def convert_obj_to_glb(obj_path: str, output_dir: str) -> str:
    import trimesh

    mesh = trimesh.load(obj_path)
    if isinstance(mesh, trimesh.Scene):
        mesh = mesh.dump(concatenate=True)

    glb_filename = os.path.splitext(os.path.basename(obj_path))[0] + ".glb"
    glb_path = os.path.join(output_dir, glb_filename)

    mesh.export(glb_path, file_type="glb")
    logger.info("glb_converted", obj_path=obj_path, glb_path=glb_path)
    return glb_path


def generate_avatar_glb(
    video_path: str,
    output_dir: str,
    mesh_resolution: int = 512,
) -> str:
    os.makedirs(output_dir, exist_ok=True)

    frame_path = extract_best_frame(video_path, output_dir)

    obj_path = run_pifuhd_inference(frame_path, output_dir, resolution=mesh_resolution)

    glb_path = convert_obj_to_glb(obj_path, output_dir)

    try:
        os.remove(frame_path)
        rect_path = os.path.splitext(frame_path)[0] + "_rect.txt"
        if os.path.exists(rect_path):
            os.remove(rect_path)
    except OSError:
        pass

    return glb_path
