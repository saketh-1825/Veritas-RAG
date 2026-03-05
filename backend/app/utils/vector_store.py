import logging
from langchain_pinecone import PineconeVectorStore
from langchain_openai import OpenAIEmbeddings
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.embeddings import Embeddings
from pinecone import Pinecone
from app.config.settings import settings
logger = logging.getLogger("rag_pipeline")
class MockEmbeddings(Embeddings):
    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [[0.1] * 768 for _ in texts]
    def embed_query(self, text: str) -> list[float]:
        return [0.1] * 768
class VectorStoreManager:
    def __init__(self):
        self._embeddings = None
        self._pinecone = None
        if settings.PINECONE_API_KEY:
            self._pinecone = Pinecone(api_key=settings.PINECONE_API_KEY)
            self.index_name = settings.PINECONE_INDEX_NAME
        else:
            logger.warning("PINECONE_API_KEY is not set. Vector store will fail.")
    def get_embeddings(self) -> Embeddings:
        if self._embeddings is not None:
            return self._embeddings
        if settings.EMBEDDING_PROVIDER in ["google", "gemini"] and settings.GEMINI_API_KEY:
            logger.info("Using Gemini embeddings: %s", settings.EMBEDDING_MODEL)
            self._embeddings = GoogleGenerativeAIEmbeddings(
                google_api_key=settings.GEMINI_API_KEY,
                model=settings.EMBEDDING_MODEL
            )
        elif settings.EMBEDDING_PROVIDER == "openai" and settings.OPENAI_API_KEY:
            logger.info("Using OpenAI embeddings: %s", settings.EMBEDDING_MODEL)
            self._embeddings = OpenAIEmbeddings(
                openai_api_key=settings.OPENAI_API_KEY,
                model=settings.EMBEDDING_MODEL
            )
        else:
            logger.warning("No valid embedding provider configured. Falling back to MockEmbeddings for development.")
            self._embeddings = MockEmbeddings()
        return self._embeddings
    def get_vectorstore(self, collection_name: str = None) -> PineconeVectorStore:
        embeddings = self.get_embeddings()
        if not self._pinecone:
            raise Exception("Pinecone API key not configured in environment.")
        return PineconeVectorStore(
            index_name=self.index_name,
            embedding=embeddings,
            pinecone_api_key=settings.PINECONE_API_KEY
        )
    def delete_document_chunks(self, document_id: str, collection_name: str = None) -> None:
        try:
            vectorstore = self.get_vectorstore()
            vectorstore.delete(filter={"document_id": document_id})
            logger.info("Deleted chunks for document_id %s from Pinecone index %s", document_id, self.index_name)
        except Exception as e:
            logger.error("Failed to delete chunks for document %s from Pinecone: %s", document_id, str(e))
            raise e