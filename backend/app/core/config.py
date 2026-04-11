from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache


class Settings(BaseSettings):
    # AI Keys
    gemini_api_key: str = Field(..., env="GEMINI_API_KEY")
    serper_api_key: str = Field(..., env="SERPER_API_KEY")

    # Database
    mongodb_uri: str = Field(..., env="MONGODB_URI")
    mongodb_db_name: str = "axiom"

    # CORS
    allowed_origins: str = Field(
        default="http://localhost:3000", env="ALLOWED_ORIGINS"
    )

    # Timeouts (seconds)
    tool_timeout: int = 15
    agent_timeout: int = 45
    crew_timeout: int = 120

    # Rate-limit retry
    max_retry_attempts: int = 3

    # App
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    app_version: str = "1.0.0"

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
