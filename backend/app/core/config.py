from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache
import os


def _is_production() -> bool:
    """Detect Render (or any cloud) production environment."""
    return bool(
        os.environ.get("RENDER")              # Render sets this automatically
        or os.environ.get("RAILWAY_ENVIRONMENT")
        or os.environ.get("FLY_APP_NAME")
        or os.environ.get("PRODUCTION", "").lower() in ("1", "true", "yes")
    )


class Settings(BaseSettings):
    # ── AI Keys (primary) ─────────────────────────────────────────────────────
    gemini_api_key: str = Field(..., env="GEMINI_API_KEY")
    serper_api_key: str = Field(..., env="SERPER_API_KEY")

    # ── AI Keys (optional — fallback providers) ───────────────────────────────
    # Set GEMINI_API_KEY_2 for a fresh Gemini quota pool (different Google account)
    # Set GROQ_API_KEY to enable Groq/Llama-3.1 as the ultimate fallback
    gemini_api_key_2: str = Field(default="", env="GEMINI_API_KEY_2")
    groq_api_key: str     = Field(default="", env="GROQ_API_KEY")

    # ── Database ──────────────────────────────────────────────────────────────
    mongodb_uri: str      = Field(..., env="MONGODB_URI")
    mongodb_db_name: str  = "axiom"

    # ── CORS ──────────────────────────────────────────────────────────────────
    # Comma-separated list of allowed origins.
    # In development defaults to localhost:3000.
    # In production set ALLOWED_ORIGINS to your Vercel URL.
    allowed_origins: str = Field(
        default="http://localhost:3000", env="ALLOWED_ORIGINS"
    )

    # ── Timeouts (seconds) ────────────────────────────────────────────────────
    tool_timeout: int  = 15
    agent_timeout: int = 45
    crew_timeout: int  = 240   # increased buffer for deep research sessions

    # ── Rate-limit retry ──────────────────────────────────────────────────────
    max_retry_attempts: int = 3

    # ── App ───────────────────────────────────────────────────────────────────
    log_level: str  = Field(default="INFO", env="LOG_LEVEL")
    app_version: str = "1.0.0"

    # ── Derived ───────────────────────────────────────────────────────────────
    @property
    def is_production(self) -> bool:
        return _is_production()

    @property
    def origins_list(self) -> list[str]:
        origins = [o.strip() for o in self.allowed_origins.split(",") if o.strip()]
        # Always include localhost in development mode so local testing works
        if not self.is_production and "http://localhost:3000" not in origins:
            origins.append("http://localhost:3000")
        return origins

    @property
    def effective_log_level(self) -> str:
        """Verbose locally, concise in production unless overridden."""
        if self.is_production and self.log_level.upper() == "INFO":
            return "WARNING"
        return self.log_level.upper()

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
