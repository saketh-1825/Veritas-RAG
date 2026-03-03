import uuid
from datetime import datetime, timezone
from pydantic import BaseModel, Field
class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_path: str
    file_type: str
    size: int
    checksum: str
    upload_date: datetime
    processing_status: str
    chunk_count: int
    error_message: str | None
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True
class DocumentInDB(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    filename: str
    file_path: str
    file_type: str
    size: int
    checksum: str
    upload_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    processing_status: str
    chunk_count: int = 0
    error_message: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
class ReprocessRequest(BaseModel):
    chunk_size: int = Field(default=1000, ge=100, le=10000, description="Size of text chunks in characters")
    chunk_overlap: int = Field(default=200, ge=0, le=5000, description="Overlapping characters between adjacent chunks")
class RetrievalRequest(BaseModel):
    query: str = Field(..., min_length=1, description="The query string to search for")
    top_k: int = Field(default=4, ge=1, le=50, description="Number of results to return")
    document_id: str | None = Field(default=None, description="Optional document ID to restrict the search to")
class RetrievalChunk(BaseModel):
    text: str
    document_id: str
    filename: str
    score: float
    chunk_index: int
class RetrievalResponse(BaseModel):
    query: str
    results: list[RetrievalChunk]