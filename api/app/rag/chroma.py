import chromadb
from chromadb.config import Settings as ChromaSettings
from chromadb.utils import embedding_functions
import logging
import hashlib
from typing import List, Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class ChromaClient:
    def __init__(self):
        self.host = settings.CHROMA_HOST
        self.port = settings.CHROMA_PORT
        self.tenant = settings.CHROMA_TENANT
        self.database = settings.CHROMA_DATABASE
        self.embedding_model_name = settings.EMBEDDING_MODEL
        
        try:
            self.client = chromadb.HttpClient(
                host=self.host,
                port=self.port,
                settings=ChromaSettings(allow_reset=True)
            )
            # Use Chroma's lightweight default ONNX embedding model instead of heavy PyTorch
            self.embedding_fn = embedding_functions.DefaultEmbeddingFunction()
            logger.info(f"Connected to ChromaDB at {self.host}:{self.port}")
            self._ensure_collections()
        except Exception as e:
            logger.error(f"Failed to connect to ChromaDB: {e}")
            self.client = None

    def _ensure_collections(self):
        collections = [
            "threat_intelligence",
            "secure_coding_guidance",
            "attack_observations",
            "patch_knowledge",
            "incident_memory"
        ]
        for name in collections:
            try:
                self.client.get_or_create_collection(
                    name=name,
                    embedding_function=self.embedding_fn
                )
            except Exception as e:
                logger.error(f"Failed to create collection {name}: {e}")

    def generate_checksum(self, text: str) -> str:
        return hashlib.sha256(text.encode('utf-8')).hexdigest()

    def add_documents(self, collection_name: str, documents: List[str], metadatas: List[Dict[str, Any]], ids: List[str]):
        if not self.client:
            return
        collection = self.client.get_collection(collection_name, embedding_function=self.embedding_fn)
        collection.upsert(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )
        
    def query(self, collection_name: str, query_texts: List[str], n_results: int = 3, where: Optional[Dict] = None) -> Dict:
        if not self.client:
            return {"documents": [], "metadatas": [], "distances": []}
        collection = self.client.get_collection(collection_name, embedding_function=self.embedding_fn)
        return collection.query(
            query_texts=query_texts,
            n_results=n_results,
            where=where
        )

chroma_service = ChromaClient()
