
import cv2
import numpy as np
import structlog
from PIL import Image

logger = structlog.get_logger(__name__)

MIN_CLUSTER_DISTANCE = 30
MAX_COLORS = 5


def _rgb_to_hex(r: int, g: int, b: int) -> str:
    return f"#{r:02x}{g:02x}{b:02x}"


def _color_distance(c1: tuple[int, int, int], c2: tuple[int, int, int]) -> float:
    return np.sqrt(sum((a - b) ** 2 for a, b in zip(c1, c2)))


def _remove_near_duplicates(
    colors: list[tuple[int, int, int]],
    min_distance: int = MIN_CLUSTER_DISTANCE,
) -> list[tuple[int, int, int]]:
    if not colors:
        return []
    filtered = [colors[0]]
    for c in colors[1:]:
        if all(_color_distance(c, f) >= min_distance for f in filtered):
            filtered.append(c)
    return filtered[:MAX_COLORS]


def extract_dominant_colors(
    image_path: str,
    n_colors: int = MAX_COLORS,
    ignore_transparent: bool = True,
) -> list[dict]:
    img = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)

    if img is None:
        pil_img = Image.open(image_path).convert("RGBA")
        img = np.array(pil_img)
        if img.shape[2] == 4:
            img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGRA)
        else:
            img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)

    if ignore_transparent and img.shape[2] == 4:
        mask = img[:, :, 3] > 0
        if mask.any():
            pixels = img[:, :, :3][mask]
        else:
            pixels = img[:, :, :3].reshape(-1, 3)
    else:
        pixels = img[:, :, :3].reshape(-1, 3)

    pixels = pixels.astype(np.float32)

    if len(pixels) < n_colors:
        n_colors = max(1, len(pixels))

    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 100, 0.2)
    _, labels, centers = cv2.kmeans(
        pixels, n_colors, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS,
    )

    unique, counts = np.unique(labels, return_counts=True)
    total = counts.sum()

    color_list: list[tuple[int, int, int]] = []
    for center in centers:
        b, g, r = int(center[0]), int(center[1]), int(center[2])
        color_list.append((r, g, b))

    color_list = _remove_near_duplicates(color_list)

    if not color_list:
        return []

    counts_by_color: dict[tuple[int, int, int], int] = {}
    for center in centers:
        b, g, r = int(center[0]), int(center[1]), int(center[2])
        counts_by_color[(r, g, b)] = counts_by_color.get((r, g, b), 0) + 1
    for i in range(n_colors):
        b, g, r = int(centers[i][0]), int(centers[i][1]), int(centers[i][2])
        counts_by_color[(r, g, b)] = counts_by_color.get((r, g, b), 0) + counts[i]

    matched = []
    assigned = set()
    for rgb in color_list:
        best_count = 0
        best_match = None
        for cr, cg, cb in counts_by_color:
            key = (cr, cg, cb)
            if key in assigned:
                continue
            if _color_distance(rgb, key) < 15:
                if counts_by_color[key] > best_count:
                    best_count = counts_by_color[key]
                    best_match = key
        if best_match:
            assigned.add(best_match)
            percentage = float(best_count / total * 100)
            matched.append({
                "hex": _rgb_to_hex(*best_match),
                "rgb": list(best_match),
                "percentage": round(percentage, 1),
            })

    matched.sort(key=lambda x: x["percentage"], reverse=True)

    return matched[:MAX_COLORS]
