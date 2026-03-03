import uuid
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from typing import Optional
class EvaluationBase(BaseModel):
    session_id: Optional[str] = None
    user_query: str
    retrieved_context: str
    ai_response: str
    faithfulness_score: float
    answer_relevance_score: float
    context_precision_score: float
    context_recall_score: float = 0.0
    overall_score: float
    evaluation_framework: str
    model_name: Optional[str] = None
    latency_ms: Optional[float] = None
    token_usage: Optional[int] = None
    estimated_cost: Optional[float] = None
class EvaluationInDB(EvaluationBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
class EvaluationResponse(EvaluationBase):
    id: str
    created_at: datetime