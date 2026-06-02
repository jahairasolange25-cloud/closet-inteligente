"""
LLM cascade service: Gemini Flash → Groq (Llama 3) → GPT-4o mini.

Tier 2 (Gemini Flash): Free — 60 req/min, 1500 req/day.
Tier 3 (Groq):         Free — 30 req/min, Llama 3 70B.
Tier 4 (GPT-4o mini):  Paid fallback, ~$0.15/1M tokens.

Results are cached in Redis by prompt hash so the same garment
description never triggers two API calls.
"""

import asyncio
import hashlib
import json
import logging
import time
from dataclasses import dataclass
from typing import Literal, Optional

from ..core.config import settings

logger = logging.getLogger(__name__)

LLMSource = Literal["gemini", "groq", "openai", "unavailable"]

REDIS_TTL_SECONDS = 60 * 60 * 24 * 7  # 7 days — LLM descriptions don't change


@dataclass
class LLMResult:
    text: str
    source: LLMSource
    latency_ms: float
    cached: bool = False


class LLMCascadeService:
    def __init__(self) -> None:
        self._redis: Optional[object] = None
        self._redis_lock = asyncio.Lock()

    # ------------------------------------------------------------------ #
    # Public API                                                           #
    # ------------------------------------------------------------------ #

    async def describe_garment(
        self,
        category: str,
        subcategory: Optional[str],
        colors: list[str],
        style_tags: Optional[list[str]] = None,
    ) -> LLMResult:
        """Generate a short human-friendly garment description (2-3 sentences)."""
        prompt = _build_garment_description_prompt(category, subcategory, colors, style_tags)
        return await self._run_with_cache(prompt, task="describe_garment")

    async def suggest_outfit(
        self,
        anchor_garment: str,
        wardrobe_summary: str,
        context: Optional[str] = None,
    ) -> LLMResult:
        """Suggest complementary items for a garment in natural language."""
        prompt = _build_outfit_suggestion_prompt(anchor_garment, wardrobe_summary, context)
        return await self._run_with_cache(prompt, task="suggest_outfit")

    async def generate_style_tags(
        self,
        description: str,
        colors: list[str],
    ) -> LLMResult:
        """Return a JSON list of style tags given a garment description."""
        prompt = _build_style_tags_prompt(description, colors)
        return await self._run_with_cache(prompt, task="style_tags")

    # ------------------------------------------------------------------ #
    # Core cascade                                                         #
    # ------------------------------------------------------------------ #

    async def _run_with_cache(self, prompt: str, task: str) -> LLMResult:
        cache_key = f"llm:{task}:{_hash(prompt)}"
        cached = await self._cache_get(cache_key)
        if cached:
            return LLMResult(text=cached["text"], source=cached["source"], latency_ms=0.0, cached=True)

        result = await self._cascade(prompt)
        if result.source != "unavailable":
            await self._cache_set(cache_key, {"text": result.text, "source": result.source})
        return result

    async def _cascade(self, prompt: str) -> LLMResult:
        # Tier 2 — Gemini Flash (free)
        if settings.gemini_api_key:
            try:
                return await _call_gemini(prompt, settings.gemini_api_key)
            except Exception as exc:
                logger.warning("Gemini failed, falling to Groq: %s", exc)

        # Tier 3 — Groq / Llama 3 (free)
        if settings.groq_api_key:
            try:
                return await _call_groq(prompt, settings.groq_api_key)
            except Exception as exc:
                logger.warning("Groq failed, falling to GPT-4o mini: %s", exc)

        # Tier 4 — GPT-4o mini (paid, last resort)
        if settings.openai_api_key:
            try:
                return await _call_openai(prompt, settings.openai_api_key)
            except Exception as exc:
                logger.error("All LLM tiers failed. Last error: %s", exc)

        return LLMResult(text="", source="unavailable", latency_ms=0.0)

    # ------------------------------------------------------------------ #
    # Redis cache helpers                                                  #
    # ------------------------------------------------------------------ #

    async def _get_redis(self) -> Optional[object]:
        if self._redis is not None:
            return self._redis
        if not settings.cancellation_redis_url:
            return None
        async with self._redis_lock:
            if self._redis is not None:
                return self._redis
            try:
                import redis.asyncio as aioredis
                self._redis = aioredis.from_url(
                    settings.cancellation_redis_url,
                    decode_responses=True,
                    socket_connect_timeout=2,
                )
                logger.info("LLM cascade connected to Redis")
            except Exception as exc:
                logger.warning("Redis unavailable for LLM cache: %s", exc)
        return self._redis

    async def _cache_get(self, key: str) -> Optional[dict]:
        r = await self._get_redis()
        if r is None:
            return None
        try:
            raw = await r.get(f"closet:{key}")  # type: ignore[union-attr]
            return json.loads(raw) if raw else None
        except Exception:
            return None

    async def _cache_set(self, key: str, value: dict) -> None:
        r = await self._get_redis()
        if r is None:
            return
        try:
            await r.set(f"closet:{key}", json.dumps(value), ex=REDIS_TTL_SECONDS)  # type: ignore[union-attr]
        except Exception:
            pass


# ------------------------------------------------------------------ #
# Provider implementations                                            #
# ------------------------------------------------------------------ #

async def _call_gemini(prompt: str, api_key: str) -> LLMResult:
    import httpx  # lazy
    t0 = time.monotonic()
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-1.5-flash:generateContent?key={api_key}"
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"maxOutputTokens": 256, "temperature": 0.4},
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()

    text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
    return LLMResult(text=text, source="gemini", latency_ms=round((time.monotonic() - t0) * 1000, 1))


async def _call_groq(prompt: str, api_key: str) -> LLMResult:
    import httpx  # lazy
    t0 = time.monotonic()
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": "llama3-70b-8192",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 256,
        "temperature": 0.4,
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        data = resp.json()

    text = data["choices"][0]["message"]["content"].strip()
    return LLMResult(text=text, source="groq", latency_ms=round((time.monotonic() - t0) * 1000, 1))


async def _call_openai(prompt: str, api_key: str) -> LLMResult:
    import httpx  # lazy
    t0 = time.monotonic()
    url = "https://api.openai.com/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 256,
        "temperature": 0.4,
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        data = resp.json()

    text = data["choices"][0]["message"]["content"].strip()
    return LLMResult(text=text, source="openai", latency_ms=round((time.monotonic() - t0) * 1000, 1))


# ------------------------------------------------------------------ #
# Prompt builders                                                     #
# ------------------------------------------------------------------ #

def _build_garment_description_prompt(
    category: str,
    subcategory: Optional[str],
    colors: list[str],
    style_tags: Optional[list[str]],
) -> str:
    label = subcategory or category.replace("_", " ")
    color_str = ", ".join(colors[:3]) if colors else "unknown color"
    tags_str = ", ".join(style_tags[:4]) if style_tags else ""
    return (
        f"Describe this clothing item in 2 short sentences for a wardrobe app. "
        f"Item: {label}. Colors: {color_str}. "
        + (f"Style: {tags_str}. " if tags_str else "")
        + "Be concise, friendly, and focus on how/when to wear it. No markdown."
    )


def _build_outfit_suggestion_prompt(
    anchor_garment: str,
    wardrobe_summary: str,
    context: Optional[str],
) -> str:
    ctx = f" Context: {context}." if context else ""
    return (
        f"I have this garment: {anchor_garment}.{ctx}\n"
        f"My wardrobe includes: {wardrobe_summary}.\n"
        "Suggest 2-3 specific items from my wardrobe that would pair well with it. "
        "Be brief and practical. No markdown."
    )


def _build_style_tags_prompt(description: str, colors: list[str]) -> str:
    color_str = ", ".join(colors[:3]) if colors else ""
    return (
        f"Given this garment: {description}. Colors: {color_str}.\n"
        'Return a JSON array of 3-5 lowercase style tags (e.g. ["casual","sporty","everyday"]). '
        "Only output the JSON array, nothing else."
    )


def _hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()[:16]


llm_cascade = LLMCascadeService()
