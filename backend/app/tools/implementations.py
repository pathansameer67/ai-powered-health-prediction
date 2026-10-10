import json
from typing import Dict, List, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.retrieval.hybrid_retriever import HybridRetriever
from app.retrieval.citation_manager import CitationManager
from app.models.db_models import Document, DocumentChunk, TrustTier
from app.safety.escalation_policy import EscalationPolicy

class AgentTools:
    """Core 8 validated backend tools callable by the orchestrator."""

    def __init__(self, db: AsyncSession, user_id: Optional[str] = None):
        self.db = db
        self.user_id = user_id
        self.retriever = HybridRetriever()

    async def search_health_documents(
        self,
        query: str,
        top_k: int = 4,
        trust_tier: Optional[str] = None,
        document_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Tool 1: Search indexed health documents using hybrid semantic + keyword search."""
        filter_dict = {}
        if trust_tier:
            filter_dict["trust_tier"] = trust_tier
        if document_id:
            filter_dict["document_id"] = document_id

        results = self.retriever.retrieve(query=query, top_k=top_k, filter_dict=filter_dict or None)
        keyword_hits = await self._keyword_search_chunks(
            query=query,
            top_k=top_k,
            trust_tier=trust_tier,
            document_id=document_id
        )

        merged = []
        seen = set()
        for item in list(results) + keyword_hits:
            fingerprint = (item.get("content") or "")[:90].strip()
            if not fingerprint or fingerprint in seen:
                continue
            seen.add(fingerprint)
            merged.append(item)
            if len(merged) >= top_k:
                break

        passages = []
        for r in merged:
            passages.append({
                "title": r.get("title"),
                "publisher": r.get("publisher"),
                "page_number": r.get("page_number"),
                "heading": r.get("heading"),
                "content": r.get("content"),
                "score": r.get("hybrid_score", r.get("score")),
                "document_id": r.get("document_id"),
                "trust_tier": r.get("trust_tier"),
                "source_url": r.get("source_url") or (r.get("metadata") or {}).get("source_url"),
                "publication_date": r.get("publication_date") or (r.get("metadata") or {}).get("publication_date"),
            })

        return {
            "query": query,
            "count": len(passages),
            "passages": passages,
            "has_results": len(passages) > 0
        }

    async def filter_documents(
        self,
        trust_tier: Optional[str] = None,
        file_type: Optional[str] = None,
        publisher: Optional[str] = None
    ) -> Dict[str, Any]:
        """Tool 2: Filter and list available document metadata."""
        query = select(Document)
        if trust_tier:
            query = query.where(Document.trust_tier == trust_tier)
        if file_type:
            query = query.where(Document.file_type == file_type)
        if publisher:
            query = query.where(Document.publisher.ilike(f"%{publisher}%"))

        result = await self.db.execute(query)
        docs = result.scalars().all()

        return {
            "total": len(docs),
            "documents": [
                {
                    "id": d.id,
                    "title": d.title,
                    "publisher": d.publisher,
                    "trust_tier": d.trust_tier,
                    "total_pages": d.total_pages,
                    "status": d.status
                }
                for d in docs
            ]
        }

    async def get_document_metadata(self, document_id: str) -> Dict[str, Any]:
        """Tool 3: Get detailed metadata and chunk count for a specific document."""
        result = await self.db.execute(select(Document).where(Document.id == document_id))
        doc = result.scalar_one_or_none()
        if not doc:
            return {"error": f"Document {document_id} not found."}

        return {
            "id": doc.id,
            "title": doc.title,
            "publisher": doc.publisher,
            "trust_tier": doc.trust_tier,
            "status": doc.status,
            "total_pages": doc.total_pages,
            "total_chunks": doc.total_chunks,
            "publication_date": doc.publication_date,
            "source_url": doc.source_url,
            "jurisdiction": doc.jurisdiction
        }

    async def summarize_document(
        self,
        document_id: str,
        mode: str = "detailed"
    ) -> Dict[str, Any]:
        """Tool 4: Extract and prepare chunks of a document for summarization."""
        from app.services.summarizer import DocumentSummarizer
        summarizer = DocumentSummarizer(self.db)
        return await summarizer.summarize(document_id=document_id, mode=mode)

    async def explain_medical_term(
        self,
        term: str,
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """Tool 5: Explain a clinical term in plain, patient-friendly language."""
        # Retrieve medical context from indexed official sources
        results = self.retriever.retrieve(query=f"definition of {term} {context or ''}", top_k=2)
        source_context = " ".join([r.get("content", "") for r in results]) if results else ""

        return {
            "term": term,
            "evidence_context": source_context,
            "guidance": "Explain this term simply in plain language avoiding clinical jargon."
        }

    async def compare_sources(
        self,
        document_ids: List[str],
        topic: str
    ) -> Dict[str, Any]:
        """Tool 6: Compare passages from multiple healthcare documents on a specific topic."""
        passages_by_doc = {}
        for doc_id in document_ids:
            results = self.retriever.retrieve(
                query=topic,
                top_k=2,
                filter_dict={"document_id": doc_id}
            )
            passages_by_doc[doc_id] = [r.get("content") for r in results]

        return {
            "topic": topic,
            "documents_compared": len(document_ids),
            "evidence": passages_by_doc
        }

    async def assess_escalation(
        self,
        query: str,
        jurisdiction: str = "IN"
    ) -> Dict[str, Any]:
        """Tool 7: Assess clinical risk and emergency escalation status."""
        assessment = EscalationPolicy.evaluate_query(query, jurisdiction)
        return assessment.model_dump()

    async def format_citations(
        self,
        retrieved_passages: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Tool 8: Format structured citations from evidence items."""
        citations = CitationManager.create_citations(retrieved_passages)
        md = CitationManager.format_citations_markdown(citations)
        return {
            "citations": [c.model_dump() for c in citations],
            "markdown": md
        }

    async def _keyword_search_chunks(
        self,
        query: str,
        top_k: int,
        trust_tier: Optional[str] = None,
        document_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """BM25-style overlap search over SQLite chunks so retrieval still works if vectors are empty or weak."""
        stmt = select(DocumentChunk, Document).join(Document, DocumentChunk.document_id == Document.id)
        if document_id:
            stmt = stmt.where(Document.id == document_id)
        if trust_tier:
            stmt = stmt.where(Document.trust_tier == trust_tier)
        elif self.user_id:
            stmt = stmt.where(
                (Document.trust_tier == TrustTier.TRUSTED_KNOWLEDGE.value)
                | (Document.user_id == self.user_id)
                | (Document.user_id.is_(None))
            )
        else:
            stmt = stmt.where(Document.trust_tier == TrustTier.TRUSTED_KNOWLEDGE.value)

        result = await self.db.execute(stmt)
        rows = result.all()
        if not rows:
            return []

        terms = [t for t in query.lower().split() if len(t) > 2]
        scored: List[Dict[str, Any]] = []
        for chunk, doc in rows:
            text = (chunk.content or "").lower()
            score = sum(text.count(term) for term in terms)
            if score <= 0:
                continue
            scored.append({
                "title": doc.title,
                "publisher": doc.publisher,
                "page_number": chunk.page_number or 1,
                "heading": chunk.heading,
                "content": chunk.content,
                "hybrid_score": min(1.0, score / max(len(terms), 1)),
                "score": min(1.0, score / max(len(terms), 1)),
                "document_id": doc.id,
                "trust_tier": doc.trust_tier,
                "source_url": doc.source_url,
                "publication_date": doc.publication_date,
            })

        scored.sort(key=lambda x: x.get("hybrid_score", 0.0), reverse=True)
        return scored[:top_k]
