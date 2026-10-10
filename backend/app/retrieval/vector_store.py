import os
import shutil
from typing import List, Dict, Any, Optional
import numpy as np
import chromadb
from sklearn.feature_extraction.text import HashingVectorizer
from app.core.config import settings

class LocalDenseVectorizer:
    """
    Fast, deterministic 384-dimensional dense text vectorizer.
    Zero external downloads, sublinear word & character n-grams, L2 normalized.
    """
    def __init__(self, n_features: int = 384):
        self.vectorizer = HashingVectorizer(
            n_features=n_features,
            norm='l2',
            alternate_sign=False,
            ngram_range=(1, 2)
        )

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        matrix = self.vectorizer.transform(texts)
        return matrix.toarray().astype(float).tolist()

    def embed_query(self, text: str) -> List[float]:
        matrix = self.vectorizer.transform([text])
        return matrix.toarray().astype(float).tolist()[0]

class VectorStoreManager:
    """Manages persistent ChromaDB vector store with direct dense vector embeddings."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(VectorStoreManager, cls).__new__(cls)
            cls._instance._init_store()
        return cls._instance

    def _init_store(self):
        persist_dir = str(settings.CHROMA_PERSIST_DIR.resolve())
        os.makedirs(persist_dir, exist_ok=True)
        
        self.embedder = LocalDenseVectorizer(n_features=384)
        self.client = chromadb.PersistentClient(path=persist_dir)
        
        # We create a collection without default embedding function since we pass embeddings explicitly
        self.collection = self.client.get_or_create_collection(
            name="healthcare_knowledge_base",
            metadata={"hnsw:space": "cosine"}
        )

    def reset_collection(self):
        """Drop and recreate the collection so reseeding does not leave stale vectors."""
        try:
            self.client.delete_collection("healthcare_knowledge_base")
        except Exception:
            pass
        self.collection = self.client.get_or_create_collection(
            name="healthcare_knowledge_base",
            metadata={"hnsw:space": "cosine"}
        )

    def add_chunks(
        self,
        document_id: str,
        chunks: List[Dict[str, Any]],
        doc_metadata: Dict[str, Any]
    ) -> List[str]:
        """Index chunks into ChromaDB with explicit dense vector embeddings and rich metadata."""
        if not chunks:
            return []

        ids = []
        documents = []
        metadatas = []

        for chunk in chunks:
            vector_id = f"{document_id}_chunk_{chunk['chunk_index']}"
            ids.append(vector_id)
            documents.append(chunk["content"])

            meta = {
                "document_id": document_id,
                "chunk_index": int(chunk["chunk_index"]),
                "page_number": int(chunk.get("page_number") or 1),
                "heading": str(chunk.get("heading") or ""),
                "title": str(doc_metadata.get("title") or ""),
                "publisher": str(doc_metadata.get("publisher") or "Approved Source"),
                "trust_tier": str(doc_metadata.get("trust_tier") or "private_upload"),
                "user_id": str(doc_metadata.get("user_id") or "public"),
                "publication_date": str(doc_metadata.get("publication_date") or ""),
                "source_url": str(doc_metadata.get("source_url") or "")
            }
            metadatas.append(meta)

        # Generate vectors explicitly
        embeddings = self.embedder.embed_documents(documents)

        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )
        return ids

    def query_similar(
        self,
        query: str,
        top_k: int = 5,
        filter_dict: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Query vector database using explicit dense query embeddings."""
        where_filter = None
        if filter_dict:
            filter_items = [{k: {"$eq": v}} for k, v in filter_dict.items() if v is not None]
            if len(filter_items) == 1:
                where_filter = filter_items[0]
            elif len(filter_items) > 1:
                where_filter = {"$and": filter_items}

        try:
            available = self.collection.count()
            if available == 0:
                return []
            query_vector = self.embedder.embed_query(query)
            results = self.collection.query(
                query_embeddings=[query_vector],
                n_results=min(top_k, available),
                where=where_filter,
                include=["documents", "metadatas", "distances"]
            )

            hits: List[Dict[str, Any]] = []
            if results and "documents" in results and results["documents"]:
                docs = results["documents"][0]
                metas = results["metadatas"][0]
                distances = results["distances"][0]
                ids = results["ids"][0]

                for doc, meta, dist, vid in zip(docs, metas, distances, ids):
                    sim_score = max(0.0, min(1.0, 1.0 - float(dist)))
                    hits.append({
                        "vector_id": vid,
                        "content": doc,
                        "metadata": meta,
                        "score": round(sim_score, 4),
                        "page_number": meta.get("page_number", 1),
                        "heading": meta.get("heading", ""),
                        "title": meta.get("title", ""),
                        "publisher": meta.get("publisher", ""),
                        "trust_tier": meta.get("trust_tier", ""),
                        "document_id": meta.get("document_id", "")
                    })
            return hits

        except Exception as e:
            return []

    def delete_document(self, document_id: str):
        try:
            self.collection.delete(where={"document_id": document_id})
        except Exception:
            pass

    def count_vectors(self) -> int:
        return self.collection.count()
