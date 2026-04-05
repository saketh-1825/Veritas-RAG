import os
from pydantic_settings import BaseSettings, SettingsConfigDict
class Settings(BaseSettings):
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str = "http://localhost:5173"
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "ragdb"
    SECRET_KEY: str = "enterprise-rag-super-secret-jwt-encryption-key-32chars-minimum"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    UPLOAD_DIR: str = "uploads"
    PINECONE_API_KEY: str = ""
    PINECONE_INDEX_NAME: str = "rag-index"
    EMBEDDING_PROVIDER: str = "gemini"
    EMBEDDING_MODEL: str = "models/gemini-embedding-001"
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )
settings = Settings()