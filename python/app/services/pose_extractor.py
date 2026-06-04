import cv2
import numpy as np
import structlog

logger = structlog.get_logger(__name__)


def _extract_frames(video_path: str, num_frames: int) -> list[np.ndarray]:
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video: {video_path}")

    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total <= 0:
        cap.release()
        raise RuntimeError("Video has no readable frames")

    indices = [int(total * i / num_frames) for i in range(num_frames)]
    frames: list[np.ndarray] = []
    for idx in indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if ret:
            frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))

    cap.release()
    return frames


def extract_pose_landmarks(video_path: str, num_frames: int = 7) -> dict:
    """Extract averaged 3D landmarks from a video using MediaPipe.

    Returns a dict with keys:
        pose_world_landmarks: list[list[float]] — 33 landmarks [[x,y,z], ...]
        face_landmarks: list[list[float]] | None — 468 face mesh landmarks
        hand_landmarks_l: list[list[float]] | None — 21 left-hand landmarks
        hand_landmarks_r: list[list[float]] | None — 21 right-hand landmarks
        num_frames_detected: int
    """
    try:
        import mediapipe as mp  # noqa: PLC0415
    except ImportError as exc:
        raise RuntimeError("mediapipe is not installed") from exc

    frames = _extract_frames(video_path, num_frames)
    if not frames:
        raise RuntimeError("No frames could be extracted from video")

    mp_pose = mp.solutions.pose
    mp_face = mp.solutions.face_mesh
    mp_hands = mp.solutions.hands

    pose_world_acc: list[list[list[float]]] = []
    face_acc: list[list[list[float]]] = []
    hand_l_acc: list[list[list[float]]] = []
    hand_r_acc: list[list[list[float]]] = []

    with (
        mp_pose.Pose(
            static_image_mode=True,
            model_complexity=2,
            min_detection_confidence=0.5,
        ) as pose_det,
        mp_face.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
        ) as face_det,
        mp_hands.Hands(
            static_image_mode=True,
            max_num_hands=2,
            min_detection_confidence=0.5,
        ) as hand_det,
    ):
        for frame in frames:
            # --- Pose ---
            pr = pose_det.process(frame)
            if pr.pose_world_landmarks:
                pose_world_acc.append(
                    [[lm.x, lm.y, lm.z] for lm in pr.pose_world_landmarks.landmark]
                )

            # --- Face mesh ---
            fr = face_det.process(frame)
            if fr.multi_face_landmarks:
                face_acc.append(
                    [[lm.x, lm.y, lm.z] for lm in fr.multi_face_landmarks[0].landmark]
                )

            # --- Hands ---
            hr = hand_det.process(frame)
            if hr.multi_hand_landmarks:
                for i, hand_lm in enumerate(hr.multi_hand_landmarks):
                    label = hr.multi_handedness[i].classification[0].label
                    pts = [[lm.x, lm.y, lm.z] for lm in hand_lm.landmark]
                    if label == "Left":
                        hand_l_acc.append(pts)
                    else:
                        hand_r_acc.append(pts)

    def _avg(results: list[list[list[float]]]) -> list[list[float]] | None:
        if not results:
            return None
        return np.array(results).mean(axis=0).tolist()

    pose_lm = _avg(pose_world_acc)
    if pose_lm is None:
        raise RuntimeError(
            "MediaPipe could not detect a human pose in the video. "
            "Ensure the video shows a full-body standing person."
        )

    logger.info(
        "pose_extracted",
        frames_with_pose=len(pose_world_acc),
        frames_with_face=len(face_acc),
        frames_with_hands_l=len(hand_l_acc),
        frames_with_hands_r=len(hand_r_acc),
    )

    return {
        "pose_world_landmarks": pose_lm,
        "face_landmarks": _avg(face_acc),
        "hand_landmarks_l": _avg(hand_l_acc),
        "hand_landmarks_r": _avg(hand_r_acc),
        "num_frames_detected": len(pose_world_acc),
    }
