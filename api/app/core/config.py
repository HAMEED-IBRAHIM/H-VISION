import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    APP_ENV: str = "development"
    APP_SECRET_KEY: str
    DATABASE_URL: str
    CHROMA_HOST: str
    CHROMA_PORT: int
    CHROMA_TENANT: str = "default_tenant"
    CHROMA_DATABASE: str = "default_database"
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GEMINI_TIMEOUT_SECONDS: int = 30
    GEMINI_MAX_RETRIES: int = 3
    JWT_ACCESS_TOKEN_MINUTES: int = 15
    JWT_REFRESH_TOKEN_DAYS: int = 7
    INTERNAL_SERVICE_TOKEN: str
    ALLOWED_RED_TEAM_TARGETS: str = "target_app"
    RED_TEAM_MAX_REQUESTS: int = 200
    RED_TEAM_REQUESTS_PER_SECOND: int = 3
    RED_TEAM_MAX_CONCURRENCY: int = 2
    FRONTEND_URL: str = "http://localhost:5173"
    CORS_ORIGINS: str = "http://localhost,http://localhost:5173"
    
    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        
    @property
    def allowed_targets_list(self) -> List[str]:
        return [target.strip() for target in self.ALLOWED_RED_TEAM_TARGETS.split(",")]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
