from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "app-api"
    app_env: str = "dev"
    app_debug: bool = True
    app_version: str = "0.1.0"
    api_v1_prefix: str = "/api/v1"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/app_api"
    database_echo: bool = False
    auto_create_tables: bool = True
    jwt_secret_key: str = "change-this-secret-in-env"
    jwt_algorithm: str = "HS256"
    assistant_ai_enabled: bool = True
    assistant_ai_provider: str = "openai"
    assistant_ai_model: str = "gpt-4o-mini"
    assistant_ai_api_key: str = ""
    assistant_ai_base_url: str | None = None
    assistant_ai_timeout_seconds: float = 20.0
    assistant_ai_temperature: float = 0.2
    push_notifications_enabled: bool = True
    push_tick_seconds: int = 30
    push_default_timezone: str = "Europe/Madrid"
    push_expo_url: str = "https://exp.host/--/api/v2/push/send"
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_from_name: str = "Equipo de salud"
    smtp_use_tls: bool = True
    smtp_use_ssl: bool = False
    smtp_timeout_seconds: float = 15.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
