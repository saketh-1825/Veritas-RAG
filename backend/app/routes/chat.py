import time
import logging
import json
from fastapi import APIRouter, Depends, BackgroundTasks
from app.auth.dependencies import get_current_user
from app.database.mongo import get_db
from app.models.user import UserInDB
from app.models.evaluation import EvaluationInDB
from app.models.chat import ChatRequest, ChatResponse, EvaluationMetrics
from app.services.rag_service import RetrievalService
from app.services.rag_service import LLMService
from app.evaluation.ragas_eval import EvaluationService
logger = logging.getLogger("rag_pipeline")
router = APIRouter(prefix="/api/chat", tags=["chat"])
async def run_evaluation_and_save_background(req_message: str, answer: str, chunks: list, llm_service_gemini_key: str, llm_service_openai_key: str, eval_data: dict, db):
    try:
        overall_score = round(
            (
                eval_data["faithfulness"]
                + eval_data["answer_relevance"]
                + eval_data["context_precision"]
                + eval_data["context_recall"]
            )
            / 4.0,
            4,
        )
        model_name = "Mock"
        if llm_service_openai_key:
            model_name = "gpt-4o-mini"
        elif llm_service_gemini_key:
            model_name = "gemini-2.5-flash"
        retrieved_context_str = json.dumps(
            [
                {
                    "filename": c.filename,
                    "chunk_index": c.chunk_index,
                    "score": float(c.score),
                    "text": c.text,
                }
                for c in chunks
            ]
        )
        eval_record = EvaluationInDB(
            user_query=req_message,
            retrieved_context=retrieved_context_str,
            ai_response=answer,
            faithfulness_score=eval_data["faithfulness"],
            answer_relevance_score=eval_data["answer_relevance"],
            context_precision_score=eval_data["context_precision"],
            context_recall_score=eval_data["context_recall"],
            overall_score=overall_score,
            evaluation_framework=eval_data["framework"],
            model_name=model_name,
            latency_ms=eval_data["latency_ms"],
        )
        eval_dict = eval_record.model_dump(by_alias=True)
        await db["evaluations"].insert_one(eval_dict)
        logger.info("Evaluation record saved to DB in background with ID: %s", eval_record.id)
    except Exception as e:
        logger.error("Background evaluation failed: %s", str(e))
@router.post("", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    background_tasks: BackgroundTasks,
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_db),
) -> ChatResponse:
    start_time = time.perf_counter()
    logger.info(
        "Chat request received from user %s: message='%s', document_id=%s, top_k=%d",
        current_user.username,
        req.message,
        req.document_id,
        req.top_k,
    )
    retrieval_service = RetrievalService()
    try:
        chunks = await retrieval_service.retrieve(
            query=req.message,
            top_k=req.top_k,
            document_id=req.document_id,
        )
        logger.info("Retrieved %d matching chunks for query", len(chunks))
    except Exception as e:
        logger.error("Error during retrieval phase of RAG: %s", str(e))
        chunks = []
    llm_service = LLMService()
    try:
        answer = await llm_service.generate_answer(
            query=req.message,
            chunks=chunks,
        )
    except Exception as e:
        logger.error("Error during generation phase of RAG: %s", str(e))
        answer = f"An error occurred while generating the answer: {str(e)}"
    end_generation_time = time.perf_counter()
    generation_latency = round(end_generation_time - start_time, 4)
    eval_service = EvaluationService()
    try:
        eval_data = await eval_service.evaluate(
            query=req.message,
            answer=answer,
            chunks=chunks,
        )
    except Exception as e:
        logger.error(f"Inline evaluation failed: {e}")
        has_chunks = len(chunks) > 0
        eval_data = {
            "faithfulness": 0.0,
            "answer_relevance": 0.0,
            "context_precision": 0.0,
            "context_recall": 0.0,
            "latency_ms": 0.0,
            "framework": "Failed Fallback"
        }
    background_tasks.add_task(
        run_evaluation_and_save_background,
        req.message,
        answer,
        chunks,
        llm_service.gemini_key,
        llm_service.openai_key,
        eval_data,
        db
    )
    evaluation_metrics = EvaluationMetrics(
        faithfulness=eval_data["faithfulness"],
        answer_relevance=eval_data["answer_relevance"],
        context_precision=eval_data["context_precision"],
        context_recall=eval_data["context_recall"],
        latency_ms=eval_data["latency_ms"],
    )
    return ChatResponse(
        answer=answer,
        citations=chunks,
        response_time=generation_latency,
        evaluation=evaluation_metrics,
    )