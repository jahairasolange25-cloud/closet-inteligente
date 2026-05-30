# AI/ML Task Template

## TASK_ID: `AI-<TASK_ID>`

> **Title**: <TITLE>
>
> **Objective**: <OBJECTIVE — one clear sentence describing the model pipeline or data task>

---

## CONTEXT FILES

```
# Example:
ai/pipelines/outfit_generator/pipeline.py
ai/pipelines/outfit_generator/config.yaml
ai/pipelines/outfit_generator/models.py
ai/pipelines/outfit_generator/schemas.py
ai/shared/image_utils.py
ai/shared/classification/labels.yaml
```

**Guidance**: Include the pipeline module, its config file, model definition/schema files, shared utility modules, and any label maps or class definitions.

---

## ALLOWED FILES

```
ai/pipelines/outfit_generator/
ai/shared/image_utils.py
```

---

## FORBIDDEN FILES

```
ai/shared/auth/
ai/training/
ai/evaluation/
Dockerfile
```

**Guidance**: Protect model training scripts, evaluation harnesses, and Docker/infra config from accidental modification.

---

## REQUIREMENTS

```
- [ ] Add a `color_compatibility` scoring step between `detect_items` and `generate_outfit`
- [ ] Score is a float 0.0–1.0 computed from a color harmony matrix (preloaded CSV)
- [ ] If score < 0.3, skip the item combination and log a warning
- [ ] Output schema includes `compatibility_score` and `incompatible_items: list[str]`
- [ ] Pipeline step must be idempotent — same input always produces same compatibility score
- [ ] Processing time per combination must be < 200ms on CPU
- [ ] Log step duration, input/output shapes, and score distribution to stdout as JSON
```

**Guidance on model pipeline steps**:
- Each pipeline step should be a standalone callable class or function with a single `process(input: StepInput) -> StepOutput` signature.
- Steps should be composed in `pipeline.py` via a list or directed graph. Steps must be independently testable.
- Config (model paths, thresholds, labels) lives in `config.yaml`, not in code.
- Use Pydantic models (`schemas.py`) for all inter-step data contracts.

**Guidance on data validation**:
- Validate inputs at the pipeline entry point with Pydantic (type checks, range checks, enum validation).
- Validate intermediate outputs after every step with `assert` or dedicated validators — fail fast.
- Image inputs: check dimensions, channels (3 or 4), dtype, file size before passing to models.
- Label outputs: verify against the known label set from `labels.yaml`. Unknown labels → log + skip.

**Guidance on error handling for AI failures**:
- Wrap each model inference call in try/except. On failure: log the error, return a partial result or sentinel, never crash the pipeline.
- If a model returns NaN/Inf, log a warning and replace with 0.0 or a configurable default.
- If the input image is corrupt (decode fails), raise a typed `ImageDecodeError` with a descriptive message — let the caller decide retry vs. skip.
- Use a circuit breaker for external model APIs (Hugging Face Inference Endpoints, etc.): after 3 consecutive failures, back off 30 seconds.
- All errors must be logged with enough context to replay the failing input.

---

## ACCEPTANCE CRITERIA

```
GIVEN a wardrobe image containing 5 items of known categories
WHEN the pipeline runs
THEN `detect_items` outputs 5 detections
AND `color_compatibility` assigns a score to each unique pair
AND `generate_outfit` outputs 1–3 outfits with `compatibility_score >= 0.3`
AND each outfit has a `compatibility_score` field

GIVEN an image with corrupt pixel data
WHEN the pipeline is invoked
THEN `ImageDecodeError` is raised with the image path in the message
AND no model inference is attempted
AND the pipeline logs "CORRUPT_IMAGE: <path>"
```

---

## EDGE CASES

```
- [ ] Image with 0 detectable items → pipeline returns empty outfits list, logs "NO_ITEMS_DETECTED"
- [ ] All item pairs have score < 0.3 → empty outfits, log "NO_COMPATIBLE_COMBINATIONS"
- [ ] Model file missing at path → `ModelLoadError` with path in message
- [ ] Image too large (> 10MB) → resize to 1024x1024 before processing, log "RESIZED: <orig> -> <new>"
- [ ] Non-RGB image (grayscale, RGBA) → convert to RGB, log "CONVERTED: <orig_channels> -> 3"
```

---

## TESTS REQUIRED

```
ai/pipelines/outfit_generator/tests/test_color_compatibility.py
  - "returns 0.0–1.0 score for all item pairs"
  - "returns 1.0 for identical colors"
  - "returns score < 0.3 for clashing colors per harmony matrix"

ai/pipelines/outfit_generator/tests/test_pipeline.py
  - "end-to-end run returns correct schema"
  - "pipeline handles 0 detections gracefully"
  - "pipeline raises ImageDecodeError on corrupt image"
  - "pipeline resizes oversized images"

ai/shared/tests/test_image_utils.py
  - "converts grayscale to RGB"
  - "resizes image while preserving aspect ratio"
```

**Guidance**: Use `pytest`. Mock model inference calls to avoid GPU dependency in CI. Use fixture images stored in `ai/test_fixtures/`.

---

## EXPECTED OUTPUT

```
FILES MODIFIED:
  - ai/pipelines/outfit_generator/pipeline.py          (+15 lines)
  - ai/pipelines/outfit_generator/config.yaml          (+5 lines)
  - ai/pipelines/outfit_generator/schemas.py           (+8 lines)

FILES CREATED:
  - ai/pipelines/outfit_generator/steps/color_compatibility.py
  - ai/pipelines/outfit_generator/tests/test_color_compatibility.py
  - ai/pipelines/outfit_generator/tests/test_pipeline.py

All tests pass: pytest ai/pipelines/outfit_generator/tests/
Lint passes: ruff check ai/
Type check passes: pyright ai/
```

---

## Example: Well-Formed AI Task

```
TASK_ID: AI-0017
TITLE: Add fabric texture detection step to outfit pipeline
OBJECTIVE: Introduce a fabric texture classification step between item detection and outfit generation to improve visual coherence.

CONTEXT FILES:
  ai/pipelines/outfit_generator/pipeline.py
  ai/pipelines/outfit_generator/config.yaml
  ai/pipelines/outfit_generator/schemas.py
  ai/pipelines/outfit_generator/steps/detect_items.py
  ai/shared/classification/labels.yaml
  ai/shared/image_utils.py

ALLOWED FILES:
  ai/pipelines/outfit_generator/
  ai/shared/

FORBIDDEN FILES:
  ai/training/
  ai/evaluation/

REQUIREMENTS:
  - [ ] Add `classify_textures` step using a pre-trained ResNet-18 (ONNX) fine-tuned on 8 fabric classes
  - [ ] Model loads from `config.yaml` path on first call, cached for subsequent calls
  - [ ] Each detected item gets a `texture: str` and `texture_confidence: float` field
  - [ ] Texture labels: denim, cotton, silk, leather, wool, polyester, linen, knit
  - [ ] If confidence < 0.5, label is "unknown"
  - [ ] Step must complete in < 100ms per item on CPU

ACCEPTANCE CRITERIA:
  GIVEN an image of a denim jacket
  WHEN `classify_textures` runs on the detected item crop
  THEN label is "denim" with confidence >= 0.7

  GIVEN a blurry low-res item crop
  WHEN the step runs
  THEN label is "unknown" with confidence < 0.5

EDGE CASES:
  - [ ] ONNX model file missing → ModelLoadError
  - [ ] Item crop is smaller than 32x32 → skip classification, set texture="unknown"
  - [ ] Model outputs NaN for all classes → texture="unknown", confidence=0.0

TESTS REQUIRED:
  ai/pipelines/outfit_generator/tests/test_texture_classifier.py
    - "classifies denim correctly"
    - "returns unknown for low-confidence predictions"
    - "caches model after first load"
    - "handles missing model file"

EXPECTED OUTPUT:
  FILES CREATED:
    - ai/pipelines/outfit_generator/steps/classify_textures.py
    - ai/pipelines/outfit_generator/tests/test_texture_classifier.py
  FILES MODIFIED:
    - ai/pipelines/outfit_generator/pipeline.py
    - ai/pipelines/outfit_generator/config.yaml
    - ai/pipelines/outfit_generator/schemas.py
  Tests pass, lint passes, typecheck passes.
```
