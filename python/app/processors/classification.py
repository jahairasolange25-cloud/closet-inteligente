"""
Heuristic Garment Classification V1.

NO ML. Uses aspect ratio, contour analysis, and simple heuristics.

Limitations:
- Does NOT distinguish between similar categories (e.g. t-shirt vs polo)
- May misclassify folded/laid-flat garments
- Confidence drops for unusual aspect ratios
- Footwear detection is unreliable without sole/bottom view
"""


import cv2
import numpy as np
import structlog
from PIL import Image

logger = structlog.get_logger(__name__)

UPPER_BODY_RATIOS = (0.6, 1.2)
LOWER_BODY_RATIOS = (1.3, 2.5)
OUTERWEAR_RATIOS = (0.7, 1.1)
FOOTWEAR_RATIOS = (0.8, 2.0)

UPPER_BODY_THRESHOLD = 0.20
LOWER_BODY_THRESHOLD = 0.15
OUTERWEAR_THRESHOLD = 0.05
FOOTWEAR_THRESHOLD = 0.05


def classify_garment(image_path: str) -> dict:
    img = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        pil_img = Image.open(image_path)
        img = np.array(pil_img)
        if img.shape[2] == 4:
            img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGRA)
        else:
            img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)

    h, w = img.shape[:2]
    aspect_ratio = w / h if h > 0 else 1.0

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if img.shape[2] >= 3 else img

    if img.shape[2] == 4:
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
    }


def _analyze_contours(
    gray: np.ndarray, alpha: np.ndarray, w: int, h: int,
) -> tuple[float, float]:
    _, binary = cv2.threshold(gray, 1, 255, cv2.THRESH_BINARY)
    if np.any(alpha < 255):
        binary = alpha > 0
        binary = binary.astype(np.uint8) * 255

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


def _analyze_color_variance(img: np.ndarray) -> float:
    if img.shape[2] >= 3:
        hsv = cv2.cvtColor(img[:, :, :3], cv2.COLOR_BGR2HSV)
        return float(np.std(hsv[:, :, 1]) / 255.0)
    return 0.0


def _analyze_edges(gray: np.ndarray) -> float:
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
    scores = {}

    upper_ar_score = 1.0 - abs(aspect_ratio - sum(UPPER_BODY_RATIOS) / 2)
    upper_extent_score = extent if extent > 0.5 else 0
    upper_score = (
        upper_ar_score * 0.5
        + contour_ratio * 0.2
        + upper_extent_score * 0.3
    )
    scores["upper_body"] = {"score": max(0, upper_score)}

    lower_ar_score = 1.0 - min(
        1.0, abs(aspect_ratio - sum(LOWER_BODY_RATIOS) / 2) / 2.0,
    )
    lower_elongation = aspect_ratio if aspect_ratio > 1.3 else 0
    lower_score = (
        lower_ar_score * 0.4
        + lower_elongation * 0.3
        + contour_ratio * 0.3
    )
    scores["lower_body"] = {"score": max(0, lower_score)}

    outer_ar_score = 1.0 - abs(aspect_ratio - sum(OUTERWEAR_RATIOS) / 2)
    outer_edge_score = edge_density * 2 if edge_density > 0.1 else 0
    outer_score = (
        outer_ar_score * 0.3
        + outer_edge_score * 0.4
        + contour_ratio * 0.3
    )
    scores["outerwear"] = {"score": max(0, outer_score)}

    footwear_ar = min(aspect_ratio, 2.0) / 2.0
    footwear_size_score = 1.0 - min(1.0, (width * height) / (500 * 500))
    footwear_score = (
        footwear_ar * 0.3
        + footwear_size_score * 0.5
        + (1.0 - contour_ratio) * 0.2
    )
    scores["footwear"] = {"score": max(0, footwear_score)}

    return scores
