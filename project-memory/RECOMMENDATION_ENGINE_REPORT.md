# Recommendation Engine Report — Closet Inteligente Digital

> **Generated:** 2026-05-27
> **Phase:** Product Intelligence + Platform Scale

---

## Recommendation Maturity

| Capability | Status | Previous |
|---|---|---|
| ML-assisted ranking | DONE (V2) | Heuristic only |
| Contextual scoring | DONE | — |
| Weather-aware scoring | DONE | — |
| Event-aware scoring | DONE | — |
| User preference weighting | DONE | — |
| Recency balancing | DONE | — |
| Diversity balancing | DONE | — |
| Explanation metadata | DONE | — |
| Feedback loop | DONE | — |
| Recommendation metrics | DONE | — |

## Scoring Formula

```
Total = contextual * 0.25 + colorHarmony * 0.25 + rotation * 0.20
        + preference * 0.10 + recency * 0.10 + diversity * 0.10
```

## Recommendation Output

```json
{
  "suggestions": [
    {
      "garments": [...],
      "score": 0.8721,
      "breakdown": {
        "contextual": 0.9,
        "colorHarmony": 0.85,
        "rotation": 0.7,
        "diversity": 0.95,
        "preference": 0.6,
        "recency": 0.4
      },
      "explanations": [
        {
          "reasons": [
            "Colors complement each other well",
            "Includes garments not worn recently",
            "Recommended for casual"
          ],
          "confidence": 0.873,
          "matchingFactors": ["color_harmony", "rotation", "occasion"],
          "colorHarmony": 0.85,
          "rotationScore": 0.7,
          "diversityBonus": 0.95
        }
      ]
    }
  ]
}
```

## Feedback Loop

| Action | Tracked | Used For |
|---|---|---|
| Accepted | recommendation_feedback | CTR calculation |
| Rejected | recommendation_feedback | Negative signal |
| Worn | recommendation_feedback + wear_history | Positive signal |
| Dismissed | recommendation_feedback | Weak negative |

## Metrics Pipeline

- CTR = accepted / total recommendations
- Rejection rate = rejected / total
- Avg confidence per user
- Stored in `recommendation_metrics` table (daily rollup)

## Remaining Work

- [ ] Online learning (update weights from feedback in real-time)
- [ ] Collaborative filtering for cross-user patterns
- [ ] Seasonal model retraining
- [ ] A/B test framework for scoring weight tuning
- [ ] Recommendation diversity metrics (intra-list diversity)
