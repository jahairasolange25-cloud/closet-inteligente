from app.processors.colors import _color_distance, _remove_near_duplicates, _rgb_to_hex


class TestColorUtils:
    def test_rgb_to_hex(self):
        assert _rgb_to_hex(255, 0, 0) == "#ff0000"
        assert _rgb_to_hex(0, 255, 0) == "#00ff00"
        assert _rgb_to_hex(0, 0, 255) == "#0000ff"
        assert _rgb_to_hex(255, 255, 255) == "#ffffff"

    def test_color_distance_same(self):
        assert _color_distance((255, 0, 0), (255, 0, 0)) == 0.0

    def test_color_distance_different(self):
        assert _color_distance((0, 0, 0), (255, 255, 255)) > 0

    def test_remove_near_duplicates_empty(self):
        assert _remove_near_duplicates([]) == []

    def test_remove_near_duplicates_all_unique(self):
        colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255)]
        result = _remove_near_duplicates(colors, min_distance=100)
        assert len(result) == 3

    def test_remove_near_duplicates_some_duplicates(self):
        colors = [(255, 0, 0), (250, 5, 5), (0, 255, 0)]
        result = _remove_near_duplicates(colors, min_distance=50)
        assert len(result) == 2
