import shutil
import uuid
from pathlib import Path
from typing import Optional

import structlog

logger = structlog.get_logger(__name__)


class TemporaryFileManager:
    def __init__(self, base_dir: str):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def create_temp_path(self, prefix: str = "", suffix: str = ".png") -> str:
        filename = f"{prefix}{uuid.uuid4().hex}{suffix}"
        path = self.base_dir / filename
        return str(path)

    def safe_temp_path(self, original_filename: str, prefix: str = "") -> str:
        ext = Path(original_filename).suffix if original_filename else ".png"
        safe_name = f"{prefix}{uuid.uuid4().hex}{ext}"
        path = self.base_dir / safe_name
        return str(path)

    def cleanup(self, *paths: str) -> None:
        for p in paths:
            if not p:
                continue
            try:
                path = Path(p)
                if path.exists():
                    if path.is_file():
                        path.unlink(missing_ok=True)
                    elif path.is_dir():
                        shutil.rmtree(str(path), ignore_errors=True)
            except Exception as e:
                logger.warning("cleanup_failed", path=p, error=str(e))

    def cleanup_all(self, directory: Optional[str] = None) -> None:
        target = Path(directory) if directory else self.base_dir
        if target.exists():
            shutil.rmtree(str(target), ignore_errors=True)
            target.mkdir(parents=True, exist_ok=True)
