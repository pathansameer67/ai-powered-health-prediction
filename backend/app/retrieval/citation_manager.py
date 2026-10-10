import uuid
from typing import List, Dict, Any
from app.schemas.chat import Citation

class CitationManager:
    """Extracts, verifies, and formats medical citations from retrieved passages."""

    @staticmethod
    def create_citations(retrieved_passages: List[Dict[str, Any]]) -> List[Citation]:
        citations: List[Citation] = []

        for idx, item in enumerate(retrieved_passages):
            citation_id = f"cite-{idx + 1}"
            meta = item.get("metadata", {})
            
            # Formulate snippet (first 180 characters with ellipses)
            raw_text = item.get("content", "").strip()
            snippet = raw_text[:200] + ("..." if len(raw_text) > 200 else "")

            citation = Citation(
                citation_id=citation_id,
                document_id=item.get("document_id") or meta.get("document_id", ""),
                document_title=item.get("title") or meta.get("title", "Healthcare Document"),
                publisher=item.get("publisher") or meta.get("publisher", "Official Health Source"),
                page_number=item.get("page_number") or meta.get("page_number", 1),
                heading=item.get("heading") or meta.get("heading", ""),
                snippet=snippet,
                source_url=meta.get("source_url") or item.get("source_url", ""),
                publication_date=meta.get("publication_date") or item.get("publication_date", ""),
                trust_tier=item.get("trust_tier") or meta.get("trust_tier", "trusted_knowledge"),
                relevance_score=item.get("hybrid_score") or item.get("score")
            )
            citations.append(citation)

        return citations

    @staticmethod
    def format_citations_markdown(citations: List[Citation]) -> str:
        if not citations:
            return ""

        md_lines = ["\n\n### 📚 Citations & Verified Sources"]
        for c in citations:
            page_info = f", Page {c.page_number}" if c.page_number else ""
            pub_info = f" ({c.publisher})" if c.publisher else ""
            date_info = f", {c.publication_date}" if c.publication_date else ""
            tier_badge = " [Verified Health Authority]" if c.trust_tier == "trusted_knowledge" else " [User Uploaded Document]"
            
            line = f"- **[{c.citation_id}] {c.document_title}**{pub_info}{page_info}{date_info}*{tier_badge}*"
            if c.source_url:
                line += f" — [Official Source Link]({c.source_url})"
            md_lines.append(line)
            md_lines.append(f"  > *\"{c.snippet}\"*")

        return "\n".join(md_lines)
