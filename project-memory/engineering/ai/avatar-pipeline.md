# Avatar Generation Pipeline

## Overview

6-step pipeline for generating 3D avatars from user body videos. Orchestrated by NestJS `AiPipelineService`, processed by Python microservices, and integrated with Ready Player Me for 3D model generation.

---

## Pipeline Architecture

```
Video Upload → [1] Validate → [2] Extract Frames → [3] Measure Body → [4] Detect Skin → [5] Integrate RPM → [6] Optimize → Complete

Queue: avatar-generation
Max 3 avatars per user, max 3 versions per avatar
```

---

## Step 1: Video Validation

**Service:** `VideoValidationService` (NestJS / Python)

### Validation Rules

| Check | Rule | Error Code |
|-------|------|------------|
| Duration | 5–30 seconds | INVALID_DURATION |
| Resolution | Min 854x480, max 3840x2160 | INVALID_RESOLUTION |
| Format | MP4 (H.264 codec) | INVALID_FORMAT |
| File size | Max 200 MB | FILE_TOO_LARGE |
| Framerate | Min 15 fps, max 60 fps | INVALID_FRAMERATE |
| Lighting | Average luminance 50–200 | POOR_LIGHTING |
| Person visible | Full body in frame | PERSON_NOT_VISIBLE |
| Pose | Standing, arms slightly away | INVALID_POSE |
| Background | Not too cluttered | CLUTTERED_BACKGROUND |

### Implementation

```python
def validate_video(video_path: str) -> VideoValidationResult:
    errors = []
    cap = cv2.VideoCapture(video_path)

    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = frame_count / fps
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    file_size = os.path.getsize(video_path)

    if duration < 5 or duration > 30:
        errors.append({"code": "INVALID_DURATION",
                       "message": f"Duration {duration:.1f}s, need 5-30s"})

    if width < 854 or height < 480:
        errors.append({"code": "INVALID_RESOLUTION",
                       "message": f"Resolution {width}x{height}, min 854x480"})

    if width > 3840 or height > 2160:
        errors.append({"code": "INVALID_RESOLUTION",
                       "message": f"Resolution {width}x{height}, max 3840x2160"})

    if file_size > 200 * 1024 * 1024:
        errors.append({"code": "FILE_TOO_LARGE",
                       "message": f"Size {file_size / 1024 / 1024:.1f}MB, max 200MB"})

    if fps < 15 or fps > 60:
        errors.append({"code": "INVALID_FRAMERATE",
                       "message": f"FPS {fps:.1f}, need 15-60"})

    # Check first frame for person
    ret, frame = cap.read()
    if ret:
        person_detected, pose_ok, lighting_ok, bg_ok = analyze_frame(frame)
        if not person_detected:
            errors.append({"code": "PERSON_NOT_VISIBLE",
                           "message": "No se detectó una persona en el video"})
        if not pose_ok:
            errors.append({"code": "INVALID_POSE",
                           "message": "La persona debe estar de pie con brazos separados"})
        if not lighting_ok:
            errors.append({"code": "POOR_LIGHTING",
                           "message": "Iluminación insuficiente o desigual"})

    cap.release()

    return VideoValidationResult(
        valid=len(errors) == 0,
        errors=errors,
        metadata={
            "duration": duration,
            "fps": fps,
            "frameCount": frame_count,
            "width": width,
            "height": height,
            "fileSize": file_size,
        } if len(errors) == 0 else None
    )

def analyze_frame(frame: np.ndarray) -> tuple:
    # Person detection
    person_detected = False
    pose_ok = False
    lighting_ok = False
    bg_ok = True

    # Use MediaPipe Pose for person + pose detection
    import mediapipe as mp
    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(static_image_mode=True, min_detection_confidence=0.5)
    results = pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))

    if results.pose_landmarks:
        person_detected = True
        # Check pose: arms slightly away from body
        left_shoulder = results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_SHOULDER]
        left_elbow = results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_ELBOW]
        left_wrist = results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_WRIST]
        if left_wrist.x < left_elbow.x - 0.1 or left_wrist.x > left_elbow.x + 0.1:
            pose_ok = True

    # Lighting check
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    mean_brightness = np.mean(gray)
    std_brightness = np.std(gray)
    if 50 <= mean_brightness <= 200 and std_brightness < 60:
        lighting_ok = True

    # Background complexity
    edges = cv2.Canny(frame, 50, 150)
    edge_ratio = np.count_nonzero(edges) / edges.size
    if edge_ratio > 0.15:
        bg_ok = False

    return person_detected, pose_ok, lighting_ok, bg_ok
```

### Output

```typescript
{
  valid: boolean;
  errors: ValidationError[];
  metadata: {
    duration: number;     // seconds
    fps: number;
    frameCount: number;
    width: number;
    height: number;
    fileSize: number;     // bytes
  } | null;
}
```

---

## Step 2: Frame Extraction (FFmpeg)

**Service:** `FrameExtractionService` (NestJS with FFmpeg)

### Process

```typescript
async function extractFrames(videoPath: string, outputDir: string): Promise<ExtractionResult> {
  const frames: string[] = [];
  const metadata = await getVideoMetadata(videoPath);

  // Extract key frames at regular intervals
  const interval = Math.max(1, Math.floor(metadata.fps / 2)); // Every ~0.5 seconds
  const maxFrames = 30;

  await new Promise<void>((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', videoPath,
      '-vf', `fps=1/${interval},scale=1080:-1`,
      '-frames:v', maxFrames.toString(),
      '-q:v', '2',           // High quality
      `${outputDir}/frame_%04d.jpg`,
      '-y',
    ]);

    ffmpeg.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}`));
    });

    ffmpeg.on('error', reject);
  });

  // Collect extracted frames
  const files = await fs.readdir(outputDir);
  files.sort().forEach((file) => {
    if (file.startsWith('frame_')) {
      frames.push(path.join(outputDir, file));
    }
  });

  return {
    frames,
    count: frames.length,
    interval,
    dimensions: { width: 1080, height: 1920 },
  };
}
```

### Output

```typescript
{
  frames: string[];       // paths to extracted JPG frames
  count: number;          // number of frames (max 30)
  interval: number;       // seconds between frames
  dimensions: { width: number; height: number };
}
```

---

## Step 3: Body Measurement Estimation (Mediapipe)

**Service:** `BodyMeasurementService` (Python with Mediapipe)

### Process

```python
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

def estimate_body_measurements(frames: list[str], height_cm: float | None = None) -> BodyMeasurementResult:
    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(
        static_image_mode=True,
        model_complexity=2,       # Highest accuracy
        min_detection_confidence=0.7,
    )

    all_landmarks = []
    best_frame = None
    best_visibility = 0

    for frame_path in frames:
        image = cv2.imread(frame_path)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = pose.process(image_rgb)

        if results.pose_landmarks:
            visibility = np.mean([lm.visibility for lm in results.pose_landmarks.landmark])
            if visibility > best_visibility:
                best_visibility = visibility
                best_frame = frame_path
                all_landmarks.append(results.pose_landmarks)

    if not all_landmarks or best_frame is None:
        return BodyMeasurementResult(
            success=False,
            error="No se pudieron detectar puntos corporales"
        )

    landmarks = all_landmarks[-1]  # Use best frame

    # Calculate pixel distances
    pixel_distances = calculate_pixel_distances(landmarks, image_width=1080)

    # Estimate height from landmarks if not provided
    if height_cm is None:
        height_cm = estimate_height_from_landmarks(landmarks, pixel_distances)
        height_source = "estimated"
    else:
        height_source = "user_input"

    # Convert pixel measurements to cm using height as reference
    height_pixels = pixel_distances['height']
    scale = height_cm / height_pixels if height_pixels > 0 else 1

    measurements = {
        'chest': pixel_distances['shoulder_width'] * scale * 1.8,  # Approximate chest circumference
        'waist': pixel_distances['waist_width'] * scale * 2.0,      # Circumference from width
        'hips': pixel_distances['hip_width'] * scale * 2.0,
        'inseam': pixel_distances['inseam'] * scale,
        'shoulder_width': pixel_distances['shoulder_width'] * scale,
        'arm_length': pixel_distances['arm_length'] * scale,
        'leg_length': pixel_distances['leg_length'] * scale,
        'torso_length': pixel_distances['torso_length'] * scale,
    }

    body_shape = classify_body_shape(measurements)

    return BodyMeasurementResult(
        success=True,
        height_cm=height_cm,
        height_source=height_source,
        measurements=measurements,
        body_shape=body_shape,
        confidence=best_visibility,
    )

def calculate_pixel_distances(landmarks, image_width: int) -> dict:
    h, w = image_width * 1.777, image_width  # approximate

    left_shoulder = landmarks.landmark[mp_pose.PoseLandmark.LEFT_SHOULDER]
    right_shoulder = landmarks.landmark[mp_pose.PoseLandmark.RIGHT_SHOULDER]
    left_hip = landmarks.landmark[mp_pose.PoseLandmark.LEFT_HIP]
    right_hip = landmarks.landmark[mp_pose.PoseLandmark.RIGHT_HIP]
    left_knee = landmarks.landmark[mp_pose.PoseLandmark.LEFT_KNEE]
    right_knee = landmarks.landmark[mp_pose.PoseLandmark.RIGHT_KNEE]
    left_ankle = landmarks.landmark[mp_pose.PoseLandmark.LEFT_ANKLE]
    right_ankle = landmarks.landmark[mp_pose.PoseLandmark.RIGHT_ANKLE]
    left_ear = landmarks.landmark[mp_pose.PoseLandmark.LEFT_EAR]
    left_foot = landmarks.landmark[mp_pose.PoseLandmark.LEFT_FOOT_INDEX]
    nose = landmarks.landmark[mp_pose.PoseLandmark.NOSE]

    def px_distance(a, b):
        return math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2) * w

    shoulder_width = px_distance(left_shoulder, right_shoulder)
    hip_width = px_distance(left_hip, right_hip)
    waist_width = abs(left_hip.x - right_hip.x) * w * 0.85

    # Height from top of head (approximated from nose + offset) to foot
    head_top_y = nose.y - (left_ear.y - nose.y) * 2
    height_pixels = (left_foot.y - head_top_y) * h

    # Inseam = hip to ankle
    left_inseam = px_distance(left_hip, left_ankle)
    right_inseam = px_distance(right_hip, right_ankle)
    inseam = (left_inseam + right_inseam) / 2

    # Arm length = shoulder to wrist
    left_wrist = landmarks.landmark[mp_pose.PoseLandmark.LEFT_WRIST]
    right_wrist = landmarks.landmark[mp_pose.PoseLandmark.RIGHT_WRIST]
    left_arm = px_distance(left_shoulder, left_wrist)
    right_arm = px_distance(right_shoulder, right_wrist)
    arm_length = (left_arm + right_arm) / 2

    # Leg length = hip to ankle (already have inseam, also calculate full)
    leg_length = px_distance(left_hip, left_foot)

    # Torso = shoulder to hip
    left_torso = px_distance(left_shoulder, left_hip)
    right_torso = px_distance(right_shoulder, right_hip)
    torso_length = (left_torso + right_torso) / 2

    return {
        'height': height_pixels,
        'shoulder_width': shoulder_width,
        'waist_width': waist_width,
        'hip_width': hip_width,
        'inseam': inseam,
        'arm_length': arm_length,
        'leg_length': leg_length,
        'torso_length': torso_length,
    }

def classify_body_shape(measurements: dict) -> str:
    ratio = measurements['shoulder_width'] / measurements['hips']
    waist_ratio = measurements['waist'] / measurements['hips']

    if ratio > 1.05 and waist_ratio < 0.85:
        return 'ectomorph'
    elif 0.95 <= ratio <= 1.05 and 0.85 <= waist_ratio <= 0.95:
        return 'mesomorph'
    else:
        return 'endomorph'
```

### Output

```typescript
{
  success: boolean;
  heightCm: number;
  heightSource: 'estimated' | 'user_input';
  measurements: {
    chest: number;            // cm
    waist: number;            // cm
    hips: number;             // cm
    inseam: number;           // cm
    shoulderWidth: number;    // cm
    armLength: number;        // cm
    legLength: number;        // cm
    torsoLength: number;      // cm
  };
  bodyShape: 'ectomorph' | 'mesomorph' | 'endomorph' | 'unknown';
  confidence: number;         // 0-1
}
```

### Error Handling
- No landmarks detected → fallback to default proportions based on height
- Partial landmarks → use available measurements, estimate rest
- Low confidence (< 0.5) → flag for manual measurement input

---

## Step 4: Skin Tone Detection

**Service:** `SkinToneDetectionService` (Python with OpenCV)

### Process

```python
def detect_skin_tone(frame_path: str) -> SkinToneResult:
    image = cv2.imread(frame_path)
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # Use MediaPipe face detection to find face region
    mp_face = mp.solutions.face_detection
    face_detection = mp_face.FaceDetection(min_detection_confidence=0.5)
    results = face_detection.process(image_rgb)

    if not results.detections:
        # Fallback: sample from center upper area
        h, w = image.shape[:2]
        face_roi = image_rgb[h//8:h//4, w//4:3*w//4]
    else:
        detection = results.detections[0]
        bbox = detection.location_data.relative_bounding_box
        x = int(bbox.xmin * image.shape[1])
        y = int(bbox.ymin * image.shape[0])
        w_box = int(bbox.width * image.shape[1])
        h_box = int(bbox.height * image.shape[0])
        face_roi = image_rgb[y:y+h_box, x:x+w_box]

    # Get average skin color (excluding eyes, mouth)
    hsv = cv2.cvtColor(face_roi, cv2.COLOR_RGB2HSV)
    skin_mask = cv2.inRange(hsv, (0, 20, 70), (20, 255, 255))
    skin_pixels = face_roi[skin_mask > 0]

    if len(skin_pixels) == 0:
        skin_pixels = face_roi.reshape(-1, 3)

    avg_color = np.mean(skin_pixels, axis=0).astype(int)
    hex_color = '#{:02x}{:02x}{:02x}'.format(*avg_color)

    # Fitzpatrick scale estimation
    fitzpatrick = estimate_fitzpatrick(avg_color)

    return SkinToneResult(
        detected=True,
        skinTone=hex_color,
        fitzpatrickScale=fitzpatrick,
        rgb=avg_color.tolist(),
    )

def estimate_fitzpatrick(rgb: np.ndarray) -> int:
    # Simple estimation based on luminance
    luminance = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]
    if luminance > 200: return 1   # Very light
    elif luminance > 170: return 2 # Light
    elif luminance > 140: return 3 # Medium light
    elif luminance > 110: return 4 # Medium
    elif luminance > 80: return 5  # Medium dark
    else: return 6                 # Dark
```

### Output

```typescript
{
  detected: boolean;
  skinTone: string;         // hex color
  fitzpatrickScale: number; // 1-6
  rgb: [number, number, number];
}
```

---

## Step 5: Ready Player Me Integration

**Service:** `RpmIntegrationService` (NestJS)

### Process

```typescript
async function generateRpmAvatar(
  measurements: BodyMeasurementResult,
  skinTone: SkinToneResult,
  gender: string | null,
): Promise<RpmResult> {
  // Step 5a: Create RPM partner API request
  const rpmPayload = {
    dataSet: {
      body: {
        proportions: {
          height: measurements.heightCm,
          chest: measurements.measurements.chest,
          waist: measurements.measurements.waist,
          hips: measurements.measurements.hips,
          inseam: measurements.measurements.inseam,
        },
        shape: measurements.bodyShape,
      },
      skin: {
        color: skinTone.skinTone,
        fitzpatrickScale: skinTone.fitzpatrickScale,
      },
      gender: gender || 'neutral',
      style: 'full_body',
    },
    quality: 'high',
    textureAtlas: '1024',
    meshLOD: 0,          // Highest detail for initial generation
  };

  // Step 5b: Call Ready Player Me API
  const response = await axios.post(
    'https://api.readyplayer.me/v1/avatars',
    rpmPayload,
    {
      headers: {
        'x-api-key': process.env.RPM_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 120000,  // 2 min for generation
    }
  );

  const { id, modelUrl, thumbnailUrl } = response.data;

  // Step 5c: Download the GLTF model
  const modelBuffer = await downloadModel(modelUrl);
  const optimizedModel = await optimizeModel(modelBuffer);

  // Step 5d: Upload to our storage
  const storageResult = await storageService.uploadFile(
    optimizedModel,
    {
      resourceType: 'model',
      folder: `users/${userId}/avatars/`,
    }
  );

  return {
    rpmId: id,
    modelUrl: storageResult.publicUrl,
    thumbnailUrl,
    fileSize: optimizedModel.length,
  };
}
```

### RPM Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| Quality | `high` | Texture resolution |
| Texture atlas | `1024` | 1024x1024 texture size |
| Mesh LOD | `0` | Highest detail for base |
| Style | `full_body` | Complete avatar |
| Outfit | `underwear` | Minimal base clothing |

### Output

```typescript
{
  rpmId: string;            // Ready Player Me avatar ID
  modelUrl: string;         // GLTF model URL in our storage
  thumbnailUrl: string;     // Thumbnail URL
  fileSize: number;         // Model file size in bytes
}
```

---

## Step 6: Model Optimization

**Service:** `ModelOptimizationService` (NestJS / Python)

### Process

```typescript
async function optimizeModel(modelBuffer: Buffer): Promise<Buffer> {
  // Step 6a: Draco compression for geometry
  const dracoCompressed = await compressWithDraco(modelBuffer, {
    quantizationBits: 14,
    compressionLevel: 7,
  });

  // Step 6b: Texture compression
  const optimized = await compressTextures(dracoCompressed, {
    format: 'webp',
    quality: 80,
    maxTextureSize: 1024,
  });

  // Step 6c: Remove unused data
  const cleaned = await cleanModel(optimized, {
    removeDuplicateVertices: true,
    mergeMeshes: true,
    removeUnusedTextures: true,
  });

  return cleaned;
}

async function generateThumbnail(modelUrl: string): Promise<string> {
  // Use Three.js headless rendering for thumbnail
  const thumbnail = await renderThumbnail(modelUrl, {
    width: 300,
    height: 400,
    background: '#ffffff',
    cameraPosition: { x: 0, y: 1.5, z: 2.5 },
  });

  const result = await storageService.uploadFile(thumbnail, {
    resourceType: 'image',
    folder: `users/${userId}/avatars/thumbnails/`,
  });

  return result.publicUrl;
}
```

### Optimization Targets

| Metric | Before | After |
|--------|--------|-------|
| File size | ~15-20 MB | < 5 MB |
| Vertices | ~50,000 | ~25,000 |
| Triangles | ~100,000 | ~50,000 |
| Textures | 2048x2048 | 1024x1024 |
| Draw calls | 10-15 | < 5 |

### Output

```typescript
{
  modelUrl: string;       // Optimized model URL
  thumbnailUrl: string;   // Thumbnail URL
  optimizationStats: {
    originalSize: number;    // bytes
    optimizedSize: number;   // bytes
    compressionRatio: number;
    originalVertices: number;
    optimizedVertices: number;
    textureCount: number;
  };
}
```

---

## Version Management

### Rules

- Max **3 avatars** per user (enforced at DB trigger + service layer)
- Max **3 versions** per avatar
- Oldest version auto-deleted when creating version 4

```typescript
async function enforceVersionLimit(avatarId: string): Promise<void> {
  const versions = await prisma.avatarVersion.findMany({
    where: { avatarId },
    orderBy: { version: 'desc' },
  });

  if (versions.length >= 3) {
    const oldest = versions[versions.length - 1];
    // Delete oldest version
    await storageService.deleteFile(oldest.modelUrl, userId, true);
    await prisma.avatarVersion.delete({ where: { id: oldest.id } });
  }
}
```

---

## Pipeline Orchestration

```typescript
async function processAvatarGeneration(
  job: Job<{ avatarId: string; videoUrl: string; height?: number; gender?: string }>
): Promise<void> {
  const { avatarId, videoUrl, height, gender } = job.data;
  let currentStep = 0;

  try {
    // Step 1: Validate video
    currentStep = 1;
    const validation = await videoValidationService.validate(videoUrl);
    if (!validation.valid) throw new Error(validation.errors[0].message);
    await updateProgress(avatarId, 10);

    // Step 2: Extract frames
    currentStep = 2;
    const frames = await frameExtractionService.extract(videoUrl);
    await updateProgress(avatarId, 25);

    // Step 3: Body measurements
    currentStep = 3;
    const measurements = await bodyMeasurementService.estimate(frames, height);
    if (!measurements.success) throw new Error(measurements.error);
    await updateProgress(avatarId, 50);

    // Step 4: Skin tone detection
    currentStep = 4;
    const skinTone = await skinToneService.detect(frames[0]);
    await updateProgress(avatarId, 60);

    // Step 5: RPM integration
    currentStep = 5;
    const rpmResult = await rpmIntegrationService.generate(
      measurements, skinTone, gender
    );
    await updateProgress(avatarId, 80);

    // Step 6: Optimize model
    currentStep = 6;
    const modelBuffer = await downloadModel(rpmResult.modelUrl);
    const optimized = await modelOptimizationService.optimize(modelBuffer);
    const thumbnail = await modelOptimizationService.generateThumbnail(rpmResult.modelUrl);
    await updateProgress(avatarId, 95);

    // Save to database
    await saveAvatarResult(avatarId, {
      modelUrl: optimized.modelUrl,
      thumbnailUrl: thumbnail,
      measurements,
      skinTone,
      rpmId: rpmResult.rpmId,
    });

    await updateProgress(avatarId, 100);
    await notifyCompletion(avatarId, 'completed');

  } catch (error) {
    await handleError(avatarId, currentStep, error);
    throw error;
  }
}
```

---

## Error Handling

| Error | Step | Action |
|-------|------|--------|
| Video validation failed | 1 | Return errors to client, no retry |
| FFmpeg extraction failed | 2 | Retry up to 2 times |
| Mediapipe inference failed | 3 | Retry up to 3 times with degraded model |
| RPM API error (4xx) | 5 | Return error, no retry |
| RPM API error (5xx) | 5 | Retry up to 3 times |
| Model optimization failed | 6 | Retry with lower quality settings |
| Storage upload failed | 5-6 | Retry up to 3 times |

### Fallback Behavior

| Scenario | Fallback |
|----------|----------|
| No body landmarks detected | Use average proportions based on height |
| Face not visible | Use average skin tone (Fitzpatrick 3) |
| RPM generation fails | Return error, prompt user to try again |
| Video quality too low | Prompt user with specific improvement tips |
| Partial measurements | Use available data + population averages |

---

## Quality Thresholds

| Metric | Good | Acceptable | Poor |
|--------|------|------------|------|
| Landmark visibility | > 0.8 | 0.5–0.8 | < 0.5 |
| Height estimation error | < 2 cm | 2–5 cm | > 5 cm |
| Skin tone confidence | > 0.9 | 0.7–0.9 | < 0.7 |
| Model file size | < 3 MB | 3–5 MB | > 5 MB |
| Generation time | < 2 min | 2–4 min | > 4 min |
