import os
from pydantic_settings import BaseSettings, SettingsConfigDict
class Settings(BaseSettings):
    PORT: int
    HOST: str
    ENVIRONMENT: str
    FRONTEND_URL: str
    OPENAI_API_KEY: str
    GEMINI_API_KEY: str
    GROQ_API_KEY: str
    MONGODB_URL: str
    DATABASE_NAME: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    UPLOAD_DIR: str
    PINECONE_API_KEY: str
    PINECONE_INDEX_NAME: str
    EMBEDDING_PROVIDER: str
    EMBEDDING_MODEL: str
    CHUNK_SIZE: int
    CHUNK_OVERLAP: int
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )
settings = Settings()