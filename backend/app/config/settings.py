"""
Application settings and configuration
"""
from pydantic_settings import BaseSettings
from typing import List
import os
import json

class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    
    # Gemini AI
    GEMINI_API_KEY: str = ""
    GEMINI_ENABLED: str = "true"  # Can disable Gemini to avoid quota issues (set to "false" in .env)
    
    @property
    def is_gemini_enabled(self) -> bool:
        """Check if Gemini is enabled"""
        return self.GEMINI_ENABLED.lower() in ("true", "1", "yes", "on")
    
    # CORS - stored as string, will be parsed to list
    # Accepts both comma-separated string or JSON array string
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    
    # Embeddings
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION: int = 384
    
    # Classification
    CLASSIFICATION_CONFIDENCE_THRESHOLD: float = 0.7
    
    # File upload
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_TYPES: List[str] = ["pdf", "csv"]
    
    def get_cors_origins(self) -> List[str]:
        """Parse CORS origins from string (comma-separated or JSON array)"""
        origins_str = self.CORS_ORIGINS.strip()
        
        # Try to parse as JSON array first
        if origins_str.startswith('[') and origins_str.endswith(']'):
            try:
                return json.loads(origins_str)
            except json.JSONDecodeError:
                pass
        
        # Otherwise, treat as comma-separated string
        return [origin.strip() for origin in origins_str.split(',') if origin.strip()]
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields in env file

settings = Settings()

