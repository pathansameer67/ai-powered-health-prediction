import os
from pathlib import Path
from typing import List, Dict, Any, Tuple
import hashlib

class DocumentExtractionError(Exception):
    pass

class ExtractedPage:
    def __init__(self, page_number: int, text: str, heading: str = ""):
        self.page_number = page_number
        self.text = text.strip()
        self.heading = heading

class DocumentExtractor:
    """Multi-format Document Text and Metadata Extractor preserving page numbers and structure."""

    @staticmethod
    def compute_sha256(filepath: str) -> str:
        hasher = hashlib.sha256()
        with open(filepath, "rb") as f:
            while chunk := f.read(65536):
                hasher.update(chunk)
        return hasher.hexdigest()

    @classmethod
    def extract(cls, filepath: str) -> Tuple[List[ExtractedPage], Dict[str, Any]]:
        path = Path(filepath)
        if not path.exists():
            raise DocumentExtractionError(f"File not found: {filepath}")

        ext = path.suffix.lower()
        file_size = path.stat().st_size
        
        if file_size == 0:
            raise DocumentExtractionError("Uploaded file is empty (0 bytes).")
        
        if file_size > 30 * 1024 * 1024:
            raise DocumentExtractionError("File exceeds maximum supported size (30MB).")

        if ext == ".pdf":
            return cls._extract_pdf(filepath)
        elif ext == ".docx":
            return cls._extract_docx(filepath)
        elif ext in [".txt", ".md"]:
            return cls._extract_txt(filepath)
        else:
            raise DocumentExtractionError(f"Unsupported file format: {ext}. Allowed: .pdf, .docx, .txt, .md")

    @classmethod
    def _extract_pdf(cls, filepath: str) -> Tuple[List[ExtractedPage], Dict[str, Any]]:
        pages: List[ExtractedPage] = []
        try:
            import fitz # PyMuPDF
            doc = fitz.open(filepath)
            
            if doc.is_encrypted:
                raise DocumentExtractionError("PDF file is password-protected or encrypted.")
            
            total_pages = len(doc)
            if total_pages == 0:
                raise DocumentExtractionError("PDF file contains 0 pages.")

            metadata = {
                "title": doc.metadata.get("title") or Path(filepath).stem,
                "author": doc.metadata.get("author", ""),
                "creator": doc.metadata.get("creator", ""),
                "total_pages": total_pages,
                "format": "PDF"
            }

            for page_idx in range(total_pages):
                page = doc[page_idx]
                page_text = page.get_text("text") or ""
                
                # Attempt to identify top heading/title
                blocks = page.get_text("blocks")
                first_heading = ""
                if blocks and len(blocks) > 0:
                    first_line = blocks[0][4].strip().split("\n")[0]
                    if len(first_line) < 100:
                        first_heading = first_line

                pages.append(ExtractedPage(
                    page_number=page_idx + 1,
                    text=page_text,
                    heading=first_heading
                ))

            doc.close()
            return pages, metadata

        except ImportError:
            # Fallback if fitz is not installed yet
            raise DocumentExtractionError("PyMuPDF is required for PDF parsing.")
        except Exception as e:
            if isinstance(e, DocumentExtractionError):
                raise e
            raise DocumentExtractionError(f"Failed to parse PDF document: {str(e)}")

    @classmethod
    def _extract_docx(cls, filepath: str) -> Tuple[List[ExtractedPage], Dict[str, Any]]:
        try:
            import docx
            doc = docx.Document(filepath)
            full_text = []
            heading = ""
            for p in doc.paragraphs:
                if p.style.name.startswith("Heading") and not heading:
                    heading = p.text
                if p.text.strip():
                    full_text.append(p.text.strip())
            
            combined_text = "\n\n".join(full_text)
            pages = [ExtractedPage(page_number=1, text=combined_text, heading=heading or Path(filepath).stem)]
            metadata = {
                "title": Path(filepath).stem,
                "total_pages": 1,
                "format": "DOCX"
            }
            return pages, metadata
        except Exception as e:
            raise DocumentExtractionError(f"Failed to parse DOCX document: {str(e)}")

    @classmethod
    def _extract_txt(cls, filepath: str) -> Tuple[List[ExtractedPage], Dict[str, Any]]:
        try:
            with open(filepath, "r", encoding="utf-8", errors="replace") as f:
                content = f.read().strip()
            
            if not content:
                raise DocumentExtractionError("Text file is empty.")

            pages = cls._split_marked_pages(content)
            first_line = content.split("\n")[0][:100]
            metadata = {
                "title": Path(filepath).stem,
                "total_pages": len(pages),
                "format": "TXT"
            }
            if pages and not pages[0].heading:
                pages[0].heading = first_line
            return pages, metadata
        except Exception as e:
            raise DocumentExtractionError(f"Failed to parse text document: {str(e)}")

    @staticmethod
    def _split_marked_pages(content: str) -> List[ExtractedPage]:
        import re
        matches = list(re.finditer(r"\[Page\s+(\d+)\]", content, re.IGNORECASE))
        if not matches:
            return [ExtractedPage(page_number=1, text=content, heading=content.split("\n")[0][:100])]

        pages: List[ExtractedPage] = []
        for idx, match in enumerate(matches):
            start = match.end()
            end = matches[idx + 1].start() if idx + 1 < len(matches) else len(content)
            page_text = content[start:end].strip()
            page_number = int(match.group(1))
            heading = page_text.split("\n")[0][:100] if page_text else f"Page {page_number}"
            pages.append(ExtractedPage(page_number=page_number, text=page_text, heading=heading))
        return pages or [ExtractedPage(page_number=1, text=content)]
