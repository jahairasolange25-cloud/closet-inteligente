"""
/api/v1/ai — LLM cascade endpoints consumed by the NestJS CascadeService.
"""

from typing import Optional

import structlog
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..services.llm_cascade import llm_cascade

router = APIRouter(prefix="/ai", tags=["ai"])
logger = structlog.get_logger(__name__)


class DescribeRequest(BaseModel):
    category: str
    subcategory: Optional[str] = None
    colors: list[str] = []
    style_tags: Optional[list[str]] = None


class DescribeResponse(BaseModel):
    text: str
    source: str
    cached: bool


class StyleTagsRequest(BaseModel):
    description: str
    colors: list[str] = []


class StyleTagsResponse(BaseModel):
    tags: list[str]
    source: str
    cached: bool


class OutfitSuggestionRequest(BaseModel):
    anchor_garment: str
    wardrobe_summary: str
    context: Optional[str] = None


class OutfitSuggestionResponse(BaseModel):
    text: str
    source: str
    cached: bool


@router.post("/describe", response_model=DescribeResponse)
async def describe_garment(req: DescribeRequest) -> DescribeResponse:
    result = await llm_cascade.describe_garment(
        category=req.category,
        subcategory=req.subcategory,
        colors=req.colors,
        style_tags=req.style_tags,
    )
    if result.source == "unavailable":
        raise HTTPException(status_code=503, detail="All LLM tiers unavailable")
    return DescribeResponse(text=result.text, source=result.source, cached=result.cached)


@router.post("/style-tags", response_model=StyleTagsResponse)
async def generate_style_tags(req: StyleTagsRequest) -> StyleTagsResponse:
    result = await llm_cascade.generate_style_tags(
        description=req.description,
        colors=req.colors,
    )
    if result.source == "unavailable":
        raise HTTPException(status_code=503, detail="All LLM tiers unavailable")

    # Parse JSON array from LLM output
    tags: list[str] = []
    import json
    try:
        parsed = json.loads(result.text) if result.text else []
        if isinstance(parsed, list):
            tags = []
            for item in parsed:
                if isinstance(item, str):
                    tags.append(item)
                elif isinstance(item, dict):
                    for v in item.values():
                        if isinstance(v, str):
                            tags.append(v)
                            break
                    else:
                        tags.append(str(item))
                else:
                    tags.append(str(item))
    except (json.JSONDecodeError, ValueError):
        # LLM returned non-JSON — extract words
        tags = [t.strip().lower() for t in result.text.split(",") if t.strip()][:5]
    except Exception:
        tags = [t.strip().lower() for t in result.text.split(",") if t.strip()][:5]

    tags = [t.strip().lower().strip("[]\"'{}") for t in tags if isinstance(t, str)][:10]
    return StyleTagsResponse(tags=tags, source=result.source, cached=result.cached)


@router.post("/outfit-suggestion", response_model=OutfitSuggestionResponse)
async def suggest_outfit(req: OutfitSuggestionRequest) -> OutfitSuggestionResponse:
    result = await llm_cascade.suggest_outfit(
        anchor_garment=req.anchor_garment,
        wardrobe_summary=req.wardrobe_summary,
        context=req.context,
    )
    if result.source == "unavailable":
        raise HTTPException(status_code=503, detail="All LLM tiers unavailable")
    return OutfitSuggestionResponse(text=result.text, source=result.source, cached=result.cached)
