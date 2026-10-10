import os
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.ingestion.extractors import DocumentExtractor, DocumentExtractionError
from app.ingestion.chunker import DocumentChunker
from app.retrieval.vector_store import VectorStoreManager
from app.models.db_models import Document, DocumentChunk, DocumentStatus, TrustTier
from app.core.config import settings

class IngestionPipeline:
    """End-to-end Document Ingestion, Chunking, and Vector Indexing Pipeline."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.chunker = DocumentChunker(chunk_size_words=settings.CHUNK_SIZE // 2, overlap_words=settings.CHUNK_OVERLAP // 2)
        self.vector_store = VectorStoreManager()

    async def process_document(
        self,
        document_id: str,
        filepath: str,
        title: str,
        user_id: Optional[str] = None,
        trust_tier: str = TrustTier.PRIVATE_UPLOAD.value,
        publisher: Optional[str] = None,
        source_url: Optional[str] = None,
        publication_date: Optional[str] = None,
        jurisdiction: str = "IN"
    ) -> Document:
        """Extract, chunk, persist to SQLite, and index in ChromaDB."""
        # 1. Fetch document record
        result = await self.db.execute(select(Document).where(Document.id == document_id))
        doc_record = result.scalar_one_or_none()
        if not doc_record:
            raise ValueError(f"Document {document_id} not found in database.")

        try:
            doc_record.status = DocumentStatus.PROCESSING.value
            await self.db.commit()

            # 2. Extract pages & metadata
            pages, meta = DocumentExtractor.extract(filepath)
            
            # 3. Chunk text with page-number preservation
            chunks = self.chunker.chunk_pages(pages)

            if not chunks:
                raise DocumentExtractionError("No readable text content found in document.")

            # 4. Remove any existing chunks in DB & Chroma
            self.vector_store.delete_document(document_id)

            # 5. Insert chunks into SQLite
            db_chunks = []
            raw_chunks_for_vector = []
            for chunk in chunks:
                vector_id = f"{document_id}_chunk_{chunk.chunk_index}"
                chunk_model = DocumentChunk(
                    document_id=document_id,
                    chunk_index=chunk.chunk_index,
                    page_number=chunk.page_number,
                    heading=chunk.heading,
                    content=chunk.content,
                    token_count=chunk.token_count,
                    vector_id=vector_id
                )
                db_chunks.append(chunk_model)
                raw_chunks_for_vector.append({
                    "chunk_index": chunk.chunk_index,
                    "content": chunk.content,
                    "page_number": chunk.page_number,
                    "heading": chunk.heading
                })

            self.db.add_all(db_chunks)

            # 6. Index into ChromaDB Vector Store
            doc_meta_payload = {
                "title": title,
                "publisher": publisher or ("Approved Medical Source" if trust_tier == TrustTier.TRUSTED_KNOWLEDGE.value else "Private User Upload"),
                "trust_tier": trust_tier,
                "user_id": user_id or "public",
                "publication_date": publication_date or "",
                "source_url": source_url or ""
            }

            self.vector_store.add_chunks(
                document_id=document_id,
                chunks=raw_chunks_for_vector,
                doc_metadata=doc_meta_payload
            )

            # 7. Update Document Record
            doc_record.status = DocumentStatus.INDEXED.value
            doc_record.status_message = "Successfully indexed into vector database."
            doc_record.total_pages = meta.get("total_pages", len(pages))
            doc_record.total_chunks = len(chunks)
            await self.db.commit()
            await self.db.refresh(doc_record)

            return doc_record

        except Exception as e:
            await self.db.rollback()
            result = await self.db.execute(select(Document).where(Document.id == document_id))
            doc_record = result.scalar_one_or_none()
            if doc_record:
                doc_record.status = DocumentStatus.FAILED.value
                doc_record.status_message = str(e)
                await self.db.commit()
            raise e
