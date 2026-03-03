from pydantic import BaseModel, Field
from app.models.document import RetrievalChunk
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="The message/query from the user")
    document_id: str | None = Field(default=None, description="Optional document ID to restrict search to")
    top_k: int = Field(default=4, ge=1, le=50, description="Number of document chunks to retrieve")
class EvaluationMetrics(BaseModel):
    faithfulness: float = Field(..., description="Faithfulness score between 0.0 and 1.0")
    answer_relevance: float = Field(..., description="Answer relevance score between 0.0 and 1.0")
    context_precision: float = Field(..., description="Context precision score between 0.0 and 1.0")
    context_recall: float = Field(..., description="Context recall score between 0.0 and 1.0")
    latency_ms: float = Field(..., description="Evaluation latency in milliseconds")
class ChatResponse(BaseModel):
    answer: str = Field(..., description="The generated response from the LLM")
    citations: list[RetrievalChunk] = Field(default=[], description="The retrieved chunks used for answering")
    response_time: float = Field(..., description="The response time in seconds")
    evaluation: EvaluationMetrics | None = Field(default=None, description="Computed RAG evaluation metrics")