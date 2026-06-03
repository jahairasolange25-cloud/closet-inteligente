import os
import sys
import urllib.request
import zipfile
import shutil
from pathlib import Path

PIFUHD_REPO = "https://github.com/facebookresearch/pifuhd/archive/refs/heads/main.zip"
PIFUHD_MODEL = "https://dl.fbaipublicfiles.com/pifuhd/checkpoints/pifuhd.pt"
PIFUHD_DIR = Path(__file__).resolve().parent.parent / "pifuhd"
PIFUHD_CHECKPOINT_DIR = PIFUHD_DIR / "checkpoints"
PIFUHD_CHECKPOINT_PATH = PIFUHD_CHECKPOINT_DIR / "pifuhd.pt"


def download_and_extract_repo():
    if PIFUHD_DIR.exists() and (PIFUHD_DIR / "apps").exists():
        print(f"PIFuHD directory already exists at {PIFUHD_DIR}, skipping clone.")
        return

    zip_path = PIFUHD_DIR.parent / "pifuhd_main.zip"
    print("Downloading PIFuHD repository...")
    urllib.request.urlretrieve(PIFUHD_REPO, zip_path)

    print("Extracting PIFuHD repository...")
    tmp_dir = PIFUHD_DIR.parent / "pifuhd_tmp_extract"
    if tmp_dir.exists():
        shutil.rmtree(str(tmp_dir), ignore_errors=True)
    tmp_dir.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(str(zip_path), "r") as zf:
        zf.extractall(str(tmp_dir))

    extracted = tmp_dir / "pifuhd-main"
    if extracted.exists():
        if PIFUHD_DIR.exists():
            shutil.rmtree(str(PIFUHD_DIR), ignore_errors=True)
        shutil.copytree(str(extracted), str(PIFUHD_DIR))
        shutil.rmtree(str(tmp_dir), ignore_errors=True)

    zip_path.unlink(missing_ok=True)
    print(f"PIFuHD repository ready at {PIFUHD_DIR}")


def download_checkpoint():
    PIFUHD_CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)

    if PIFUHD_CHECKPOINT_PATH.exists():
        print(f"Checkpoint already exists at {PIFUHD_CHECKPOINT_PATH}, skipping.")
        return

    print("Downloading PIFuHD pretrained checkpoint (~350MB)...")
    urllib.request.urlretrieve(PIFUHD_MODEL, PIFUHD_CHECKPOINT_PATH)
    print(f"Checkpoint saved at {PIFUHD_CHECKPOINT_PATH}")


def ensure_data_dirs():
    (PIFUHD_DIR / "data").mkdir(parents=True, exist_ok=True)
    (PIFUHD_DIR / "results").mkdir(parents=True, exist_ok=True)


def main():
    print("=== PIFuHD Setup ===")
    download_and_extract_repo()
    download_checkpoint()
    ensure_data_dirs()
    print("=== PIFuHD setup complete ===")


if __name__ == "__main__":
    main()
