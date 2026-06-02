"""
Garment classification — cascade: CLIP local (Tier 1) → heuristic fallback.

CLIP (confidence > 0.85): zero cost, no API, vision-language model.
Heuristic (fallback): aspect ratio + contours — always available.
"""

import asyncio
import structlog

logger = structlog.get_logger(__name__)

UPPER_BODY_RATIOS = (0.6, 1.2)
LOWER_BODY_RATIOS = (1.3, 2.5)
OUTERWEAR_RATIOS = (0.7, 1.1)
FOOTWEAR_RATIOS = (0.8, 2.0)

# Confidence threshold for CLIP to be trusted without heuristic fallback
CLIP_CONFIDENCE_THRESHOLD = 0.50


def classify_garment(image_path: str) -> dict:
    """Synchronous entrypoint — runs async CLIP inside a new event loop if needed."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # Already inside an async context (e.g. pipeline orchestrator via asyncio.wait_for)
            # Schedule as a task — caller must await; for sync callers use run_until_complete.
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                future = pool.submit(asyncio.run, _classify_with_cascade(image_path))
                return future.result()
        else:
            return loop.run_until_complete(_classify_with_cascade(image_path))
    except RuntimeError:
        return asyncio.run(_classify_with_cascade(image_path))


async def classify_garment_async(image_path: str) -> dict:
    """Async entrypoint — preferred when called from async pipeline stages."""
    return await _classify_with_cascade(image_path)


async def _classify_with_cascade(image_path: str) -> dict:
    from PIL import Image  # lazy
    from ..services.clip_service import clip_service

    try:
        pil_image = Image.open(image_path)
    except Exception as exc:
        logger.warning("classification_image_open_failed", error=str(exc))
        return _heuristic_classify(image_path)

    # Tier 1 — CLIP local
    clip_result = await clip_service.classify(pil_image)
    if clip_result.get("available") and clip_result.get("confidence", 0) >= CLIP_CONFIDENCE_THRESHOLD:
        logger.info(
            "classification_clip",
            category=clip_result["category"],
            confidence=clip_result["confidence"],
        )
        return {
            "category": clip_result["category"],
            "subcategory": clip_result.get("subcategory"),
            "confidence": clip_result["confidence"],
            "method": "clip_local",
            "scores": clip_result.get("all_probs", {}),
            "uncertain": clip_result["confidence"] < 0.75,
        }

    # Heuristic fallback
    heuristic = _heuristic_classify(image_path)
    if clip_result.get("available"):
        # CLIP ran but confidence was low — blend category vote
        logger.info(
            "classification_clip_low_confidence_fallback",
            clip_confidence=clip_result.get("confidence"),
            heuristic_category=heuristic["category"],
        )
        # Prefer CLIP label if categories agree; otherwise keep heuristic
        if clip_result.get("category") == heuristic.get("category"):
            heuristic["confidence"] = max(
                heuristic["confidence"], clip_result.get("confidence", 0)
            )
            heuristic["subcategory"] = clip_result.get("subcategory") or heuristic.get("subcategory")
        heuristic["method"] = "clip_heuristic_blend"
    return heuristic


def _heuristic_classify(image_path: str) -> dict:
    import cv2  # lazy
    import numpy as np  # lazy
    from PIL import Image  # lazy
    img = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        pil_img = Image.open(image_path)
        img = np.array(pil_img)
        if img.ndim == 3 and img.shape[2] == 4:
            img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGRA)
        elif img.ndim == 3:
            img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)

    h, w = img.shape[:2]
    aspect_ratio = w / h if h > 0 else 1.0

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if img.ndim == 3 and img.shape[2] >= 3 else img

    if img.ndim == 3 and img.shape[2] == 4:
        alpha = img[:, :, 3]
        has_transparency = bool(np.any(alpha < 255))
    else:
        alpha = np.ones((h, w), dtype=np.uint8) * 255
        has_transparency = False

    contour_ratio, extent = _analyze_contours(gray, alpha, w, h)
    color_variance = _analyze_color_variance(img)
    edge_density = _analyze_edges(gray)

    scores = _compute_category_scores(
        aspect_ratio=aspect_ratio,
        contour_ratio=contour_ratio,
        extent=extent,
        color_variance=color_variance,
        edge_density=edge_density,
        has_transparency=has_transparency,
        height=h,
        width=w,
    )

    best_category = max(scores, key=lambda k: scores[k]["score"])
    best_score = scores[best_category]["score"]
    total = sum(s["score"] for s in scores.values())

    if total > 0:
        confidence = best_score / total
    else:
        best_category = "unknown"
        confidence = 0.0

    return {
        "category": best_category,
        "subcategory": None,
        "confidence": round(confidence, 3),
        "method": "heuristic_v1",
        "scores": {k: round(v["score"], 4) for k, v in scores.items()},
        "uncertain": confidence < 0.5,
    }


def _analyze_contours(
    gray: object, alpha: object, w: int, h: int,
) -> tuple[float, float]:
    import cv2  # lazy
    import numpy as np  # lazy
    _, binary = cv2.threshold(gray, 1, 255, cv2.THRESH_BINARY)
    if np.any(alpha < 255):
        binary = (alpha > 0).astype(np.uint8) * 255

    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return 0.0, 0.0

    largest = max(contours, key=cv2.contourArea)
    area = cv2.contourArea(largest)
    total_area = w * h
    contour_ratio = area / total_area if total_area > 0 else 0.0

    x, y, cw, ch = cv2.boundingRect(largest)
    rect_area = cw * ch
    extent = area / rect_area if rect_area > 0 else 0.0

    return contour_ratio, extent


def _analyze_color_variance(img: object) -> float:
    import cv2  # lazy
    import numpy as np  # lazy
    if img.ndim == 3 and img.shape[2] >= 3:
        hsv = cv2.cvtColor(img[:, :, :3], cv2.COLOR_BGR2HSV)
        return float(np.std(hsv[:, :, 1]) / 255.0)
    return 0.0


def _analyze_edges(gray: object) -> float:
    import cv2  # lazy
    import numpy as np  # lazy
    edges = cv2.Canny(gray, 50, 150)
    return float(np.mean(edges > 0))


def _compute_category_scores(
    aspect_ratio: float,
    contour_ratio: float,
    extent: float,
    color_variance: float,
    edge_density: float,
    has_transparency: bool,
    height: int,
    width: int,
) -> dict:
    scores: dict[str, dict] = {}

    upper_ar_score = 1.0 - abs(aspect_ratio - sum(UPPER_BODY_RATIOS) / 2)
    upper_extent_score = extent if extent > 0.5 else 0
    scores["upper_body"] = {"score": max(0, upper_ar_score * 0.5 + contour_ratio * 0.2 + upper_extent_score * 0.3)}

    lower_ar_score = 1.0 - min(1.0, abs(aspect_ratio - sum(LOWER_BODY_RATIOS) / 2) / 2.0)
    lower_elongation = aspect_ratio if aspect_ratio > 1.3 else 0
    scores["lower_body"] = {"score": max(0, lower_ar_score * 0.4 + lower_elongation * 0.3 + contour_ratio * 0.3)}

    outer_ar_score = 1.0 - abs(aspect_ratio - sum(OUTERWEAR_RATIOS) / 2)
    outer_edge_score = edge_density * 2 if edge_density > 0.1 else 0
    scores["outerwear"] = {"score": max(0, outer_ar_score * 0.3 + outer_edge_score * 0.4 + contour_ratio * 0.3)}

    footwear_ar = min(aspect_ratio, 2.0) / 2.0
    footwear_size_score = 1.0 - min(1.0, (width * height) / (500 * 500))
    scores["footwear"] = {"score": max(0, footwear_ar * 0.3 + footwear_size_score * 0.5 + (1.0 - contour_ratio) * 0.2)}

    return scores
