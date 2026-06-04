import os
from typing import Literal, Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "closet-ai"
    app_version: str = "0.1.0"
    debug: bool = False
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
    host: str = "0.0.0.0"
    port: int = int(os.environ.get("PORT", os.environ.get("AI_PORT", "5100")))
    upload_dir: str = "/app/uploads/temp"
    output_dir: str = "/app/uploads/processed"
    max_file_size_mb: int = 50
    pipeline_timeout_seconds: int = 120
    step_timeout_seconds: int = 30
    cors_origins: str = "http://localhost:3000,http://localhost:4000"
    model_dir: str = "/app/models"

    retry_max_attempts: int = 3
    retry_base_delay_ms: int = 1000
    confidence_threshold: float = 0.5
    thumbnail_webp_quality: int = 85
    thumbnail_sizes: str = "300,800,1200"
    cancellation_redis_url: Optional[str] = None

    pifuhd_enabled: bool = True
    pifuhd_mesh_resolution: int = 512
    pifuhd_model_dir: str = "/app/models/pifuhd"

    # SMPL-X parametric body model (optional — geometric fallback used if absent)
    smplx_model_dir: str = "/app/models/smplx"
    smplx_model_url: str = ""  # set to a direct-download URL to auto-fetch at build time

    # AI cascade — LLM API keys (all optional; service degrades gracefully)
    # Tier 2: Gemini Flash — free tier from aistudio.google.com (60 req/min)
    gemini_api_key: Optional[str] = None
    # Tier 3: Groq — free tier from console.groq.com (30 req/min, Llama 3 70B)
    groq_api_key: Optional[str] = None
    # Tier 4: OpenAI GPT-4o mini — paid fallback (~$0.15/1M tokens)
    openai_api_key: Optional[str] = None

    # CLIP confidence threshold — below this, heuristic is also consulted
    clip_confidence_threshold: float = 0.50

    model_config = {"env_prefix": "AI_", "env_file": ".env", "extra": "ignore"}

    @property
    def thumbnail_size_list(self) -> list[int]:
        return [int(s.strip()) for s in self.thumbnail_sizes.split(",") if s.strip()]


settings = Settings()
