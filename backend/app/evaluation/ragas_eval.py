import time
import logging
import math
import sys
from unittest.mock import MagicMock
from typing import Dict, Any, List
try:
    sys.modules['langchain_community.chat_models.vertexai'] = MagicMock()
except Exception:
    pass
from app.models.document import RetrievalChunk
from app.config.settings import settings
logger = logging.getLogger("rag_pipeline")
class EvaluationService:
    def __init__(self):
        self.gemini_key = settings.GEMINI_API_KEY
        self.groq_key = settings.GROQ_API_KEY
        if self.groq_key:
            from langchain_groq import ChatGroq
            from langchain_google_genai import GoogleGenerativeAIEmbeddings
            self.llm = ChatGroq(
                model="allam-2-7b",
                api_key=self.groq_key
            )
            self.embeddings = GoogleGenerativeAIEmbeddings(
                model="models/gemini-embedding-001",
                google_api_key=self.gemini_key
            )
        elif self.gemini_key:
            from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-1.5-flash", 
                google_api_key=self.gemini_key
            )
            self.embeddings = GoogleGenerativeAIEmbeddings(
                model="models/gemini-embedding-001",
                google_api_key=self.gemini_key
            )
        else:
            self.llm = None
            self.embeddings = None
    async def evaluate(self, query: str, answer: str, chunks: List[RetrievalChunk]) -> Dict[str, Any]:
        start_time = time.perf_counter()
        if not self.llm or not chunks:
            logger.info("No active LLM or no chunks. Returning mock evaluation scores.")
            has_chunks = len(chunks) > 0
            return {
                "faithfulness": 0.0,
                "answer_relevance": 0.0,
                "context_precision": 0.0,
                "context_recall": 0.0,
                "latency_ms": round((time.perf_counter() - start_time) * 1000, 2),
                "framework": "Simulated"
            }
        contexts = "\n\n".join([f"[{i+1}] {c.text}" for i, c in enumerate(chunks)])
        prompt = f"""
You are an expert AI evaluator. Evaluate the following RAG system outputs based on the provided context, user query, and generated answer.
Score the following four metrics on a scale from 0.0 to 1.0.

1. faithfulness: How factually accurate the answer is based *only* on the provided context.
2. answer_relevance: How directly the answer addresses the user's query.
3. context_precision: How well the provided context supports the answer (are the retrieved chunks relevant to the query).
4. context_recall: How well the answer covers all relevant information from the context.

Provide the scores in a strict JSON format exactly like this, with no extra text or markdown formatting:
{{
    "faithfulness": 0.8,
    "answer_relevance": 0.9,
    "context_precision": 0.7,
    "context_recall": 0.6
}}

User Query: {query}

Generated Answer: {answer}

Retrieved Contexts:
{contexts}
"""
        import json
        from langchain_core.messages import HumanMessage
        try:
            logger.info("Running live LLM evaluation...")
            response = await self.llm.ainvoke([HumanMessage(content=prompt)])
            content = response.content
            
            import re
            match = re.search(r'\{.*\}', content, re.DOTALL)
            if match:
                content = match.group(0)
            else:
                raise ValueError("No JSON object found in response.")
                
            scores = json.loads(content)
            f_score = float(scores.get("faithfulness", 0.0))
            ar_score = float(scores.get("answer_relevance", 0.0))
            cp_score = float(scores.get("context_precision", 0.0))
            cr_score = float(scores.get("context_recall", 0.0))
            framework = "Live LLM Eval"
        except Exception as e:
            logger.error(f"Live eval failed: {e}")
            f_score, ar_score, cp_score, cr_score = 0.0, 0.0, 0.0, 0.0
            framework = "Simulated Fallback"
        end_time = time.perf_counter()
        latency_ms = round((end_time - start_time) * 1000, 2)
        return {
            "faithfulness": max(0.0, min(1.0, f_score)),
            "answer_relevance": max(0.0, min(1.0, ar_score)),
            "context_precision": max(0.0, min(1.0, cp_score)),
            "context_recall": max(0.0, min(1.0, cr_score)),
            "latency_ms": latency_ms,
            "framework": framework
        }