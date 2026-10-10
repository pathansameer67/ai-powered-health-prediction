from typing import List, Dict, Any, Optional
from app.ingestion.extractors import ExtractedPage

class ChunkData:
    def __init__(
        self,
        chunk_index: int,
        content: str,
        page_number: Optional[int] = None,
        heading: Optional[str] = None,
        token_count: Optional[int] = None
    ):
        self.chunk_index = chunk_index
        self.content = content
        self.page_number = page_number
        self.heading = heading
        self.token_count = token_count or len(content.split())

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_index": self.chunk_index,
            "content": self.content,
            "page_number": self.page_number,
            "heading": self.heading,
            "token_count": self.token_count
        }

class DocumentChunker:
    """Page-aware, semantically-sensitive document chunker."""

    def __init__(self, chunk_size_words: int = 200, overlap_words: int = 40):
        self.chunk_size_words = chunk_size_words
        self.overlap_words = overlap_words

    def chunk_pages(self, pages: List[ExtractedPage]) -> List[ChunkData]:
        chunks: List[ChunkData] = []
        global_chunk_idx = 0

        for page in pages:
            text = page.text
            if not text.strip():
                continue

            words = text.split()
            if len(words) <= self.chunk_size_words:
                chunks.append(ChunkData(
                    chunk_index=global_chunk_idx,
                    content=text.strip(),
                    page_number=page.page_number,
                    heading=page.heading,
                    token_count=len(words)
                ))
                global_chunk_idx += 1
            else:
                # Sliding window chunking per page to guarantee exact page preservation
                start = 0
                while start < len(words):
                    end = min(start + self.chunk_size_words, len(words))
                    chunk_text = " ".join(words[start:end])
                    
                    chunks.append(ChunkData(
                        chunk_index=global_chunk_idx,
                        content=chunk_text,
                        page_number=page.page_number,
                        heading=page.heading,
                        token_count=len(words[start:end])
                    ))
                    global_chunk_idx += 1
                    
                    if end == len(words):
                        break
                    start += (self.chunk_size_words - self.overlap_words)

        return chunks
