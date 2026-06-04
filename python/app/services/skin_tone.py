import cv2
import numpy as np
import structlog

logger = structlog.get_logger(__name__)

# MediaPipe Face Mesh indices for stable skin-tone sampling regions.
# Forehead (top-centre), left cheek, right cheek.
_FOREHEAD_IDX = [10, 338, 297, 332, 284]
_LEFT_CHEEK_IDX = [234, 93, 132, 58, 172]
_RIGHT_CHEEK_IDX = [454, 323, 361, 288, 397]

_FALLBACK_COLOR: tuple[int, int, int] = (210, 180, 140)  # neutral tan


def _sample_region(
    frame_rgb: np.ndarray,
    lm_list: list,
    indices: list[int],
    radius: int = 6,
) -> list[tuple[int, int, int]]:
    h, w = frame_rgb.shape[:2]
    colors: list[tuple[int, int, int]] = []
    for idx in indices:
        if idx >= len(lm_list):
            continue
        px = int(lm_list[idx].x * w)
        py = int(lm_list[idx].y * h)
        x1, y1 = max(0, px - radius), max(0, py - radius)
        x2, y2 = min(w, px + radius), min(h, py + radius)
        patch = frame_rgb[y1:y2, x1:x2]
        if patch.size > 0:
            mean = patch.reshape(-1, 3).mean(axis=0)
            colors.append((int(mean[0]), int(mean[1]), int(mean[2])))
    return colors


def extract_skin_color(
    video_path: str,
    num_frames: int = 5,
) -> tuple[tuple[int, int, int], float]:
    """Sample skin colour from forehead/cheek regions across multiple frames.

    Returns:
        (r, g, b) — dominant skin colour (0-255 per channel)
        confidence — 0.0–1.0; 0.0 means fallback was used
    """
    try:
        import mediapipe as mp  # noqa: PLC0415
    except ImportError:
        logger.warning("skin_color_no_mediapipe")
        return _FALLBACK_COLOR, 0.0

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        logger.warning("skin_color_video_open_failed", path=video_path)
        return _FALLBACK_COLOR, 0.0

    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total <= 0:
        cap.release()
        return _FALLBACK_COLOR, 0.0

    frame_indices = [int(total * i / num_frames) for i in range(num_frames)]
    samples: list[tuple[int, int, int]] = []

    mp_face = mp.solutions.face_mesh
    try:
        with mp_face.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            min_detection_confidence=0.5,
        ) as face:
            for fi in frame_indices:
                cap.set(cv2.CAP_PROP_POS_FRAMES, fi)
                ret, frame = cap.read()
                if not ret:
                    continue
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                result = face.process(rgb)
                if not result.multi_face_landmarks:
                    continue
                lm = result.multi_face_landmarks[0].landmark
                for region in (_FOREHEAD_IDX, _LEFT_CHEEK_IDX, _RIGHT_CHEEK_IDX):
                    samples.extend(_sample_region(rgb, lm, region))
    finally:
        cap.release()

    if not samples:
        logger.warning("skin_color_no_samples", video=video_path)
        return _FALLBACK_COLOR, 0.1

    arr = np.array(samples, dtype=float)
    color: tuple[int, int, int] = (
        int(arr[:, 0].mean()),
        int(arr[:, 1].mean()),
        int(arr[:, 2].mean()),
    )
    confidence = min(1.0, len(samples) / 40.0)
    logger.info("skin_color_extracted", color=color, samples=len(samples), confidence=round(confidence, 2))
    return color, confidence
