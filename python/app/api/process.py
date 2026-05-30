
import structlog
from fastapi import APIRouter, File, HTTPException, UploadFile

from ..core.config import settings
from ..processors import (
    classify_garment,
    extract_dominant_colors,
    extract_metadata,
    generate_thumbnails,
    remove_background,
)
from ..utils.file_manager import TemporaryFileManager

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/process", tags=["process"])

file_manager = TemporaryFileManager(settings.upload_dir)


@router.post("/remove-bg")
async def api_remove_background(file: UploadFile = File(...)):
    input_path = file_manager.safe_temp_path(file.filename or "image.png", "bg_")
    try:
        content = await file.read()
        with open(input_path, "wb") as f:
            f.write(content)

        output_path, confidence = remove_background(input_path)

        return {
            "masked_image_url": output_path,
            "confidence": confidence,
        }
    except Exception as e:
        logger.error("remove_bg_failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Background removal failed: {str(e)}")
    finally:
        file_manager.cleanup(input_path)


@router.post("/colors")
async def api_extract_colors(file: UploadFile = File(...)):
    input_path = file_manager.safe_temp_path(file.filename or "image.png", "color_")
    try:
        content = await file.read()
        with open(input_path, "wb") as f:
            f.write(content)

        colors = extract_dominant_colors(input_path)

        return {
            "dominant_colors": colors,
            "palette_hex": [c["hex"] for c in colors],
        }
    except Exception as e:
        logger.error("color_extraction_failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Color extraction failed: {str(e)}")
    finally:
        file_manager.cleanup(input_path)


@router.post("/thumbnail")
async def api_generate_thumbnail(file: UploadFile = File(...)):
    input_path = file_manager.safe_temp_path(file.filename or "image.png", "thumb_")
    try:
        content = await file.read()
        with open(input_path, "wb") as f:
            f.write(content)

        result = generate_thumbnails(input_path)

        return result
    except Exception as e:
        logger.error("thumbnail_failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Thumbnail generation failed: {str(e)}")
    finally:
        file_manager.cleanup(input_path)


@router.post("/metadata")
async def api_extract_metadata(file: UploadFile = File(...)):
    input_path = file_manager.safe_temp_path(file.filename or "image.png", "meta_")
    try:
        content = await file.read()
        with open(input_path, "wb") as f:
            f.write(content)

        metadata = extract_metadata(input_path)

        return metadata
    except Exception as e:
        logger.error("metadata_extraction_failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Metadata extraction failed: {str(e)}")
    finally:
        file_manager.cleanup(input_path)


@router.post("/classify")
async def api_classify(file: UploadFile = File(...)):
    input_path = file_manager.safe_temp_path(file.filename or "image.png", "class_")
    try:
        content = await file.read()
        with open(input_path, "wb") as f:
            f.write(content)

        classification = classify_garment(input_path)

        return classification
    except Exception as e:
        logger.error("classification_failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Classification failed: {str(e)}")
    finally:
        file_manager.cleanup(input_path)
