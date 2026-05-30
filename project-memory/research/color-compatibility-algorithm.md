# Color Compatibility Algorithm

## Overview

The color compatibility algorithm provides intelligent outfit recommendations based on color theory, garment color extraction, and seasonal appropriateness. This powers the outfit suggestion engine and the "What to Wear" feature.

---

## 1. Color Space Fundamentals

### Color Space Conversions

```python
# color/color_spaces.py
import numpy as np
from typing import Tuple

class ColorSpace:
    @staticmethod
    def rgb_to_hsl(r: float, g: float, b: float) -> Tuple[float, float, float]:
        """Convert RGB [0,255] to HSL [0,360], [0,100], [0,100]."""
        r, g, b = r / 255.0, g / 255.0, b / 255.0
        max_c, min_c = max(r, g, b), min(r, g, b)
        delta = max_c - min_c

        # Lightness
        l = (max_c + min_c) / 2.0

        # Saturation
        if delta == 0:
            s = 0.0
        else:
            s = delta / (1.0 - abs(2.0 * l - 1.0))

        # Hue
        if delta == 0:
            h = 0.0
        elif max_c == r:
            h = 60.0 * (((g - b) / delta) % 6.0)
        elif max_c == g:
            h = 60.0 * (((b - r) / delta) + 2.0)
        else:
            h = 60.0 * (((r - g) / delta) + 4.0)

        return (h % 360, s * 100.0, l * 100.0)

    @staticmethod
    def hsl_to_rgb(h: float, s: float, l: float) -> Tuple[int, int, int]:
        """Convert HSL [0,360], [0,100], [0,100] to RGB [0,255]."""
        h, s, l = h / 360.0, s / 100.0, l / 100.0

        if s == 0.0:
            r = g = b = l * 255.0
            return (int(r), int(g), int(b))

        def hue_to_rgb(p, q, t):
            if t < 0.0: t += 1.0
            if t > 1.0: t -= 1.0
            if t < 1.0 / 6.0: return p + (q - p) * 6.0 * t
            if t < 1.0 / 2.0: return q
            if t < 2.0 / 3.0: return p + (q - p) * (2.0 / 3.0 - t) * 6.0
            return p

        q = l * (1.0 + s) if l < 0.5 else l + s - l * s
        p = 2.0 * l - q

        r = hue_to_rgb(p, q, h + 1.0 / 3.0) * 255.0
        g = hue_to_rgb(p, q, h) * 255.0
        b = hue_to_rgb(p, q, h - 1.0 / 3.0) * 255.0

        return (int(r), int(g), int(b))

    @staticmethod
    def rgb_to_lab(r: float, g: float, b: float) -> Tuple[float, float, float]:
        """
        Convert RGB to CIELAB color space.
        Uses D65 illuminant reference white point.
        """
        # sRGB to XYZ (D65)
        def srgb_to_linear(c):
            c = c / 255.0
            return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

        r_lin, g_lin, b_lin = srgb_to_linear(r), srgb_to_linear(g), srgb_to_linear(b)

        x = r_lin * 0.4124564 + g_lin * 0.3575761 + b_lin * 0.1804375
        y = r_lin * 0.2126729 + g_lin * 0.7151522 + b_lin * 0.0721750
        z = r_lin * 0.0193339 + g_lin * 0.1191920 + b_lin * 0.9503041

        # XYZ to LAB (D65 white point: 0.95047, 1.0, 1.08883)
        x /= 0.95047
        y /= 1.0
        z /= 1.08883

        def lab_f(t):
            delta = 6.0 / 29.0
            return t ** (1.0 / 3.0) if t > delta ** 3 else t / (3.0 * delta ** 2) + 4.0 / 29.0

        fx, fy, fz = lab_f(x), lab_f(y), lab_f(z)

        l_star = 116.0 * fy - 16.0
        a_star = 500.0 * (fx - fy)
        b_star = 200.0 * (fy - fz)

        return (l_star, a_star, b_star)
```

---

## 2. Color Harmony Rules

```python
# color/harmony_rules.py
from typing import List, Tuple

class ColorHarmony:
    """
    Implements color wheel harmony rules for outfit recommendations.
    All operations work in HSL space for intuitive hue manipulation.
    """

    @staticmethod
    def complementary(hue: float) -> float:
        """180 degrees apart on color wheel."""
        return (hue + 180.0) % 360.0

    @staticmethod
    def split_complementary(hue: float) -> Tuple[float, float]:
        """Base hue + two colors adjacent to its complement."""
        complement = (hue + 180.0) % 360.0
        return ((complement - 30.0) % 360.0, (complement + 30.0) % 360.0)

    @staticmethod
    def analogous(hue: float, count: int = 3, step: float = 30.0) -> List[float]:
        """Adjacent colors on the wheel."""
        return [((hue + (i - count // 2) * step) % 360.0) for i in range(count)]

    @staticmethod
    def triadic(hue: float) -> Tuple[float, float]:
        """Three colors evenly spaced (120 degrees apart)."""
        return ((hue + 120.0) % 360.0, (hue + 240.0) % 360.0)

    @staticmethod
    def tetradic(hue: float) -> Tuple[float, float, float]:
        """Four colors in a rectangle (two complementary pairs)."""
        return (
            (hue + 60.0) % 360.0,
            (hue + 180.0) % 360.0,
            (hue + 240.0) % 360.0,
        )

    @staticmethod
    def square(hue: float) -> Tuple[float, float, float]:
        """Four colors evenly spaced (90 degrees apart)."""
        return (
            (hue + 90.0) % 360.0,
            (hue + 180.0) % 360.0,
            (hue + 270.0) % 360.0,
        )

    @staticmethod
    def monochromatic(hue: float, saturation: float, lightness: float,
                      count: int = 3) -> List[Tuple[float, float, float]]:
        """Same hue, varying saturation and lightness."""
        colors = []
        for i in range(count):
            factor = (i + 1) / (count + 1)
            new_l = max(10, min(90, lightness + (factor - 0.5) * 40))
            new_s = max(10, min(100, saturation + (factor - 0.5) * 30))
            colors.append((hue, new_s, new_l))
        return colors

    @staticmethod
    def neutral_anchors() -> List[Tuple[float, float, float]]:
        """Core neutral colors (black, white, gray, navy, beige)."""
        return [
            (0, 0, 0),      # black
            (0, 0, 100),    # white
            (0, 0, 50),     # gray
            (220, 50, 25),  # navy
            (30, 20, 75),   # beige
            (0, 0, 80),     # light gray
            (30, 30, 40),   # brown
        ]

    @staticmethod
    def get_harmony_name(method: str) -> str:
        names = {
            'complementary': 'Complementary',
            'split_complementary': 'Split Complementary',
            'analogous': 'Analogous',
            'triadic': 'Triadic',
            'tetradic': 'Tetradic (Rectangle)',
            'square': 'Square',
            'monochromatic': 'Monochromatic',
        }
        return names.get(method, method)
```

---

## 3. Color Distance Calculation

```python
# color/distance.py
import numpy as np
from typing import Tuple

class ColorDistance:
    """
    Implements CIE color difference formulas for accurate
    perceptual color distance measurement.
    """

    @staticmethod
    def cie76(lab1: Tuple[float, float, float],
              lab2: Tuple[float, float, float]) -> float:
        """
        CIE76: Delta E 1976.
        Simple Euclidean distance in LAB space.
        Thresholds: <1 imperceptible, 1-2 very small, 2-10 noticeable, >10 different.
        """
        l1, a1, b1 = lab1
        l2, a2, b2 = lab2
        return np.sqrt((l2 - l1) ** 2 + (a2 - a1) ** 2 + (b2 - b1) ** 2)

    @staticmethod
    def cie94(lab1: Tuple[float, float, float],
              lab2: Tuple[float, float, float],
              application: str = 'graphic_arts') -> float:
        """
        CIE94: Delta E 1994.
        Improves on CIE76 with weighting functions for lightness and chroma.
        
        Applications:
        - 'graphic_arts': kL=1, K1=0.045, K2=0.015
        - 'textiles': kL=2, K1=0.048, K2=0.014
        """
        l1, a1, b1 = lab1
        l2, a2, b2 = lab2

        kL, K1, K2 = {
            'graphic_arts': (1.0, 0.045, 0.015),
            'textiles': (2.0, 0.048, 0.014),
        }[application]

        delta_l = l1 - l2
        c1 = np.sqrt(a1 ** 2 + b1 ** 2)
        c2 = np.sqrt(a2 ** 2 + b2 ** 2)
        delta_c = c1 - c2
        delta_a = a1 - a2
        delta_b = b1 - b2
        delta_h_sq = delta_a ** 2 + delta_b ** 2 - delta_c ** 2
        delta_h = np.sqrt(max(delta_h_sq, 0))

        sl = 1.0
        sc = 1.0 + K1 * c1
        sh = 1.0 + K2 * c1

        return np.sqrt(
            (delta_l / (kL * sl)) ** 2 +
            (delta_c / sc) ** 2 +
            (delta_h / sh) ** 2
        )

    @staticmethod
    def ciede2000(lab1: Tuple[float, float, float],
                  lab2: Tuple[float, float, float]) -> float:
        """
        CIEDE2000: The most advanced CIE color difference formula.
        Most accurate for perceptual color difference.
        """
        l1, a1, b1 = lab1
        l2, a2, b2 = lab2

        # Chroma
        c1 = np.sqrt(a1 ** 2 + b1 ** 2)
        c2 = np.sqrt(a2 ** 2 + b2 ** 2)
        c_avg = (c1 + c2) / 2.0

        # G factor
        g = 0.5 * (1.0 - np.sqrt(c_avg ** 7 / (c_avg ** 7 + 25 ** 7)))

        a1_prime = a1 * (1.0 + g)
        a2_prime = a2 * (1.0 + g)

        c1_prime = np.sqrt(a1_prime ** 2 + b1 ** 2)
        c2_prime = np.sqrt(a2_prime ** 2 + b2 ** 2)

        # Hue angle
        def hue_angle(a, b):
            if a == 0 and b == 0:
                return 0.0
            h = np.degrees(np.arctan2(b, a))
            return h % 360.0

        h1_prime = hue_angle(a1_prime, b1)
        h2_prime = hue_angle(a2_prime, b2)

        delta_h_prime = h2_prime - h1_prime

        # Hue difference
        if c1_prime * c2_prime == 0:
            delta_h_prime = 0
        elif abs(delta_h_prime) <= 180:
            pass  # keep as is
        elif delta_h_prime > 180:
            delta_h_prime -= 360
        else:
            delta_h_prime += 360

        delta_l_prime = l2 - l1
        delta_c_prime = c2_prime - c1_prime

        delta_h_prime_rad = np.radians(delta_h_prime)
        delta_h_prime_2 = 2 * np.sqrt(c1_prime * c2_prime) * np.sin(delta_h_prime_rad / 2.0)

        # LCH averages
        l_avg = (l1 + l2) / 2.0
        c_avg_prime = (c1_prime + c2_prime) / 2.0

        h_avg_prime = h1_prime + h2_prime
        if c1_prime * c2_prime > 0:
            if abs(h1_prime - h2_prime) > 180:
                if h1_prime + h2_prime < 360:
                    h_avg_prime += 360
                else:
                    h_avg_prime -= 360
        else:
            h_avg_prime = h1_prime + h2_prime

        h_avg_prime = h_avg_prime / 2.0

        # Weighting functions
        t = (1.0 - 0.17 * np.cos(np.radians(h_avg_prime - 30.0))
             + 0.24 * np.cos(np.radians(2.0 * h_avg_prime))
             + 0.32 * np.cos(np.radians(3.0 * h_avg_prime + 6.0))
             - 0.20 * np.cos(np.radians(4.0 * h_avg_prime - 63.0)))

        sl = 1.0 + (0.015 * (l_avg - 50.0) ** 2) / np.sqrt(20.0 + (l_avg - 50.0) ** 2)
        sc = 1.0 + 0.045 * c_avg_prime
        sh = 1.0 + 0.015 * c_avg_prime * t

        # Rotation term
        delta_theta = 30.0 * np.exp(-((h_avg_prime - 275.0) / 25.0) ** 2)
        rc = 2.0 * np.sqrt(c_avg_prime ** 7 / (c_avg_prime ** 7 + 25 ** 7))
        rt = -rc * np.sin(np.radians(2.0 * delta_theta))

        kL, kC, kH = 1.0, 1.0, 1.0

        delta_e = np.sqrt(
            (delta_l_prime / (kL * sl)) ** 2 +
            (delta_c_prime / (kC * sc)) ** 2 +
            (delta_h_prime_2 / (kH * sh)) ** 2 +
            rt * (delta_c_prime / (kC * sc)) * (delta_h_prime_2 / (kH * sh))
        )

        return delta_e

    @staticmethod
    def delta_e_confidence(delta_e: float) -> str:
        """Interpret Delta E value."""
        if delta_e < 1.0:
            return 'imperceptible'
        elif delta_e < 2.0:
            return 'very_small'
        elif delta_e < 5.0:
            return 'small'
        elif delta_e < 10.0:
            return 'noticeable'
        else:
            return 'very_different'
```

---

## 4. Dominant Color Extraction

```python
# color/extraction.py
import numpy as np
import cv2
from sklearn.cluster import KMeans
from typing import List, Tuple, Optional


class DominantColorExtractor:
    """
    Extracts dominant colors from garment images using
    k-means clustering in LAB color space.
    """

    def __init__(self, n_colors: int = 5, min_cluster_size: float = 0.05):
        self.n_colors = n_colors
        self.min_cluster_size = min_cluster_size  # minimum 5% of pixels

    def extract(self, image: np.ndarray) -> List[dict]:
        """
        Extract dominant colors from an image.
        
        Args:
            image: BGR numpy array
            
        Returns:
            List of dicts with rgb, hex, percentage, lab, hsl
        """
        # Preprocess
        processed = self._preprocess(image)

        # Reshape to pixel list
        pixels = processed.reshape(-1, 3)

        # Remove near-white and near-black background pixels
        mask = self._remove_background(pixels)
        pixels = pixels[mask]

        if len(pixels) < 10:
            return self._fallback_colors(image)

        # Cluster in LAB space for perceptual accuracy
        lab_pixels = self._rgb_to_lab_batch(pixels)

        kmeans = KMeans(
            n_clusters=self.n_colors,
            random_state=42,
            n_init=10,
        )
        labels = kmeans.fit_predict(lab_pixels)

        # Count pixels per cluster
        unique, counts = np.unique(labels, return_counts=True)
        total = len(pixels)

        colors = []
        for cluster_id, count in zip(unique, counts):
            percentage = count / total
            if percentage < self.min_cluster_size:
                continue

            # Get cluster center in RGB
            center_rgb = kmeans.cluster_centers_[cluster_id]
            center_rgb_255 = self._lab_to_rgb(center_rgb)
            rgb_int = tuple(int(c) for c in center_rgb_255)

            # Convert to hex
            hex_color = '#{:02x}{:02x}{:02x}'.format(*rgb_int)

            # Get HSL
            hsl = ColorSpace.rgb_to_hsl(*rgb_int)

            colors.append({
                'rgb': rgb_int,
                'hex': hex_color,
                'percentage': round(percentage * 100, 1),
                'hsl': (round(hsl[0], 1), round(hsl[1], 1), round(hsl[2], 1)),
                'lab': tuple(round(c, 2) for c in center_rgb),
            })

        # Sort by percentage descending
        colors.sort(key=lambda c: -c['percentage'])

        return colors

    def get_primary_color(self, image: np.ndarray) -> Optional[dict]:
        """Get single primary (most dominant) color."""
        colors = self.extract(image)
        return colors[0] if colors else None

    def get_color_palette(self, image: np.ndarray, size: str = 'medium') -> List[dict]:
        """
        Get a balanced color palette.
        
        Sizes: 'small' (3), 'medium' (5), 'large' (8)
        """
        sizes = {'small': 3, 'medium': 5, 'large': 8}
        self.n_colors = sizes.get(size, 5)
        return self.extract(image)

    def _preprocess(self, image: np.ndarray) -> np.ndarray:
        """Preprocess image for color extraction."""
        # Resize for performance
        h, w = image.shape[:2]
        if h * w > 500 * 500:
            scale = np.sqrt((500 * 500) / (h * w))
            image = cv2.resize(image, None, fx=scale, fy=scale)

        # Apply slight Gaussian blur to reduce noise
        image = cv2.GaussianBlur(image, (5, 5), 1)

        return image

    def _remove_background(self, pixels: np.ndarray) -> np.ndarray:
        """Remove likely background pixels (near white/black)."""
        gray = cv2.cvtColor(
            pixels.reshape(1, -1, 3).astype(np.uint8),
            cv2.COLOR_RGB2GRAY,
        ).flatten()

        # Keep pixels that are not near-white (>240) or near-black (<15)
        mask = (gray > 15) & (gray < 240)
        return mask

    def _rgb_to_lab_batch(self, pixels: np.ndarray) -> np.ndarray:
        """Convert batch of RGB pixels to LAB."""
        # Normalize to [0, 1]
        pixels_float = pixels.astype(np.float32) / 255.0

        # sRGB linearization
        mask = pixels_float <= 0.04045
        pixels_linear = pixels_float / 12.92
        pixels_linear[~mask] = ((pixels_float[~mask] + 0.055) / 1.055) ** 2.4

        # RGB to XYZ (D65)
        x = pixels_linear[:, 0] * 0.4124564 + pixels_linear[:, 1] * 0.3575761 + pixels_linear[:, 2] * 0.1804375
        y = pixels_linear[:, 0] * 0.2126729 + pixels_linear[:, 1] * 0.7151522 + pixels_linear[:, 2] * 0.0721750
        z = pixels_linear[:, 0] * 0.0193339 + pixels_linear[:, 1] * 0.1191920 + pixels_linear[:, 2] * 0.9503041

        # XYZ to LAB
        x /= 0.95047
        y /= 1.0
        z /= 1.08883

        def lab_f(t):
            delta = 6.0 / 29.0
            result = np.zeros_like(t)
            mask = t > delta ** 3
            result[mask] = t[mask] ** (1.0 / 3.0)
            result[~mask] = t[~mask] / (3.0 * delta ** 2) + 4.0 / 29.0
            return result

        fx, fy, fz = lab_f(x), lab_f(y), lab_f(z)

        l = 116.0 * fy - 16.0
        a = 500.0 * (fx - fy)
        b = 200.0 * (fy - fz)

        return np.column_stack([l, a, b])

    def _lab_to_rgb(self, lab: np.ndarray) -> np.ndarray:
        """Convert single LAB pixel back to RGB [0, 255]."""
        l, a, b = lab

        fy = (l + 16.0) / 116.0
        fx = a / 500.0 + fy
        fz = fy - b / 200.0

        def lab_f_inv(t):
            delta = 6.0 / 29.0
            if t > delta:
                return t ** 3
            return 3.0 * delta ** 2 * (t - 4.0 / 29.0)

        x = lab_f_inv(fx) * 0.95047
        y = lab_f_inv(fy) * 1.0
        z = lab_f_inv(fz) * 1.08883

        # XYZ to linear RGB
        r_lin = x * 3.2404542 + y * -1.5371385 + z * -0.4985314
        g_lin = x * -0.9692660 + y * 1.8760108 + z * 0.0415560
        b_lin = x * 0.0556434 + y * -0.2040259 + z * 1.0572252

        # Linear to sRGB
        rgb = np.array([r_lin, g_lin, b_lin])

        # Apply gamma
        mask = rgb <= 0.0031308
        rgb[mask] *= 12.92
        rgb[~mask] = 1.055 * rgb[~mask] ** (1.0 / 2.4) - 0.055

        return np.clip(rgb * 255.0, 0, 255)

    def _fallback_colors(self, image: np.ndarray) -> List[dict]:
        """Simple fallback using average and standard deviation."""
        avg = np.mean(image, axis=(0, 1))
        rgb = tuple(int(c) for c in avg[::-1])  # BGR to RGB
        hex_color = '#{:02x}{:02x}{:02x}'.format(*rgb)
        hsl = ColorSpace.rgb_to_hsl(*rgb)

        return [{
            'rgb': rgb,
            'hex': hex_color,
            'percentage': 100.0,
            'hsl': (round(hsl[0], 1), round(hsl[1], 1), round(hsl[2], 1)),
            'lab': (0, 0, 0),
        }]


class ImageColorAnalyzer:
    """
    High-level color analysis for garment images.
    Combines extraction with classification.
    """

    def __init__(self):
        self.extractor = DominantColorExtractor()

    def analyze_garment(self, image: np.ndarray) -> dict:
        """Full color analysis of a garment image."""
        colors = self.extractor.extract(image)
        primary = colors[0] if colors else None

        if primary:
            color_family = self._classify_color_family(primary['hsl'])
            season = self._suggest_season(primary['hsl'])
        else:
            color_family = 'unknown'
            season = 'all'

        return {
            'primary_color': primary,
            'palette': colors,
            'color_family': color_family,
            'season': season,
            'is_pattern': self._detect_pattern(image),
        }

    def _classify_color_family(self, hsl: Tuple[float, float, float]) -> str:
        """Classify color into fashion families."""
        h, s, l = hsl

        # Achromatic (gray scale)
        if s < 15:
            if l < 15: return 'black'
            if l > 85: return 'white'
            return 'gray'

        # Chromatic
        if h < 30 or h >= 345: return 'red'
        if 30 <= h < 60: return 'orange'
        if 60 <= h < 90: return 'yellow'
        if 90 <= h < 150: return 'green'
        if 150 <= h < 210: return 'teal'
        if 210 <= h < 285: return 'blue'
        if 285 <= h < 330: return 'purple'
        if 330 <= h < 345: return 'pink'

        return 'unknown'

    def _suggest_season(self, hsl: Tuple[float, float, float]) -> str:
        """Suggest which seasons this color is appropriate for."""
        h, s, l = hsl

        seasons = []
        if 30 <= h <= 90 and s > 30:
            seasons.append('spring')
        if (h <= 30 or h >= 330) and l > 50:
            seasons.append('summer')
        if 0 <= h <= 60 and s > 40:
            seasons.append('autumn')
        if 200 <= h <= 280 and l < 40:
            seasons.append('winter')
        if s < 15:
            seasons = ['all']

        return seasons[0] if seasons else 'all'

    def _detect_pattern(self, image: np.ndarray) -> bool:
        """Detect if garment has a pattern (vs solid color)."""
        colors = self.extractor.extract(image)

        # If no single color dominates > 70%, likely a pattern
        if colors and len(colors) > 1:
            if colors[0]['percentage'] < 70:
                return True

        # Edge detection for pattern detection
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / edges.size

        return edge_density > 0.1
```

---

## 5. Color Compatibility Scoring

```python
# color/compatibility_scorer.py
import numpy as np
from typing import List, Dict, Tuple, Optional


class CompatibilityScorer:
    """
    Scores color compatibility between garments for outfit recommendations.
    
    Scoring factors:
    - Color harmony (weight: 0.5)
    - Color distance (weight: 0.2)
    - Neutral compatibility (weight: 0.15)
    - Season alignment (weight: 0.15)
    """

    def __init__(self):
        self.harmony = ColorHarmony()
        self.distance = ColorDistance()

    def score_compatibility(
        self,
        color_a: Dict,
        color_b: Dict,
        season: Optional[str] = None,
    ) -> Dict:
        """
        Score compatibility between two colors.
        
        Returns score 0-100 where:
        - 0-30: Clashing
        - 30-50: Neutral/OK
        - 50-70: Good match
        - 70-85: Great match
        - 85-100: Perfect match
        """
        hsl_a = color_a['hsl']
        hsl_b = color_b['hsl']

        lab_a = ColorSpace.rgb_to_lab(*color_a['rgb'])
        lab_b = ColorSpace.rgb_to_lab(*color_b['rgb'])

        # 1. Harmony score
        harmony_score = self._score_harmony(hsl_a, hsl_b)

        # 2. Distance score (perceptual)
        delta_e = self.distance.ciede2000(lab_a, lab_b)
        distance_score = self._score_distance(delta_e)

        # 3. Neutral compatibility
        neutral_score = self._score_neutral(hsl_a, hsl_b)

        # 4. Season alignment
        season_score = self._score_season(hsl_a, hsl_b, season)

        # Weighted total
        total = (
            harmony_score * 0.50 +
            distance_score * 0.20 +
            neutral_score * 0.15 +
            season_score * 0.15
        )

        total = min(max(total, 0), 100)

        return {
            'total_score': round(total, 1),
            'breakdown': {
                'harmony': round(harmony_score, 1),
                'distance': round(distance_score, 1),
                'neutral': round(neutral_score, 1),
                'season': round(season_score, 1),
            },
            'delta_e': round(delta_e, 2),
            'delta_e_interpretation': self.distance.delta_e_confidence(delta_e),
            'category': self._classify_score(total),
        }

    def score_multiple_colors(
        self,
        colors: List[Dict],
        season: Optional[str] = None,
    ) -> Dict:
        """
        Score compatibility across multiple colors (e.g., an entire outfit).
        Uses pairwise scoring with aggregation.
        """
        if len(colors) < 2:
            return {'total_score': 50, 'pairwise': [], 'category': 'insufficient'}

        pairwise = []
        scores = []

        for i in range(len(colors)):
            for j in range(i + 1, len(colors)):
                result = self.score_compatibility(colors[i], colors[j], season)
                pairwise.append({
                    'pair': (i, j),
                    'colors': (colors[i]['hex'], colors[j]['hex']),
                    **result,
                })
                scores.append(result['total_score'])

        # Aggregate: average of pairwise scores
        avg_score = np.mean(scores) if scores else 50

        # Penalize high variance (inconsistent outfit)
        variance_penalty = np.std(scores) * 0.1 if len(scores) > 1 else 0
        total = max(0, avg_score - variance_penalty)

        return {
            'total_score': round(total, 1),
            'pairwise': pairwise,
            'color_count': len(colors),
            'category': self._classify_score(total),
            'consistency': 'high' if np.std(scores) < 10 else 'medium' if np.std(scores) < 20 else 'low',
        }

    def find_best_match(
        self,
        target_color: Dict,
        palette: List[Dict],
        season: Optional[str] = None,
        top_n: int = 3,
    ) -> List[Dict]:
        """Find the best matching colors from a palette for a target color."""
        scored = []
        for color in palette:
            result = self.score_compatibility(target_color, color, season)
            scored.append({
                'color': color,
                **result,
            })

        scored.sort(key=lambda x: -x['total_score'])
        return scored[:top_n]

    def _score_harmony(
        self,
        hsl_a: Tuple[float, float, float],
        hsl_b: Tuple[float, float, float],
    ) -> float:
        """Score based on color wheel harmony rules."""
        h_a, s_a, l_a = hsl_a
        h_b, s_b, l_b = hsl_b
        h_diff = abs(h_a - h_b)

        # Complementary: ~180 degrees apart
        if 160 <= h_diff <= 200:
            return 95.0

        # Split complementary: ~150 or ~210
        if 130 <= h_diff <= 160 or 200 <= h_diff <= 230:
            return 80.0

        # Analogous: 30-60 degrees apart
        if 20 <= h_diff <= 60:
            return 85.0

        # Triadic: ~120 or ~240
        if 110 <= h_diff <= 130 or 230 <= h_diff <= 250:
            return 90.0

        # Tetradic: ~60, ~180, ~240
        if 50 <= h_diff <= 70:
            return 75.0

        # Monochromatic: similar hue
        if h_diff < 15:
            # Check saturation/lightness variation
            sl_diff = abs(s_a - s_b) + abs(l_a - l_b)
            if 10 <= sl_diff <= 50:
                return 88.0
            elif sl_diff < 10:
                return 50.0  # Too similar, not interesting
            return 65.0

        # No clear harmony (e.g., ~90 degrees apart)
        return 30.0

    def _score_distance(self, delta_e: float) -> float:
        """Score based on perceptual distance."""
        if delta_e < 1.0:
            return 50.0  # Almost identical - not great for contrast
        elif delta_e < 5.0:
            return 60.0  # Subtle difference
        elif delta_e < 15.0:
            return 80.0  # Good contrast
        elif delta_e < 30.0:
            return 70.0  # Strong contrast
        else:
            return 40.0  # Too much difference - clashing

    def _score_neutral(
        self,
        hsl_a: Tuple[float, float, float],
        hsl_b: Tuple[float, float, float],
    ) -> float:
        """Score based on neutral color compatibility."""
        def is_neutral(hsl):
            return hsl[1] < 15

        def is_bright_white(hsl):
            return hsl[1] < 10 and hsl[2] > 85

        def is_black(hsl):
            return hsl[2] < 10

        def is_navy(hsl):
            return 210 <= hsl[0] <= 250 and hsl[1] > 20 and hsl[2] < 40

        a_neutral = is_neutral(hsl_a)
        b_neutral = is_neutral(hsl_b)

        if a_neutral and b_neutral:
            # Two neutrals: need variety
            if abs(hsl_a[2] - hsl_b[2]) > 30:
                return 80.0  # Light + dark neutral (good contrast)
            return 40.0  # Similar neutrals (boring)

        if a_neutral or b_neutral:
            return 90.0  # Neutral + color = always works

        return 60.0  # Color + color (depends on other factors)

    def _score_season(
        self,
        hsl_a: Tuple[float, float, float],
        hsl_b: Tuple[float, float, float],
        season: Optional[str],
    ) -> float:
        """Score based on season alignment."""
        if not season:
            return 75.0  # No season preference

        def season_match(hsl, target_season):
            h, s, l = hsl
            if target_season == 'spring':
                return 30 <= h <= 90 and s > 30
            elif target_season == 'summer':
                return (h <= 30 or h >= 330) and l > 50
            elif target_season == 'autumn':
                return 0 <= h <= 60 and s > 40
            elif target_season == 'winter':
                return 200 <= h <= 280 and l < 40
            return True

        a_match = season_match(hsl_a, season)
        b_match = season_match(hsl_b, season)

        if a_match and b_match:
            return 100.0  # Both match season
        if a_match or b_match:
            return 60.0  # One matches
        return 20.0  # Neither matches

    def _classify_score(self, score: float) -> str:
        if score >= 85:
            return 'perfect'
        elif score >= 70:
            return 'great'
        elif score >= 50:
            return 'good'
        elif score >= 30:
            return 'neutral'
        else:
            return 'clash'
```

---

## 6. Example Scoring Matrix

```python
# color/scoring_matrix.py

COMMON_COMBINATIONS = [
    # (color_a_name, hex_a, color_b_name, hex_b, expected_score_category)
    
    # Neutrals
    ('White', '#FFFFFF', 'Black', '#000000', 'great'),
    ('White', '#FFFFFF', 'Navy', '#000080', 'great'),
    ('White', '#FFFFFF', 'Beige', '#F5F5DC', 'good'),
    ('Black', '#000000', 'Gray', '#808080', 'great'),
    ('Black', '#000000', 'Navy', '#000080', 'neutral'),  # Too dark together
    ('Beige', '#F5F5DC', 'White', '#FFFFFF', 'neutral'),  # Too similar
    ('Gray', '#808080', 'Navy', '#000080', 'great'),
    
    # Primary + neutral
    ('Red', '#FF0000', 'White', '#FFFFFF', 'perfect'),
    ('Red', '#FF0000', 'Black', '#000000', 'perfect'),
    ('Red', '#FF0000', 'Gray', '#808080', 'great'),
    ('Blue', '#0000FF', 'White', '#FFFFFF', 'perfect'),
    ('Blue', '#0000FF', 'Beige', '#F5F5DC', 'great'),
    ('Yellow', '#FFFF00', 'Black', '#000000', 'perfect'),
    ('Yellow', '#FFFF00', 'Navy', '#000080', 'great'),
    
    # Complementary pairs
    ('Red', '#FF0000', 'Green', '#00FF00', 'perfect'),  # Christmas
    ('Blue', '#0000FF', 'Orange', '#FFA500', 'great'),
    ('Purple', '#800080', 'Yellow', '#FFFF00', 'great'),
    ('Teal', '#008080', 'Coral', '#FF7F50', 'perfect'),
    
    # Analogous pairs
    ('Blue', '#0000FF', 'Teal', '#008080', 'great'),
    ('Pink', '#FFC0CB', 'Red', '#FF0000', 'good'),
    ('Green', '#00FF00', 'Yellow', '#FFFF00', 'good'),
    
    # Triadic
    ('Red', '#FF0000', 'Yellow', '#FFFF00', 'great'),  # + Blue
    ('Blue', '#0000FF', 'Red', '#FF0000', 'great'),
    ('Purple', '#800080', 'Green', '#00FF00', 'good'),
    
    # Clashing
    ('Red', '#FF0000', 'Pink', '#FFC0CB', 'neutral'),  # Similar, low contrast
    ('Orange', '#FFA500', 'Red', '#FF0000', 'neutral'),  # Adjacent but no contrast
    ('Green', '#00FF00', 'Blue', '#0000FF', 'neutral'),
    ('Brown', '#A52A2A', 'Black', '#000000', 'clash'),  # Both dark
    
    # Denim-friendly
    ('Denim Blue', '#4A5D70', 'White', '#FFFFFF', 'perfect'),
    ('Denim Blue', '#4A5D70', 'Red', '#FF0000', 'great'),
    ('Denim Blue', '#4A5D70', 'Beige', '#F5F5DC', 'great'),
    ('Denim Blue', '#4A5D70', 'Black', '#000000', 'great'),
]

def print_scoring_matrix():
    """Print the scoring matrix for reference."""
    scorer = CompatibilityScorer()
    
    print(f"{'Color A':<20} {'Color B':<20} {'Score':<8} {'Category':<12} {'Expected'}")
    print('-' * 80)
    
    for name_a, hex_a, name_b, hex_b, expected in COMMON_COMBINATIONS:
        color_a = {'rgb': tuple(int(hex_a[i:i+2], 16) for i in (1, 3, 5)), 'hex': hex_a, 'hsl': ColorSpace.rgb_to_hsl(*[int(hex_a[i:i+2], 16) for i in (1, 3, 5)])}
        color_b = {'rgb': tuple(int(hex_b[i:i+2], 16) for i in (1, 3, 5)), 'hex': hex_b, 'hsl': ColorSpace.rgb_to_hsl(*[int(hex_b[i:i+2], 16) for i in (1, 3, 5)])}
        
        result = scorer.score_compatibility(color_a, color_b)
        score = result['total_score']
        category = result['category']
        
        match = '✓' if category == expected else '✗'
        print(f"{name_a:<20} {name_b:<20} {score:<8.1f} {category:<12} {match}")
```

---

## 7. Outfit Recommendation Engine

```python
# recommendation/outfit_recommender.py
from typing import List, Dict, Optional
from color.compatibility_scorer import CompatibilityScorer
from color.extraction import DominantColorExtractor


class OutfitColorRecommender:
    """
    Recommends color-compatible garment combinations for outfits.
    """

    def __init__(self):
        self.scorer = CompatibilityScorer()
        self.extractor = DominantColorExtractor()

    def recommend_bottom_for_top(
        self,
        top_color: Dict,
        available_bottoms: List[Dict],
        season: Optional[str] = None,
        n: int = 5,
    ) -> List[Dict]:
        """
        Find best bottom garments to match a top.
        """
        scored = []
        for bottom in available_bottoms:
            result = self.scorer.score_compatibility(top_color, bottom['color'], season)
            scored.append({
                'garment_id': bottom['id'],
                'name': bottom['name'],
                'color': bottom['color'],
                'score': result['total_score'],
                'breakdown': result['breakdown'],
                'category': result['category'],
            })

        scored.sort(key=lambda x: -x['score'])
        return scored[:n]

    def recommend_top_for_bottom(
        self,
        bottom_color: Dict,
        available_tops: List[Dict],
        season: Optional[str] = None,
        n: int = 5,
    ) -> List[Dict]:
        """Symmetrical to recommend_bottom_for_top."""
        return self.recommend_bottom_for_top(bottom_color, available_tops, season, n)

    def complete_outfit(
        self,
        anchor_garment: Dict,
        available_garments: Dict[str, List[Dict]],
        season: Optional[str] = None,
    ) -> Dict:
        """
        Complete an outfit from an anchor garment.
        Returns curated outfit with top, bottom, shoes, and accessories.
        """
        anchor_color = anchor_garment['color']
        anchor_type = anchor_garment['type']

        result = {
            'anchor': anchor_garment,
            'recommendations': {},
        }

        type_order = ['top', 'bottom', 'shoes', 'accessory']
        current_color = anchor_color

        for garment_type in type_order:
            if garment_type == anchor_type:
                continue

            candidates = available_garments.get(garment_type, [])
            if not candidates:
                continue

            scored = []
            for g in candidates:
                compat = self.scorer.score_compatibility(current_color, g['color'], season)
                scored.append({
                    **g,
                    'compatibility_score': compat['total_score'],
                    'compatibility_breakdown': compat['breakdown'],
                })

            scored.sort(key=lambda x: -x['compatibility_score'])

            if scored:
                best = scored[0]
                result['recommendations'][garment_type] = best
                current_color = best['color']  # Next garment should match this

        return result

    def score_existing_outfit(
        self,
        garments: List[Dict],
        season: Optional[str] = None,
    ) -> Dict:
        """
        Score an existing outfit's color compatibility.
        
        garments: list of dicts with 'color' and 'type' keys.
        """
        colors = [g['color'] for g in garments]
        result = self.scorer.score_multiple_colors(colors, season)

        # Add garment-specific suggestions
        if result['total_score'] < 50:
            suggestions = self._generate_improvement_suggestions(garments, season)
            result['suggestions'] = suggestions

        return result

    def _generate_improvement_suggestions(
        self,
        garments: List[Dict],
        season: Optional[str],
    ) -> List[str]:
        """Generate human-readable suggestions for improvement."""
        suggestions = []
        colors = [g['color'] for g in garments]

        for i, garment in enumerate(garments):
            for j in range(i + 1, len(garments)):
                result = self.scorer.score_compatibility(colors[i], colors[j], season)
                if result['total_score'] < 30:
                    suggestions.append(
                        f"Consider changing your {garment['type']} "
                        f"({garment.get('name', '')}) to better match "
                        f"the {garments[j]['type']}."
                    )

        if not suggestions:
            suggestions.append("Your outfit looks great! Try adding an accessory for flair.")

        return suggestions
```

---

## 8. Seasonal Color Recommendations

```python
# color/seasonal_palettes.py

SEASONAL_PALETTES = {
    'spring': {
        'name': 'Spring',
        'description': 'Fresh, bright, and warm tones inspired by new growth.',
        'colors': [
            '#FFB7C5',  # Cherry Blossom
            '#FFD700',  # Daffodil
            '#7CB342',  # New Green
            '#FF8C00',  # Tulip Orange
            '#87CEEB',  # Sky Blue
            '#FFFACD',  # Lemon Chiffon
            '#FF69B4',  # Hot Pink
            '#98FB98',  # Pale Green
            '#FFDAB9',  # Peach
            '#E6E6FA',  # Lavender
        ],
        'neutrals': ['#FFFFFF', '#F5F5DC', '#D3D3D3', '#A9A9A9'],
        'palette_name': 'Fresh Spring',
        'look_and_feel': 'Light, airy, optimistic',
    },
    'summer': {
        'name': 'Summer',
        'description': 'Vibrant, bold, and saturated colors for the heat.',
        'colors': [
            '#FF4500',  # Orange Red
            '#FF1493',  # Deep Pink
            '#00CED1',  # Turquoise
            '#FFD700',  # Sun Yellow
            '#4169E1',  # Royal Blue
            '#32CD32',  # Lime
            '#FF6347',  # Tomato
            '#9370DB',  # Medium Purple
            '#FFE4B5',  # Moccasin
            '#00FA9A',  # Medium Spring Green
        ],
        'neutrals': ['#FFFFFF', '#F0F8FF', '#C0C0C0', '#808080'],
        'palette_name': 'Summer Vibes',
        'look_and_feel': 'Bold, energetic, confident',
    },
    'autumn': {
        'name': 'Autumn',
        'description': 'Warm, earthy, and rich tones reflecting fall leaves.',
        'colors': [
            '#8B4513',  # Saddle Brown
            '#D2691E',  # Chocolate
            '#FF8C00',  # Dark Orange
            '#BDB76B',  # Dark Khaki
            '#800000',  # Maroon
            '#556B2F',  # Olive
            '#CD853F',  # Peru
            '#DAA520',  # Goldenrod
            '#BC8F8F',  # Rosy Brown
            '#A0522D',  # Sienna
        ],
        'neutrals': ['#F5F5DC', '#D2B48C', '#A0522D', '#3E2723'],
        'palette_name': 'Cozy Autumn',
        'look_and_feel': 'Warm, grounded, sophisticated',
    },
    'winter': {
        'name': 'Winter',
        'description': 'Cool, crisp, and high-contrast colors for the cold.',
        'colors': [
            '#000080',  # Navy
            '#8B0000',  # Dark Red
            '#006400',  # Dark Green
            '#483D8B',  # Dark Slate Blue
            '#2F4F4F',  # Dark Slate Gray
            '#191970',  # Midnight Blue
            '#800080',  # Purple
            '#B22222',  # Firebrick
            '#4A0080',  # Indigo
            '#008080',  # Teal
        ],
        'neutrals': ['#FFFFFF', '#000000', '#696969', '#DCDCDC'],
        'palette_name': 'Crisp Winter',
        'look_and_feel': 'Dramatic, elegant, refined',
    },
    'all': {
        'name': 'All Season',
        'description': 'Universal colors that work year-round.',
        'colors': [
            '#000000',  # Black
            '#FFFFFF',  # White
            '#808080',  # Gray
            '#000080',  # Navy
            '#F5F5DC',  # Beige
            '#C0C0C0',  # Silver
            '#800080',  # Purple
            '#FF0000',  # Red
            '#0000FF',  # Blue
            '#008000',  # Green
        ],
        'neutrals': ['#000000', '#FFFFFF', '#808080', '#F5F5DC'],
        'palette_name': 'Classic',
        'look_and_feel': 'Timeless, versatile',
    },
}
```

---

## 9. Color Recognition Service (API)

```python
# api/color_service.py
from fastapi import FastAPI, File, UploadFile
from color.extraction import ImageColorAnalyzer
from color.compatibility_scorer import CompatibilityScorer
import cv2
import numpy as np

app = FastAPI(title="Closet Color Analysis API")
analyzer = ImageColorAnalyzer()
scorer = CompatibilityScorer()

@app.post("/api/v1/colors/extract")
async def extract_colors(file: UploadFile = File(...)):
    """Extract dominant colors from a garment image."""
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image is None:
        return {"error": "Could not decode image"}
    
    analysis = analyzer.analyze_garment(image)
    return analysis

@app.post("/api/v1/colors/score-compatibility")
async def score_compatibility(data: dict):
    """Score compatibility between two colors or multiple colors."""
    if 'colors' in data:
        result = scorer.score_multiple_colors(data['colors'], data.get('season'))
    elif 'color_a' in data and 'color_b' in data:
        result = scorer.score_compatibility(data['color_a'], data['color_b'], data.get('season'))
    else:
        return {"error": "Provide 'colors' list or 'color_a'/'color_b'"}
    
    return result

@app.get("/api/v1/colors/seasonal/{season}")
async def get_seasonal_palette(season: str):
    """Get seasonal color palette."""
    from color.seasonal_palettes import SEASONAL_PALETTES
    palette = SEASONAL_PALETTES.get(season.lower())
    if not palette:
        return {"error": f"Unknown season: {season}. Options: spring, summer, autumn, winter, all"}
    return palette
```

---

## 10. Algorithm Accuracy Targets

| Metric | Target | Method |
|--------|--------|--------|
| Dominant color extraction accuracy | > 90% | Validated vs. manual labeling |
| Color distance correlation (human perception) | r > 0.95 | CIEDE2000 validation |
| Compatibility score agreement (human raters) | > 85% | A/B testing |
| Color family classification | > 95% | HSL threshold tuning |
| Pattern detection accuracy | > 85% | Edge density + cluster analysis |
| Season appropriateness prediction | > 80% | Fashion expert review |
| Outfit recommendation acceptance rate | > 60% | User click-through rate |
