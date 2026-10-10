import pytest
from app.retrieval.citation_manager import CitationManager

def test_citation_creation():
    passages = [
        {
            "document_id": "doc-123",
            "title": "WHO Diabetes Guidelines",
            "publisher": "WHO",
            "page_number": 2,
            "content": "Fasting blood sugar above 126 mg/dL is a diagnostic indicator.",
            "hybrid_score": 0.89,
            "trust_tier": "trusted_knowledge"
        }
    ]

    citations = CitationManager.create_citations(passages)
    assert len(citations) == 1
    assert citations[0].document_title == "WHO Diabetes Guidelines"
    assert citations[0].page_number == 2
    assert citations[0].publisher == "WHO"
    assert "126 mg/dL" in citations[0].snippet

def test_citation_markdown_formatting():
    passages = [
        {
            "document_id": "doc-123",
            "title": "WHO Diabetes Guidelines",
            "publisher": "WHO",
            "page_number": 2,
            "content": "Fasting blood sugar above 126 mg/dL is a diagnostic indicator.",
            "source_url": "https://who.int/diabetes",
            "hybrid_score": 0.89,
            "trust_tier": "trusted_knowledge"
        }
    ]
    citations = CitationManager.create_citations(passages)
    md = CitationManager.format_citations_markdown(citations)
    assert "### 📚 Citations & Verified Sources" in md
    assert "[cite-1] WHO Diabetes Guidelines" in md
    assert "https://who.int/diabetes" in md
