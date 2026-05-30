# AI/CV Service — Known Limitations V1

> Last Updated: 2026-05-27
> Documents all known limitations of the Computer Vision Foundation V1.

---

## Heuristic Classifier Limitations

### General

| Limitation | Impact | Mitigation |
|---|---|---|
| NO machine learning | Classification is based on aspect ratio + contour heuristics, not trained models | V2 will add ML classifier |
| No fabric/texture analysis | Cannot distinguish materials (cotton vs polyester) | Deferred to ML phase |
| No color pattern detection | Does not identify stripes, plaids, dots | Deferred to ML phase |
| Single image only | No multi-angle analysis | V2 will support multiple views |
| Flat-lay assumption | Assumes garment is photographed flat on surface | Will fail on mannequins or hangers |

### Per-Category Limitations

| Category | Limitation | False Positive Risk |
|---|---|---|
| `upper_body` | Cannot distinguish t-shirt vs polo vs blouse vs sweater | ~30% cross-category confusion |
| `lower_body` | Cannot distinguish pants vs jeans vs shorts vs skirts | ~25% confusion; skirt vs dress cannot be resolved |
| `footwear` | Highly unreliable without bottom/side profile view | ~50% false positive on small dark garments |
| `outerwear` | Confuses with upper_body for thick fabrics | ~35% false positive; jackets identified as upper_body |
| `unknown` | Falls back for any ratio outside expected ranges | Conservative — avoids wrong classification |

### Aspect Ratio Limitations

| Aspect Ratio (W:H) | Default Classification | Issue |
|---|---|---|
| 0.4 – 0.6 | unknown (too tall) | Dresses, long coats |
| 0.6 – 1.2 | upper_body | Correct for most tops |
| 1.3 – 2.5 | lower_body | Correct for most bottoms |
| < 0.4 or > 2.5 | unknown | Scarves, ties, accessories |

---

## Non-ML Limitations

### Background Removal (rembg)

| Limitation | Details |
|---|---|
| No edge refinement | Output may have rough edges on complex backgrounds |
| No shadow detection | Cast shadows are NOT removed |
| Processing time | 2–10s on CPU depending on image size |
| Large images (> 10MB) | May exceed 30s step timeout |
| Transparent input | Works correctly but may produce artifacts |

### Color Extraction (OpenCV k-means)

| Limitation | Details |
|---|---|
| Deterministic but not perfect | k-means depends on initial centroid placement; using fixed seed for determinism |
| Near-duplicate pruning | May merge visually distinct colors within 30 delta-E distance |
| Transparent pixel handling | Transparent pixels are ignored; color extraction on bg-removed images only |
| Top 5 only | Limited to 5 dominant colors; small accent colors may be missed |

### Thumbnail Generation (Pillow)

| Limitation | Details |
|---|---|
| Aspect ratio preservation | `thumbnail()` maintains ratio, padded whitespace not added |
| No progressive loading | Single JPEG output; no multi-resolution or interlaced |
| Format | Always PNG for transparency preservation |

---

## Unsupported Garments

The following garment types are NOT detected by the heuristic classifier:

| Garment | Reason | Tracked |
|---|---|---|
| Dresses | Aspect ratio overlaps upper + lower body | AI-03 |
| Swimwear | Small area, unusual proportions | AI-03 |
| Accessories (belts, scarves, hats, ties) | Too small or odd aspect ratios | AI-03 |
| Undergarments | Privacy filtering required first | AI-03 |
| Socks | Small area, indistinguishable from processing artifacts | AI-03 |
| Bags | Not a garment category | Deferred |

---

## Expected False Positives

| Scenario | Likely Classification | Why |
|---|---|---|
| Small dark object on white bg | footwear | Small size + high contrast |
| Folded blanket/towel | outerwear | High edge density + aspect ratio |
| Close-up of fabric swatch | upper_body | 1:1 aspect ratio |
| Book or box | outerwear | Rectangular contour + edge density |
| Single shoe (bottom view) | unknown | Aspect ratio too extreme |

---

## Processing Time Expectations

| Step | Expected (CPU) | Timeout | Notes |
|---|---|---|---|
| Background removal | 2–10s | 30s | Model download on first run |
| Color extraction | 0.5–3s | 30s | Scales with image pixel count |
| Classification | 0.1–0.5s | 30s | Fast heuristic |
| Thumbnails | 0.1–0.3s | 30s | Fast resize |
| Metadata | < 0.1s | 30s | Instant |
| **Total pipeline** | **3–15s** | **120s** | |

---

## Next Improvements (ML Phase)

1. Replace heuristic classifier with ONNX-based CNN (MobileNetV3 or similar)
2. Add attribute extraction (color name, pattern detection, material)
3. Add style embeddings for outfit recommendation
4. Add multi-angle support
5. Add garment measurement estimation
