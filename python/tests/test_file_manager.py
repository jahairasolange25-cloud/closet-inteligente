from pathlib import Path

import pytest

from app.utils.file_manager import TemporaryFileManager


class TestFileManager:
    @pytest.fixture
    def manager(self, tmp_path):
        return TemporaryFileManager(str(tmp_path))

    def test_create_temp_path_suffix(self, manager):
        path = manager.create_temp_path(prefix="test_", suffix=".jpg")
        assert path.endswith(".jpg")
        assert "test_" in path

    def test_safe_temp_path_extension(self, manager):
        path = manager.safe_temp_path("image.png", prefix="safe_")
        assert path.endswith(".png")
        assert "safe_" in path

    def test_cleanup_existing_file(self, manager):
        path = manager.create_temp_path(prefix="clean_", suffix=".txt")
        Path(path).write_text("test")
        assert Path(path).exists()
        manager.cleanup(path)
        assert not Path(path).exists()

    def test_cleanup_nonexistent_file(self, manager):
        manager.cleanup("/nonexistent/path/file.txt")

    def test_cleanup_empty_path(self, manager):
        manager.cleanup("")
