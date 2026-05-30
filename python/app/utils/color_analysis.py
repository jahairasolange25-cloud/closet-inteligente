from typing import Optional

import numpy as np
from PIL import Image


def extract_color_palette(image: Image.Image, n_colors: int = 5) -> list[dict]:
    img = image.convert("RGB").resize((150, 150))
    pixels = np.array(img).reshape(-1, 3)

    try:
        from sklearn.cluster import KMeans

        kmeans = KMeans(n_clusters=n_colors, random_state=42, n_init=5)
        kmeans.fit(pixels)
        colors = kmeans.cluster_centers_.astype(int)
        labels = kmeans.labels_
        counts = np.bincount(labels)
        percentages = counts / counts.sum()
    except ImportError:
        indices = np.linspace(0, len(pixels) - 1, n_colors, dtype=int)
        colors = pixels[indices]
        percentages = np.ones(n_colors) / n_colors

    result = []
    sorted_indices = np.argsort(percentages)[::-1]
    for idx in sorted_indices:
        rgb = colors[idx].tolist()
        hex_color = "#{:02x}{:02x}{:02x}".format(*rgb)
        result.append({
            "rgb": rgb,
            "hex": hex_color,
            "percentage": float(percentages[idx]),
        })

    return result


def cluster_color_palettes(palettes: list[list[str]], n_clusters: int = 5) -> list[dict]:
    if not palettes:
        return []

    hex_to_rgb = lambda h: (
        int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16)
    )

    features = []
    for palette in palettes:
        vec = []
        for hex_color in palette[:5]:
            r, g, b = hex_to_rgb(hex_color)
            vec.extend([r / 255.0, g / 255.0, b / 255.0])
        while len(vec) < 15:
            vec.extend([0.0, 0.0, 0.0])
        features.append(vec[:15])

    if not features:
        return []

    features = np.array(features)
    n_actual = min(n_clusters, len(features))

    try:
        from sklearn.cluster import KMeans

        kmeans = KMeans(n_clusters=n_actual, random_state=42, n_init=5)
        labels = kmeans.fit_predict(features)
        centers = kmeans.cluster_centers_
    except ImportError:
        labels = np.zeros(len(features), dtype=int)
        centers = features[:n_actual]

    clusters = []
    for i in range(n_actual):
        mask = labels == i
        count = int(mask.sum())
        if count == 0:
            continue
        center_rgb = (centers[i][:3] * 255).astype(int).tolist()
        center_hex = "#{:02x}{:02x}{:02x}".format(*center_rgb)
        clusters.append({
            "cluster_id": i,
            "count": count,
            "representative_color": center_hex,
            "garment_indices": np.where(mask)[0].tolist(),
        })

    return sorted(clusters, key=lambda c: c["count"], reverse=True)


def detect_color_imbalance(palettes: list[list[str]]) -> dict:
    if not palettes:
        return {"balanced": True, "dominant_family": None, "missing_families": []}

    color_families = {
        "red": ["#ff", "#e", "#d"],
        "blue": ["#00", "#1", "#2"],
        "green": ["#008", "#009", "#00a"],
        "neutral": ["#", "#9", "#8", "#7"],
        "black": ["#000", "#111"],
        "white": ["#fff", "#fef", "#fdf"],
    }

    counts = {family: 0 for family in color_families}
    for palette in palettes:
        for hex_color in palette[:3]:
            hex_lower = hex_color.lower()
            for family, prefixes in color_families.items():
                if any(hex_lower.startswith(p) for p in prefixes):
                    counts[family] += 1
                    break

    dominant = max(counts, key=counts.get) if any(counts.values()) else None
    missing = [f for f, c in counts.items() if c == 0]

    return {
        "balanced": len(missing) <= 2,
        "dominant_family": dominant,
        "color_counts": counts,
        "missing_families": missing,
    }
