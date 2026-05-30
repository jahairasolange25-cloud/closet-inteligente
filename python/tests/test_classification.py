from app.processors.classification import (
    _compute_category_scores,
)


class TestClassification:
    def test_compute_scores_upper_body_aspect_ratio(self):
        scores = _compute_category_scores(
            aspect_ratio=0.8,
            contour_ratio=0.6,
            extent=0.7,
            color_variance=0.3,
            edge_density=0.05,
            has_transparency=False,
            height=500,
            width=400,
        )
        assert "upper_body" in scores
        assert scores["upper_body"]["score"] > 0

    def test_compute_scores_lower_body_aspect_ratio(self):
        scores = _compute_category_scores(
            aspect_ratio=1.8,
            contour_ratio=0.6,
            extent=0.7,
            color_variance=0.3,
            edge_density=0.05,
            has_transparency=False,
            height=500,
            width=900,
        )
        assert "lower_body" in scores
        assert scores["lower_body"]["score"] > 0

    def test_compute_scores_footwear_small_area(self):
        scores = _compute_category_scores(
            aspect_ratio=1.5,
            contour_ratio=0.3,
            extent=0.4,
            color_variance=0.5,
            edge_density=0.1,
            has_transparency=False,
            height=100,
            width=150,
        )
        assert "footwear" in scores
        assert scores["footwear"]["score"] >= 0

    def test_all_categories_present(self):
        scores = _compute_category_scores(
            aspect_ratio=1.0,
            contour_ratio=0.6,
            extent=0.7,
            color_variance=0.3,
            edge_density=0.05,
            has_transparency=False,
            height=500,
            width=500,
        )
        for cat in ("upper_body", "lower_body", "outerwear", "footwear"):
            assert cat in scores
