"""Download SMPL-X model files into /app/models/smplx/.

Usage
-----
    python scripts/setup_smplx.py

The script looks for the model in this order:
  1. Already present at the target path → skip.
  2. SMPLX_MODEL_URL env var → download from that URL.
  3. Neither available → print instructions and exit 0
     (build continues; health check will report model as missing).

SMPL-X model files require free registration at:
  https://smpl-x.is.tue.mpg.de/
After registering, download SMPLX_neutral.npz and upload it to a private
storage bucket, then set SMPLX_MODEL_URL to a direct-download link.
"""

import os
import sys
import urllib.request
from pathlib import Path

SMPLX_MODEL_DIR = Path(os.environ.get("SMPLX_MODEL_DIR", "/app/models/smplx"))
SMPLX_MODEL_FILE = SMPLX_MODEL_DIR / "SMPLX_NEUTRAL.npz"
SMPLX_MODEL_URL = os.environ.get("SMPLX_MODEL_URL", "")


def _print_instructions() -> None:
    print(
        "\n"
        "=== SMPL-X model not found ===\n"
        "The SMPL-X parametric body model requires free registration.\n"
        "Steps:\n"
        "  1. Register at https://smpl-x.is.tue.mpg.de/\n"
        "  2. Download SMPLX_neutral.npz\n"
        "  3. Upload it to a private bucket and set SMPLX_MODEL_URL\n"
        "     to a direct-download link, OR mount the file at:\n"
        f"     {SMPLX_MODEL_FILE}\n"
        "\n"
        "The service will use a geometric body fallback until the model is available.\n"
    )


def download_model(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    print(f"Downloading SMPL-X model from {url} …")
    tmp = dest.with_suffix(".npz.tmp")
    try:
        urllib.request.urlretrieve(url, tmp)
        tmp.rename(dest)
        print(f"SMPL-X model saved to {dest}")
    except Exception as exc:
        if tmp.exists():
            tmp.unlink()
        raise RuntimeError(f"Download failed: {exc}") from exc


def main() -> None:
    print("=== SMPL-X Setup ===")

    if SMPLX_MODEL_FILE.exists():
        size_mb = SMPLX_MODEL_FILE.stat().st_size / 1_048_576
        print(f"SMPL-X model already present at {SMPLX_MODEL_FILE} ({size_mb:.1f} MB). Skipping.")
        return

    if SMPLX_MODEL_URL:
        download_model(SMPLX_MODEL_URL, SMPLX_MODEL_FILE)
    else:
        _print_instructions()

    print("=== SMPL-X setup complete ===")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"SMPL-X setup error (non-fatal): {exc}", file=sys.stderr)
        sys.exit(0)  # graceful failure — service uses geometric fallback
