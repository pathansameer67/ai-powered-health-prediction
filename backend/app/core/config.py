from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_REPO_ROOT = _BACKEND_DIR.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(_REPO_ROOT / ".env", _BACKEND_DIR / ".env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "AI Healthcare Information Assistant"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Base Paths
    BASE_DIR: Path = _BACKEND_DIR
    DATA_DIR: Path = BASE_DIR / "data"
    UPLOAD_DIR: Path = DATA_DIR / "uploads"
    TRUSTED_DOCS_DIR: Path = DATA_DIR / "trusted_docs"
    CHROMA_PERSIST_DIR: Path = DATA_DIR / "chroma_db"
    
    # Database
    DATABASE_URL: str = f"sqlite+aiosqlite:///{DATA_DIR}/healthcare_assistant.db"

    # AI Model & Groq (current Groq model IDs)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    FALLBACK_GROQ_MODEL: str = "llama-3.1-8b-instant"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    # Document Processing & Chunker
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 100
    MAX_UPLOAD_SIZE_MB: int = 25
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".docx", ".txt", ".md"]

    # Safety & Jurisdictions
    DEFAULT_JURISDICTION: str = "IN"
    PAN_INDIA_EMERGENCY_NUMBER: str = "112"
    US_EMERGENCY_NUMBER: str = "911"
    UK_EMERGENCY_NUMBER: str = "999"

    # Security
    SECRET_KEY: str = "healthcare_ai_assistant_super_secret_key_2026_production_grade"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"]

settings = Settings()

# Ensure directories exist
for path in [settings.DATA_DIR, settings.UPLOAD_DIR, settings.TRUSTED_DOCS_DIR, settings.CHROMA_PERSIST_DIR]:
    path.mkdir(parents=True, exist_ok=True)
