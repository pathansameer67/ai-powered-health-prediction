from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

class DocumentChunkInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    chunk_index: int
    page_number: Optional[int] = None
    heading: Optional[str] = None
    content: str
    token_count: Optional[int] = None

class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: Optional[str] = None
    title: str
    original_filename: str
    file_type: str
    file_size_bytes: int
    trust_tier: str
    status: str
    status_message: Optional[str] = None
    total_pages: int
    total_chunks: int
    publisher: Optional[str] = None
    source_url: Optional[str] = None
    publication_date: Optional[str] = None
    version: Optional[str] = "1.0"
    jurisdiction: Optional[str] = "Global"
    created_at: datetime
    updated_at: datetime

class DocumentDetailResponse(DocumentResponse):
    chunks: List[DocumentChunkInfo] = []

class TrustedSourceCreate(BaseModel):
    name: str
    organization: str
    website_url: Optional[str] = None
    description: Optional[str] = None
    category: str = "Official Public Health"
    jurisdiction: str = "IN"

class TrustedSourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    organization: str
    website_url: Optional[str] = None
    description: Optional[str] = None
    is_approved: bool
    category: str
    jurisdiction: str
    created_at: datetime

class SummarizeRequest(BaseModel):
    document_id: str
    mode: str = Field(default="detailed", description="quick, detailed, section_by_section, key_points, plain_language, question_focused, comparison")
    target_question: Optional[str] = None
    compare_document_ids: Optional[List[str]] = None

class SummarizeResponse(BaseModel):
    document_id: str
    document_title: str
    mode: str
    summary: str
    key_points: List[str] = []
    medical_terms_explained: Dict[str, str] = {}
    source_citations: List[Dict[str, Any]] = []
    clinical_caution: str
    processing_time_sec: float
