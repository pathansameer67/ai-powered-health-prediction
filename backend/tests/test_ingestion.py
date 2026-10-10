import pytest
import os
import tempfile
from pathlib import Path
from app.ingestion.extractors import DocumentExtractor, DocumentExtractionError, ExtractedPage
from app.ingestion.chunker import DocumentChunker

def test_extract_txt_file():
    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False, encoding="utf-8") as f:
        f.write("Clinical Guide Header\nThis is a sample medical paragraph.\nSecond sentence about hypertension.")
        temp_path = f.name

    try:
        pages, meta = DocumentExtractor.extract(temp_path)
        assert len(pages) == 1
        assert "Clinical Guide Header" in pages[0].text
        assert meta["format"] == "TXT"
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

def test_extract_empty_file_fails():
    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
        temp_path = f.name

    try:
        with pytest.raises(DocumentExtractionError):
            DocumentExtractor.extract(temp_path)
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

def test_chunker_page_preservation():
    chunker = DocumentChunker(chunk_size_words=10, overlap_words=2)
    pages = [
        ExtractedPage(page_number=1, text="Word " * 25, heading="Page One Header"),
        ExtractedPage(page_number=2, text="Word " * 15, heading="Page Two Header")
    ]
    chunks = chunker.chunk_pages(pages)
    assert len(chunks) >= 3
    # Verify page numbers match source
    assert chunks[0].page_number == 1
    assert chunks[-1].page_number == 2
    assert chunks[0].heading == "Page One Header"

def test_extract_txt_page_markers():
    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False, encoding="utf-8") as f:
        f.write("[Page 1] Fasting glucose >= 126 mg/dL.\n[Page 2] DASH diet sodium under 5 grams.")
        temp_path = f.name

    try:
        pages, meta = DocumentExtractor.extract(temp_path)
        assert meta["total_pages"] == 2
        assert pages[0].page_number == 1
        assert "126 mg/dL" in pages[0].text
        assert pages[1].page_number == 2
        assert "DASH" in pages[1].text
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
