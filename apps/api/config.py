from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    database_url: str = "sqlite+aiosqlite:///./golfiq.db"
    data_raw_dir: str = "../../data/raw"
    data_processed_dir: str = "../../data/processed"
    data_seed_dir: str = "../../data/seed"
    model_artifacts_dir: str = "../../models/artifacts"
    env: str = "development"

    @property
    def is_development(self) -> bool:
        return self.env.lower() == "development"

    @property
    def async_database_url(self) -> str:
        url = self.database_url
        if url.startswith("sqlite:///") and not url.startswith("sqlite+aiosqlite:///"):
            url = url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
        return url


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
