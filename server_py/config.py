import os
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    NODE_ENV: str = os.getenv("NODE_ENV", "development")
    
    class Config:
        env_file = ".env"
        extra = "allow"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
