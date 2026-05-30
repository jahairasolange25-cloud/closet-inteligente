# MediaPipe Body Measurement Integration

## Overview

MediaPipe Pose and Holistic solutions provide real-time body landmark detection from video frames. This system extracts anthropometric measurements, estimates height, detects skin tone, and infers body shape for avatar generation.

---

## 1. Environment Setup

### Requirements

```bash
pip install mediapipe==0.10.7
pip install opencv-python==4.8.1.78
pip install numpy==1.24.3
pip install scipy==1.11.4
pip install scikit-learn==1.3.2
pip install fastapi==0.104.1
pip install uvicorn==0.24.0
```

### MediaPipe Model Selection

| Model | Landmarks | Use Case |
|-------|-----------|----------|
| MediaPipe Pose | 33 body landmarks | Body measurement extraction |
| MediaPipe Holistic | 33 pose + 468 face + 21 hands | Full body + skin tone + gender cues |
| MediaPipe Face Mesh | 468 face landmarks | Face shape for avatar |

**Recommendation:** Use Holistic for comprehensive capture, Pose subset for pure body measurements.

---

## 2. Body Measurement Extraction

### Landmark Reference

MediaPipe Pose provides these key landmarks (indices):

```
0: nose
11: left_shoulder
12: right_shoulder
23: left_hip
24: right_hip
25: left_knee
26: right_knee
27: left_ankle
28: right_ankle
29: left_heel
30: right_heel
31: left_foot_index
32: right_foot_index
```

### Core Measurement Engine

```python
# measurements/body_measurements.py
import mediapipe as mp
import numpy as np
import cv2
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, asdict
from scipy.spatial.distance import euclidean


@dataclass
class BodyMeasurements:
    height_cm: float
    shoulder_width_cm: float
    chest_cm: float
    waist_cm: float
    hip_cm: float
    inseam_cm: float
    arm_length_cm: float
    neck_cm: float
    bicep_cm: float
    thigh_cm: float
    calf_cm: float
    confidence: float
    errors: List[str]


class BodyMeasurementExtractor:
    """
    Extracts anthropometric body measurements from video frames
    using MediaPipe Pose landmarks.
    """
    
    def __init__(self):
        self.pose = mp.solutions.pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            smooth_landmarks=True,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5,
        )
        self.measurement_history: List[BodyMeasurements] = []
    
    def process_frame(self, frame: np.ndarray) -> Optional[Dict]:
        """
        Process a single video frame and extract landmarks.
        
        Args:
            frame: BGR numpy array from video source
            
        Returns:
            Dict with landmarks or None if not detected
        """
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.pose.process(rgb)
        
        if not results.pose_landmarks:
            return None
        
        h, w = frame.shape[:2]
        landmarks = []
        for lm in results.pose_landmarks.landmark:
            landmarks.append({
                "x": lm.x,  # normalized [0, 1]
                "y": lm.y,  # normalized [0, 1]
                "z": lm.z,  # depth
                "visibility": lm.visibility,
            })
        
        return {
            "landmarks": landmarks,
            "image_shape": (w, h),
            "pose_world_landmarks": results.pose_world_landmarks,
        }
    
    def calculate_measurements(
        self,
        landmarks: List[Dict],
        image_shape: Tuple[int, int],
        reference_height: Optional[float] = None,
    ) -> BodyMeasurements:
        """
        Calculate body measurements from detected landmarks.
        
        Uses a scaling factor derived from known reference height or
        average human proportions when video metadata available.
        """
        errors = []
        w, h = image_shape
        
        # Extract key landmark positions in pixel space
        def lm_px(idx):
            return np.array([
                landmarks[idx]["x"] * w,
                landmarks[idx]["y"] * h,
                landmarks[idx]["z"] * (w + h) / 2,  # approximate depth
            ])
        
        # Check landmark visibility
        required = [11, 12, 23, 24, 25, 26, 27, 28]
        for idx in required:
            if landmarks[idx]["visibility"] < 0.5:
                errors.append(f"Low visibility for landmark {idx}")
        
        # Pixel distances
        left_shoulder = lm_px(11)
        right_shoulder = lm_px(12)
        left_hip = lm_px(23)
        right_hip = lm_px(24)
        left_knee = lm_px(25)
        right_knee = lm_px(26)
        left_ankle = lm_px(27)
        right_ankle = lm_px(28)
        
        # Pixel-space measurements
        shoulder_width_px = euclidean(left_shoulder[:2], right_shoulder[:2])
        hip_width_px = euclidean(left_hip[:2], right_hip[:2])
        torso_height_px = euclidean(
            (left_shoulder + right_shoulder)[:2] / 2,
            (left_hip + right_hip)[:2] / 2,
        )
        leg_length_px = euclidean(
            (left_hip + right_hip)[:2] / 2,
            (left_ankle + right_ankle)[:2] / 2,
        )
        arm_length_px = euclidean(left_shoulder[:2], lm_px(15)[:2])  # left_elbow to left_wrist
        
        # Calculate scale factor
        if reference_height:
            # Known user height in cm
            pixel_height = self.estimate_pixel_height(landmarks, image_shape)
            scale = reference_height / pixel_height if pixel_height > 0 else 1.0
        else:
            # Use approximate scaling: assume average human torso:leg ratio
            scale = self._estimate_scale_from_camera(landmarks, image_shape)
        
        # Convert to cm
        shoulder_width_cm = shoulder_width_px * scale
        hip_width_cm = hip_width_px * scale
        
        # Circumference estimation (elliptical approximation)
        chest_cm = shoulder_width_cm * 1.8  # shoulder-to-chest ratio
        waist_cm = hip_width_cm * 1.5       # approximate waist from hip width
        hip_cm = hip_width_cm * 2.0         # full hip circumference
        inseam_cm = leg_length_px * scale
        arm_length_cm = arm_length_px * scale
        neck_cm = shoulder_width_cm * 0.4   # neck circumference estimate
        
        # Height estimation
        height_cm = self.estimate_height(landmarks, image_shape, scale)
        
        # Secondary measurements via proportions
        bicep_cm = arm_length_cm * 0.28     # average bicep-to-arm ratio
        thigh_cm = inseam_cm * 0.28         # average thigh-to-inseam ratio
        calf_cm = inseam_cm * 0.2           # average calf-to-inseam ratio
        
        # Confidence score (average visibility of key landmarks)
        vis_scores = [landmarks[i]["visibility"] for i in [11, 12, 23, 24, 25, 26, 27, 28]]
        confidence = np.mean(vis_scores) if vis_scores else 0.0
        
        return BodyMeasurements(
            height_cm=round(height_cm, 1),
            shoulder_width_cm=round(shoulder_width_cm, 1),
            chest_cm=round(chest_cm, 1),
            waist_cm=round(waist_cm, 1),
            hip_cm=round(hip_cm, 1),
            inseam_cm=round(inseam_cm, 1),
            arm_length_cm=round(arm_length_cm, 1),
            neck_cm=round(neck_cm, 1),
            bicep_cm=round(bicep_cm, 1),
            thigh_cm=round(thigh_cm, 1),
            calf_cm=round(calf_cm, 1),
            confidence=round(confidence, 3),
            errors=errors,
        )
    
    def estimate_pixel_height(
        self, landmarks: List[Dict], image_shape: Tuple[int, int]
    ) -> float:
        """Estimate full body height in pixels from landmarks."""
        w, h = image_shape
        # Top of head (approximate from nose landmark)
        nose = np.array([landmarks[0]["x"] * w, landmarks[0]["y"] * h])
        # Bottom of feet
        left_foot = np.array([landmarks[31]["x"] * w, landmarks[31]["y"] * h])
        right_foot = np.array([landmarks[32]["x"] * w, landmarks[32]["y"] * h])
        
        # Head top is approximately nose_y - 1.5 * (nose_to_shoulder)
        left_shoulder = np.array([landmarks[11]["x"] * w, landmarks[11]["y"] * h])
        nose_to_shoulder = euclidean(nose, left_shoulder)
        head_top_y = nose[1] - nose_to_shoulder * 0.8
        
        # Foot center
        foot_y = (left_foot[1] + right_foot[1]) / 2
        
        return foot_y - head_top_y
    
    def estimate_height(
        self,
        landmarks: List[Dict],
        image_shape: Tuple[int, int],
        scale: float,
    ) -> float:
        """Estimate total body height from landmarks."""
        pixel_height = self.estimate_pixel_height(landmarks, image_shape)
        return pixel_height * scale
    
    def _estimate_scale_from_camera(
        self, landmarks: List[Dict], image_shape: Tuple[int, int]
    ) -> float:
        """
        Derive scale factor from camera properties and human proportions.
        Uses average human torso-to-height ratio (~0.3) as reference.
        """
        # Fallback: assume average male height 175cm for rough scale
        pixel_height = self.estimate_pixel_height(landmarks, image_shape)
        if pixel_height > 0:
            return 175.0 / pixel_height
        return 1.0


class VideoMeasurementProcessor:
    """
    Processes video frames and aggregates measurements across frames
    for improved accuracy.
    """
    
    def __init__(self, extractor: BodyMeasurementExtractor):
        self.extractor = extractor
        self.frame_measurements: List[BodyMeasurements] = []
        self.frame_confidence: List[float] = []
    
    def process_video(self, video_path: str, max_frames: int = 60) -> BodyMeasurements:
        """
        Process a video file and aggregate measurements.
        Extracts every Nth frame for efficiency.
        
        Args:
            video_path: Path to video file (MP4, MOV, AVI)
            max_frames: Max frames to process
            
        Returns:
            Aggregated BodyMeasurements with best confidence
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Could not open video: {video_path}")
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        sample_interval = max(1, total_frames // max_frames)
        
        measurements = []
        frame_count = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            if frame_count % sample_interval != 0:
                frame_count += 1
                continue
            
            result = self.extractor.process_frame(frame)
            if result:
                meas = self.extractor.calculate_measurements(
                    result["landmarks"], result["image_shape"]
                )
                if meas.confidence > 0.6:
                    measurements.append(meas)
            
            frame_count += 1
        
        cap.release()
        
        if not measurements:
            raise ValueError("No valid measurements extracted from video")
        
        return self._aggregate_measurements(measurements)
    
    def process_video_stream(
        self, frames: List[np.ndarray]
    ) -> BodyMeasurements:
        """
        Process a list of video frames (e.g., from webcam capture).
        """
        measurements = []
        for frame in frames:
            result = self.extractor.process_frame(frame)
            if result:
                meas = self.extractor.calculate_measurements(
                    result["landmarks"], result["image_shape"]
                )
                if meas.confidence > 0.6:
                    measurements.append(meas)
        
        if not measurements:
            raise ValueError("No valid measurements from provided frames")
        
        return self._aggregate_measurements(measurements)
    
    def _aggregate_measurements(
        self, measurements: List[BodyMeasurements]
    ) -> BodyMeasurements:
        """
        Aggregate multiple measurements using weighted average by confidence.
        Removes outliers beyond 2 standard deviations.
        """
        if not measurements:
            return None
        
        # Extract numeric fields
        fields = [
            "height_cm", "shoulder_width_cm", "chest_cm", "waist_cm",
            "hip_cm", "inseam_cm", "arm_length_cm", "neck_cm",
            "bicep_cm", "thigh_cm", "calf_cm",
        ]
        
        # Remove outliers per field
        clean_measurements = measurements
        for field in fields:
            values = [getattr(m, field) for m in clean_measurements]
            if len(values) > 2:
                mean = np.mean(values)
                std = np.std(values)
                clean_measurements = [
                    m for m in clean_measurements
                    if abs(getattr(m, field) - mean) < 2 * std
                ]
        
        if not clean_measurements:
            clean_measurements = measurements
        
        # Weighted average by confidence
        weights = [m.confidence for m in clean_measurements]
        total_weight = sum(weights)
        if total_weight == 0:
            weights = [1.0] * len(clean_measurements)
            total_weight = len(clean_measurements)
        
        def weighted_avg(field):
            return sum(
                getattr(m, field) * w
                for m, w in zip(clean_measurements, weights)
            ) / total_weight
        
        # Collect all errors
        all_errors = []
        for m in clean_measurements:
            all_errors.extend(m.errors)
        
        return BodyMeasurements(
            height_cm=round(weighted_avg("height_cm"), 1),
            shoulder_width_cm=round(weighted_avg("shoulder_width_cm"), 1),
            chest_cm=round(weighted_avg("chest_cm"), 1),
            waist_cm=round(weighted_avg("waist_cm"), 1),
            hip_cm=round(weighted_avg("hip_cm"), 1),
            inseam_cm=round(weighted_avg("inseam_cm"), 1),
            arm_length_cm=round(weighted_avg("arm_length_cm"), 1),
            neck_cm=round(weighted_avg("neck_cm"), 1),
            bicep_cm=round(weighted_avg("bicep_cm"), 1),
            thigh_cm=round(weighted_avg("thigh_cm"), 1),
            calf_cm=round(weighted_avg("calf_cm"), 1),
            confidence=np.mean([m.confidence for m in clean_measurements]),
            errors=list(set(all_errors)),
        )
```

---

## 3. Height Estimation

```python
# measurements/height_estimation.py
import numpy as np
from typing import List, Dict, Tuple, Optional

class HeightEstimator:
    """
    Estimates user height from 2D video frames.
    
    Methods:
    1. Known reference object: If an object of known size is in frame
    2. Camera intrinsics: If camera focal length and distance known
    3. Statistical: Using average human proportions
    """
    
    def __init__(self, camera_focal_length_mm: Optional[float] = None,
                 sensor_height_mm: Optional[float] = None):
        self.focal_length_mm = camera_focal_length_mm
        self.sensor_height_mm = sensor_height_mm
    
    def from_known_object(
        self,
        landmarks: List[Dict],
        image_shape: Tuple[int, int],
        object_height_cm: float,
        object_pixel_height: float,
    ) -> float:
        """
        Estimate height using a reference object of known size in frame.
        
        Args:
            object_height_cm: Known height of reference object
            object_pixel_height: Measured pixel height of reference object
        """
        person_pixel_height = self.estimate_pixel_height_full(landmarks, image_shape)
        scale = object_height_cm / object_pixel_height
        return person_pixel_height * scale
    
    def from_camera_intrinsics(
        self,
        landmarks: List[Dict],
        image_shape: Tuple[int, int],
        distance_from_camera_cm: float,
    ) -> float:
        """
        Estimate height using camera focal length and subject distance.
        Requires camera calibration data.
        """
        if not self.focal_length_mm or not self.sensor_height_mm:
            raise ValueError("Camera calibration data required")
        
        h, w = image_shape
        pixel_height = self.estimate_pixel_height_full(landmarks, image_shape)
        
        # Convert focal length to pixels
        focal_pixels = (self.focal_length_mm / self.sensor_height_mm) * h
        
        # height_cm = (pixel_height * distance_cm) / focal_pixels
        height_cm = (pixel_height * distance_from_camera_cm) / focal_pixels
        return height_cm
    
    def from_proportions(
        self, landmarks: List[Dict], image_shape: Tuple[int, int]
    ) -> float:
        """
        Statistical height estimation using body proportions.
        Assumes average human has shoulder width ~1/4 of height.
        """
        w, h = image_shape
        
        left_shoulder = np.array([landmarks[11]["x"] * w, landmarks[11]["y"] * h])
        right_shoulder = np.array([landmarks[12]["x"] * w, landmarks[12]["y"] * h])
        shoulder_width_px = np.linalg.norm(left_shoulder - right_shoulder)
        
        # Average shoulder-to-height ratio: shoulder_width ~ 0.25 * height
        # Range: 0.22 (broad) to 0.28 (narrow)
        pixel_height = shoulder_width_px / 0.25
        return pixel_height
    
    def estimate_pixel_height_full(
        self, landmarks: List[Dict], image_shape: Tuple[int, int]
    ) -> float:
        """Full body pixel height from head top to feet bottom."""
        w, h = image_shape
        
        # Head top (estimated above nose)
        nose = np.array([landmarks[0]["x"] * w, landmarks[0]["y"] * h])
        left_shoulder = np.array([landmarks[11]["x"] * w, landmarks[11]["y"] * h])
        nose_to_shoulder = np.linalg.norm(nose - left_shoulder)
        head_top_y = nose[1] - nose_to_shoulder * 0.8
        
        # Feet bottom
        left_foot = np.array([landmarks[31]["x"] * w, landmarks[31]["y"] * h])
        right_foot = np.array([landmarks[32]["x"] * w, landmarks[32]["y"] * h])
        foot_bottom_y = max(left_foot[1], right_foot[1])
        
        return foot_bottom_y - head_top_y
```

---

## 4. Skin Tone Detection

```python
# measurements/skin_tone.py
import numpy as np
import cv2
from typing import Tuple, List, Optional
from dataclasses import dataclass
from sklearn.cluster import KMeans


@dataclass
class SkinToneResult:
    dominant_hex: str
    dominant_rgb: Tuple[int, int, int]
    undertone: str  # "warm", "cool", "neutral"
    fitzpatrick_scale: int  # 1-6
    confidence: float


class SkinToneDetector:
    """
    Detects skin tone from facial or body skin regions
    in video frames using MediaPipe Face Mesh or Pose landmarks.
    """
    
    def __init__(self):
        self.face_mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            min_detection_confidence=0.7,
        )
    
    def extract_forehead_region(
        self, image: np.ndarray, face_landmarks
    ) -> np.ndarray:
        """Extract forehead region from face mesh landmarks for skin sampling."""
        h, w = image.shape[:2]
        
        # Forehead region defined by specific face mesh indices
        # Using upper forehead area
        forehead_indices = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323]
        
        points = []
        for idx in forehead_indices:
            lm = face_landmarks.landmark[idx]
            points.append([int(lm.x * w), int(lm.y * h)])
        
        points = np.array(points, dtype=np.int32)
        mask = np.zeros((h, w), dtype=np.uint8)
        cv2.fillPoly(mask, [points], 255)
        
        return cv2.bitwise_and(image, image, mask=mask)
    
    def extract_cheek_region(
        self, image: np.ndarray, face_landmarks
    ) -> np.ndarray:
        """Extract cheek region for skin sampling."""
        h, w = image.shape[:2]
        
        # Left and right cheek indices
        cheek_indices = [50, 205, 187, 213, 216, 207, 187, 123]
        
        points = []
        for idx in cheek_indices:
            lm = face_landmarks.landmark[idx]
            points.append([int(lm.x * w), int(lm.y * h)])
        
        points = np.array(points, dtype=np.int32)
        mask = np.zeros((h, w), dtype=np.uint8)
        cv2.fillPoly(mask, [points], 255)
        
        return cv2.bitwise_and(image, image, mask=mask)
    
    def detect_skin_tone(
        self, image: np.ndarray, landmarks: List[Dict] = None
    ) -> SkinToneResult:
        """
        Detect skin tone from image.
        
        Args:
            image: BGR image
            landmarks: Optional face landmarks if pre-detected
            
        Returns:
            SkinToneResult with color analysis
        """
        rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        if landmarks is None:
            # Use full frame skin detection via color ranges
            skin_mask = self._skin_color_segmentation(rgb)
        else:
            # Use face mesh regions
            skin_mask = self._face_region_skin_mask(image)
        
        if skin_mask is None or np.sum(skin_mask) < 100:
            return SkinToneResult(
                dominant_hex="#000000",
                dominant_rgb=(0, 0, 0),
                undertone="unknown",
                fitzpatrick_scale=0,
                confidence=0.0,
            )
        
        skin_pixels = rgb[skin_mask > 0]
        
        if len(skin_pixels) < 10:
            return SkinToneResult(
                dominant_hex="#000000",
                dominant_rgb=(0, 0, 0),
                undertone="unknown",
                fitzpatrick_scale=0,
                confidence=0.0,
            )
        
        # Cluster to find dominant skin color
        kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
        kmeans.fit(skin_pixels)
        
        # Find the most representative cluster (closest to expected skin range)
        dominant_rgb = self._find_best_skin_cluster(kmeans.cluster_centers_)
        dominant_hex = "#{:02x}{:02x}{:02x}".format(
            int(dominant_rgb[0]), int(dominant_rgb[1]), int(dominant_rgb[2])
        )
        
        # Determine undertone
        undertone = self._detect_undertone(dominant_rgb)
        
        # Map to Fitzpatrick scale
        fitzpatrick = self._map_to_fitzpatrick(dominant_rgb)
        
        # Confidence based on pixel count and variance
        pixel_count = len(skin_pixels)
        variance = np.var(skin_pixels, axis=0).mean()
        confidence = min(1.0, (pixel_count / 10000) * (1.0 / (1.0 + variance / 1000)))
        
        return SkinToneResult(
            dominant_hex=dominant_hex,
            dominant_rgb=tuple(int(c) for c in dominant_rgb),
            undertone=undertone,
            fitzpatrick_scale=fitzpatrick,
            confidence=round(confidence, 3),
        )
    
    def _skin_color_segmentation(self, rgb: np.ndarray) -> np.ndarray:
        """Segment skin using color ranges in multiple color spaces."""
        # RGB ranges
        r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
        
        # HSV ranges
        hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
        h, s, v = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
        
        # YCrCb ranges (good for skin detection)
        ycrcb = cv2.cvtColor(rgb, cv2.COLOR_RGB2YCrCb)
        y, cr, cb = ycrcb[:, :, 0], ycrcb[:, :, 1], ycrcb[:, :, 2]
        
        # Skin color rules
        mask_rgb = (r > 40) & (g > 20) & (b > 10) & (r > g) & (r > b) & (abs(r.astype(int) - g.astype(int)) > 10)
        mask_hsv = (h > 0) & (h < 50) & (s > 20) & (s < 150) & (v > 50) & (v < 245)
        mask_ycrcb = (cr > 133) & (cr < 173) & (cb > 77) & (cb < 127)
        
        # Combine masks (2 out of 3)
        mask = (mask_rgb.astype(int) + mask_hsv.astype(int) + mask_ycrcb.astype(int)) >= 2
        
        return mask.astype(np.uint8) * 255
    
    def _face_region_skin_mask(self, image: np.ndarray) -> np.ndarray:
        """Extract skin from face regions (forehead + cheeks)."""
        rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb)
        
        if not results.multi_face_landmarks:
            return self._skin_color_segmentation(rgb)
        
        face_landmarks = results.multi_face_landmarks[0]
        
        forehead = self.extract_forehead_region(image, face_landmarks)
        cheek = self.extract_cheek_region(image, face_landmarks)
        
        combined = cv2.bitwise_or(forehead, cheek)
        gray = cv2.cvtColor(combined, cv2.COLOR_BGR2GRAY)
        
        return (gray > 0).astype(np.uint8) * 255
    
    def _find_best_skin_cluster(self, centers: np.ndarray) -> np.ndarray:
        """Find the cluster center most likely to be skin."""
        # Skin typically has R > G > B with R in 100-255 range
        def skin_score(rgb):
            r, g, b = rgb
            if r < 60 or r < g or r < b:
                return -1
            return r - max(g, b)  # higher = more skin-like
        
        scores = [skin_score(c) for c in centers]
        best_idx = np.argmax(scores)
        return centers[best_idx]
    
    def _detect_undertone(self, rgb: Tuple[int, int, int]) -> str:
        """Detect warm/cool/neutral undertone from skin color."""
        r, g, b = rgb
        
        # Warm: more yellow/red (higher R, lower B)
        # Cool: more blue/pink (higher B relative to G)
        if r - b > 30:
            return "warm"
        elif b - r > 15:
            return "cool"
        else:
            return "neutral"
    
    def _map_to_fitzpatrick(self, rgb: Tuple[int, int, int]) -> int:
        """Map RGB to Fitzpatrick skin type I-VI."""
        r, g, b = rgb
        brightness = (r + g + b) / 3
        
        if brightness > 220:
            return 1  # Very light / pale
        elif brightness > 190:
            return 2  # Light
        elif brightness > 160:
            return 3  # Medium light
        elif brightness > 130:
            return 4  # Medium
        elif brightness > 100:
            return 5  # Medium dark
        else:
            return 6  # Dark / very dark
```

---

## 5. Gender Inference from Body Measurements

```python
# measurements/gender_inference.py
import numpy as np
from typing import Dict, Optional
from dataclasses import dataclass

@dataclass
class GenderInferenceResult:
    predicted_gender: str  # "male", "female", "unsure"
    confidence: float
    key_ratios: Dict[str, float]


class GenderInference:
    """
    Infers gender from body measurement ratios.
    Uses population-level anthropometric differences.
    
    Note: This provides probabilistic inference based on body proportions.
    Gender presentation is personal; this is used only for avatar defaults
    and clothing size recommendations.
    """
    
    # Population statistics (from NHANES / CAESAR datasets)
    MALE_MEANS = {
        "shoulder_hip_ratio": 1.38,   # shoulders wider than hips
        "waist_hip_ratio": 0.90,      # less curvy
        "height_shoulder_ratio": 4.0,  # taller relative to shoulder width
    }
    
    FEMALE_MEANS = {
        "shoulder_hip_ratio": 1.18,   # shoulders and hips more similar
        "waist_hip_ratio": 0.78,      # more curvy
        "height_shoulder_ratio": 4.5,  # shorter relative to shoulder width
    }
    
    def infer(self, measurements) -> GenderInferenceResult:
        """Infer gender from body measurements."""
        if measurements.confidence < 0.3:
            return GenderInferenceResult(
                predicted_gender="unsure",
                confidence=0.0,
                key_ratios={},
            )
        
        # Calculate ratios
        shoulder_waist = measurements.shoulder_width_cm / max(measurements.waist_cm, 1)
        shoulder_hip = measurements.shoulder_width_cm / max(measurements.hip_cm, 1)
        waist_hip = measurements.waist_cm / max(measurements.hip_cm, 1)
        
        ratios = {
            "shoulder_waist_ratio": round(shoulder_waist, 3),
            "shoulder_hip_ratio": round(shoulder_hip, 3),
            "waist_hip_ratio": round(waist_hip, 3),
        }
        
        # Score based on deviation from population means
        male_score = 0.0
        female_score = 0.0
        
        for key, value in ratios.items():
            if key in self.FEMALE_MEANS:
                male_dev = abs(value - self.MALE_MEANS[key])
                female_dev = abs(value - self.FEMALE_MEANS[key])
                
                # Normalize: smaller deviation = higher score
                male_score += 1.0 / (1.0 + male_dev * 3)
                female_score += 1.0 / (1.0 + female_dev * 3)
        
        # Also consider absolute height
        if measurements.height_cm > 175:
            male_score += 0.5
        elif measurements.height_cm < 165:
            female_score += 0.5
        
        # Height-shoulder ratio
        hsr = measurements.height_cm / max(measurements.shoulder_width_cm, 1)
        male_dev_hsr = abs(hsr - self.MALE_MEANS["height_shoulder_ratio"])
        female_dev_hsr = abs(hsr - self.FEMALE_MEANS["height_shoulder_ratio"])
        male_score += 1.0 / (1.0 + male_dev_hsr)
        female_score += 1.0 / (1.0 + female_dev_hsr * 2)
        
        total = male_score + female_score
        if total == 0:
            return GenderInferenceResult(
                predicted_gender="unsure",
                confidence=0.0,
                key_ratios=ratios,
            )
        
        male_prob = male_score / total
        
        if male_prob > 0.6:
            gender = "male"
            confidence = (male_prob - 0.6) / 0.4
        elif female_prob := (female_score / total) > 0.6:
            gender = "female"
            confidence = (female_score / total - 0.6) / 0.4
        else:
            gender = "unsure"
            confidence = 0.0
        
        return GenderInferenceResult(
            predicted_gender=gender,
            confidence=round(min(confidence, 1.0), 3),
            key_ratios=ratios,
        )
```

---

## 6. Camera Calibration

```python
# measurements/camera_calibration.py
import cv2
import numpy as np
from typing import Tuple, Optional
from dataclasses import dataclass

@dataclass
class CameraCalibration:
    focal_length_mm: float
    sensor_width_mm: float
    sensor_height_mm: float
    fov_degrees: float
    matrix: np.ndarray
    distortion: np.ndarray


class CameraCalibrator:
    """
    Provides camera calibration for common devices.
    Calculates pixel-to-cm conversion for measurement accuracy.
    """
    
    # Common sensor sizes (diagonal in mm)
    SENSOR_SIZES = {
        "iphone_14_pro": (7.6, 5.7),    # 1/1.28" sensor
        "iphone_13": (7.6, 5.7),
        "samsung_s23": (7.6, 5.7),
        "pixel_7": (7.6, 5.7),
        "webcam_1080p": (6.4, 4.8),     # 1/2.7" sensor
        "webcam_720p": (5.6, 4.2),      # 1/3" sensor
        "dslr_fullframe": (36.0, 24.0), # 35mm full frame
        "dslr_aps_c": (23.6, 15.7),     # APS-C
    }
    
    @staticmethod
    def estimate_from_device(device_model: str, focal_length_mm: float) -> CameraCalibration:
        """Get calibration for known device."""
        if device_model not in CameraCalibrator.SENSOR_SIZES:
            raise ValueError(f"Unknown device: {device_model}")
        
        sw, sh = CameraCalibrator.SENSOR_SIZES[device_model]
        
        # Convert focal length to 35mm equivalent
        diagonal = np.sqrt(sw**2 + sh**2)
        fov = 2 * np.arctan(diagonal / (2 * focal_length_mm))
        
        # Camera matrix (approximate for 1920x1080)
        fx = focal_length_mm * 1920 / sw
        fy = focal_length_mm * 1080 / sh
        cx = 960
        cy = 540
        
        matrix = np.array([
            [fx, 0, cx],
            [0, fy, cy],
            [0, 0, 1]
        ])
        
        distortion = np.zeros((5, 1))
        
        return CameraCalibration(
            focal_length_mm=focal_length_mm,
            sensor_width_mm=sw,
            sensor_height_mm=sh,
            fov_degrees=round(np.degrees(fov), 1),
            matrix=matrix,
            distortion=distortion,
        )
    
    @staticmethod
    def calculate_scale(
        calibration: CameraCalibration,
        distance_cm: float,
        pixel_height: float,
    ) -> float:
        """
        Calculate cm/pixel scale factor for given distance.
        
        scale = distance_cm * sensor_height_mm / (focal_length_mm * image_height_px)
        """
        focal_px = calibration.focal_length_mm * 1080 / calibration.sensor_height_mm
        return distance_cm / (focal_px / pixel_height)
```

---

## 7. Video Preprocessing

```python
# preprocessing/video_preprocessor.py
import cv2
import numpy as np
from typing import List, Tuple, Optional

class VideoPreprocessor:
    """
    Preprocesses video frames for optimal landmark detection.
    Handles lighting correction, noise reduction, and frame selection.
    """
    
    def __init__(self, target_fps: int = 15, target_size: Tuple[int, int] = (640, 480)):
        self.target_fps = target_fps
        self.target_size = target_size
    
    def extract_frames(
        self, video_path: str, max_frames: int = 60
    ) -> List[np.ndarray]:
        """Extract evenly-spaced frames from video."""
        cap = cv2.VideoCapture(video_path)
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        interval = max(1, total // max_frames)
        
        frames = []
        count = 0
        while len(frames) < max_frames:
            ret = cap.grab()
            if not ret:
                break
            if count % interval == 0:
                ret, frame = cap.retrieve()
                if ret:
                    frame = self.preprocess_frame(frame)
                    frames.append(frame)
            count += 1
        
        cap.release()
        return frames
    
    def preprocess_frame(self, frame: np.ndarray) -> np.ndarray:
        """Apply preprocessing to a single frame."""
        # Resize
        frame = cv2.resize(frame, self.target_size, interpolation=cv2.INTER_AREA)
        
        # Denoise
        frame = cv2.fastNlMeansDenoisingColored(frame, None, 10, 10, 7, 21)
        
        # Lighting normalization (CLAHE on L channel)
        lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        lab = cv2.merge([l, a, b])
        frame = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
        
        return frame
    
    def select_best_frames(
        self, frames: List[np.ndarray], pose_results: List[Optional[Dict]]
    ) -> List[int]:
        """
        Select best frames based on landmark confidence and person position.
        
        Returns indices of best frames.
        """
        scored = []
        for i, (frame, result) in enumerate(zip(frames, pose_results)):
            if result is None:
                continue
            
            landmarks = result["landmarks"]
            
            # Score: average visibility of key landmarks
            vis_scores = [landmarks[j]["visibility"] for j in [11, 12, 23, 24]]
            avg_vis = np.mean(vis_scores) if vis_scores else 0
            
            # Penalize if person is too close to edges
            h, w = frame.shape[:2]
            edge_margin = 0.1
            edge_penalty = 1.0
            for idx in [11, 12, 23, 24, 27, 28]:
                lm = landmarks[idx]
                if lm["x"] < edge_margin or lm["x"] > (1 - edge_margin):
                    edge_penalty *= 0.8
                if lm["y"] < edge_margin or lm["y"] > (1 - edge_margin):
                    edge_penalty *= 0.8
            
            score = avg_vis * edge_penalty
            scored.append((i, score))
        
        # Sort by score descending, take top 10
        scored.sort(key=lambda x: x[1], reverse=True)
        return [idx for idx, _ in scored[:10]]
```

---

## 8. Measurement Accuracy Validation

```python
# validation/accuracy_validator.py
import numpy as np
from typing import List, Dict, Tuple
from measurements.body_measurements import BodyMeasurements

class MeasurementValidator:
    """
    Validates body measurements against known human proportion ranges.
    Flags outliers and provides confidence assessment.
    """
    
    # Anthropometric reference ranges (5th to 95th percentile)
    REFERENCE_RANGES = {
        "height_cm": (140.0, 210.0),
        "shoulder_width_cm": (30.0, 55.0),
        "chest_cm": (70.0, 130.0),
        "waist_cm": (55.0, 120.0),
        "hip_cm": (75.0, 130.0),
        "inseam_cm": (60.0, 95.0),
        "arm_length_cm": (45.0, 75.0),
        "neck_cm": (28.0, 50.0),
        "bicep_cm": (20.0, 45.0),
        "thigh_cm": (40.0, 75.0),
        "calf_cm": (25.0, 48.0),
    }
    
    # Proportion checks (ratio ranges)
    PROPORTION_RANGES = {
        "shoulder_hip": (0.85, 1.6),
        "height_inseam": (1.8, 2.4),
        "waist_hip": (0.65, 1.0),
    }
    
    @staticmethod
    def validate(measurements: BodyMeasurements) -> Dict:
        """
        Validate measurements against human ranges.
        
        Returns:
            Dict with flags, warnings, and overall validity
        """
        warnings = []
        errors = []
        
        for field, (min_val, max_val) in MeasurementValidator.REFERENCE_RANGES.items():
            value = getattr(measurements, field, None)
            if value is None:
                continue
            if value < min_val:
                warnings.append(f"{field} ({value}) below expected range ({min_val}-{max_val})")
            elif value > max_val:
                warnings.append(f"{field} ({value}) above expected range ({min_val}-{max_val})")
        
        # Proportion checks
        if measurements.shoulder_width_cm > 0 and measurements.hip_cm > 0:
            shoulder_hip = measurements.shoulder_width_cm / measurements.hip_cm
            if not (0.85 <= shoulder_hip <= 1.6):
                warnings.append(f"Shoulder-hip ratio ({shoulder_hip:.2f}) outside normal range")
        
        if measurements.height_cm > 0 and measurements.inseam_cm > 0:
            height_inseam = measurements.height_cm / measurements.inseam_cm
            if not (1.8 <= height_inseam <= 2.4):
                warnings.append(f"Height-inseam ratio ({height_inseam:.2f}) outside normal range")
        
        if measurements.waist_cm > 0 and measurements.hip_cm > 0:
            waist_hip = measurements.waist_cm / measurements.hip_cm
            if not (0.65 <= waist_hip <= 1.0):
                warnings.append(f"Waist-hip ratio ({waist_hip:.2f}) outside normal range")
        
        is_valid = len(errors) == 0 and len(warnings) < 4
        reliability = "high" if is_valid and measurements.confidence > 0.7 else \
                     "medium" if is_valid else "low"
        
        return {
            "is_valid": is_valid,
            "reliability": reliability,
            "errors": errors,
            "warnings": warnings,
            "warning_count": len(warnings),
        }
```

---

## 9. Error Cases & Recovery

| Error | Cause | Detection | Recovery |
|-------|-------|-----------|----------|
| Partial body visibility | User too close/off-center | Landmarks outside frame margin | Prompt user to move back |
| Poor lighting | Underexposed/overexposed frames | Mean pixel value < 50 or > 200 | Enable flash or move to better lit area |
| Motion blur | Fast movement | Frame variance > threshold | Ask user to stand still |
| No person detected | Empty frame/background | No landmarks found | Reposition camera |
| Low landmark confidence | Occlusion (clothing/hair) | Visibility < 0.5 for key landmarks | Adjust clothing/remove obstructions |
| Incorrect scale | Unknown camera distance | Measurements outside REFERENCE_RANGES | Use known reference object or manual height input |

### Error Recovery Strategy

```python
# measurements/error_recovery.py
class MeasurementErrorHandler:
    """
    Handles and recovers from common measurement errors.
    """
    
    ERROR_MESSAGES = {
        "partial_body": "Ensure your full body is visible in the frame",
        "poor_lighting": "Move to a well-lit area or enable your camera flash",
        "motion_blur": "Stand still while the scan is in progress",
        "no_person": "Position yourself in front of the camera",
        "low_confidence": "Remove bulky clothing and ensure good posture",
        "scale_error": "Enter your height manually for calibration",
    }
    
    @staticmethod
    def diagnose(landmarks: List[Dict], image: np.ndarray) -> List[str]:
        """Diagnose issues with current frame."""
        issues = []
        
        if landmarks is None:
            issues.append("no_person")
            return issues
        
        # Check partial visibility
        edge_margin = 0.05
        h, w = image.shape[:2]
        for idx in [0, 11, 12, 23, 24, 27, 28, 31, 32]:
            lm = landmarks[idx]
            x, y = lm["x"] * w, lm["y"] * h
            if x < edge_margin * w or x > (1 - edge_margin) * w:
                issues.append("partial_body")
                break
            if y < edge_margin * h or y > (1 - edge_margin) * h:
                issues.append("partial_body")
                break
        
        # Check lighting
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        mean_brightness = np.mean(gray)
        if mean_brightness < 50 or mean_brightness > 200:
            issues.append("poor_lighting")
        
        # Check motion blur
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        if laplacian_var < 100:
            issues.append("motion_blur")
        
        # Check confidence
        vis_values = [landmarks[i]["visibility"] for i in [11, 12, 23, 24]]
        if np.mean(vis_values) < 0.5:
            issues.append("low_confidence")
        
        return issues
```

---

## 10. Integration with Avatar Generation Pipeline

```python
# integration/avatar_pipeline.py
from measurements.body_measurements import (
    VideoMeasurementProcessor, BodyMeasurementExtractor
)
from measurements.skin_tone import SkinToneDetector
from measurements.gender_inference import GenderInference
from measurements.vision_preprocessor import VideoPreprocessor
from validation.accuracy_validator import MeasurementValidator


class AvatarMeasurementPipeline:
    """
    Full pipeline from video input to avatar-ready measurements.
    
    Flow:
    1. Receive video file from user upload/webcam capture
    2. Extract and preprocess frames
    3. Detect pose landmarks per frame
    4. Calculate body measurements with multi-frame aggregation
    5. Detect skin tone from facial regions
    6. Infer gender from body proportions
    7. Validate measurement accuracy
    8. Return structured data for avatar generation
    """
    
    def __init__(self):
        self.extractor = BodyMeasurementExtractor()
        self.processor = VideoMeasurementProcessor(self.extractor)
        self.preprocessor = VideoPreprocessor()
        self.skin_detector = SkinToneDetector()
        self.gender_inference = GenderInference()
        self.validator = MeasurementValidator()
    
    async def process_video(self, video_path: str) -> dict:
        """Process video file and return complete measurement profile."""
        # Extract best frames
        frames = self.preprocessor.extract_frames(video_path, max_frames=30)
        
        if len(frames) < 3:
            raise ValueError("Video too short or unreadable")
        
        # Process frames for landmarks
        processed_frames = []
        pose_results = []
        for frame in frames:
            result = self.extractor.process_frame(frame)
            if result:
                processed_frames.append(frame)
                pose_results.append(result)
        
        if len(pose_results) < 3:
            raise ValueError("Could not detect body in video frames")
        
        # Select best frames
        best_indices = self.preprocessor.select_best_frames(processed_frames, pose_results)
        
        # Calculate measurements from best frames
        measurements_list = []
        for idx in best_indices:
            result = pose_results[idx]
            meas = self.extractor.calculate_measurements(
                result["landmarks"], result["image_shape"]
            )
            measurements_list.append(meas)
        
        # Aggregate measurements
        final_measurements = self.processor._aggregate_measurements(measurements_list)
        
        # Validate
        validation = self.validator.validate(final_measurements)
        
        # Detect skin tone (from first best frame)
        skin_tone = None
        if best_indices:
            frame = processed_frames[best_indices[0]]
            result = pose_results[best_indices[0]]
            skin_tone = self.skin_detector.detect_skin_tone(frame, result["landmarks"])
        
        # Infer gender
        gender_result = self.gender_inference.infer(final_measurements)
        
        return {
            "measurements": {
                "height_cm": final_measurements.height_cm,
                "shoulder_width_cm": final_measurements.shoulder_width_cm,
                "chest_cm": final_measurements.chest_cm,
                "waist_cm": final_measurements.waist_cm,
                "hip_cm": final_measurements.hip_cm,
                "inseam_cm": final_measurements.inseam_cm,
                "arm_length_cm": final_measurements.arm_length_cm,
                "neck_cm": final_measurements.neck_cm,
                "bicep_cm": final_measurements.bicep_cm,
                "thigh_cm": final_measurements.thigh_cm,
                "calf_cm": final_measurements.calf_cm,
            },
            "skin_tone": {
                "hex": skin_tone.dominant_hex if skin_tone else None,
                "fitzpatrick": skin_tone.fitzpatrick_scale if skin_tone else None,
                "undertone": skin_tone.undertone if skin_tone else None,
            },
            "gender_inference": {
                "predicted": gender_result.predicted_gender,
                "confidence": gender_result.confidence,
            },
            "validation": validation,
            "confidence": final_measurements.confidence,
        }
```

---

## 11. REST API

```python
# api/measurements.py
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
import aiofiles
import tempfile
import os

app = FastAPI()
pipeline = AvatarMeasurementPipeline()

@app.post("/api/v1/measurements/from-video")
async def create_measurements_from_video(
    file: UploadFile = File(...),
    reference_height: float = Form(None),
):
    """Extract body measurements from uploaded video."""
    if not file.content_type.startswith("video/"):
        return JSONResponse(
            status_code=400,
            content={"error": "File must be a video"},
        )
    
    # Save to temp file
    suffix = os.path.splitext(file.filename)[1] or ".mp4"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        result = await pipeline.process_video(tmp_path)
        return result
    except ValueError as e:
        return JSONResponse(
            status_code=400,
            content={"error": str(e)},
        )
    finally:
        os.unlink(tmp_path)

@app.post("/api/v1/measurements/from-frames")
async def create_measurements_from_frames(files: list[UploadFile] = File(...)):
    """Extract body measurements from uploaded image frames."""
    import cv2
    import numpy as np
    
    frames = []
    for f in files:
        content = await f.read()
        nparr = np.frombuffer(content, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is not None:
            frames.append(frame)
    
    if len(frames) < 3:
        return JSONResponse(
            status_code=400,
            content={"error": "Need at least 3 frames"},
        )
    
    measurements_list = []
    for frame in frames:
        result = pipeline.extractor.process_frame(frame)
        if result:
            meas = pipeline.extractor.calculate_measurements(
                result["landmarks"], result["image_shape"]
            )
            measurements_list.append(meas)
    
    if not measurements_list:
        return JSONResponse(
            status_code=400,
            content={"error": "No body detected in frames"},
        )
    
    final = pipeline.processor._aggregate_measurements(measurements_list)
    validation = pipeline.validator.validate(final)
    
    return {
        "measurements": final.__dict__,
        "validation": validation,
    }
```
