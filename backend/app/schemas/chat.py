from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

class Citation(BaseModel):
    citation_id: str
    document_id: str
    document_title: str
    publisher: Optional[str] = "Approved Medical Source"
    page_number: Optional[int] = None
    heading: Optional[str] = None
    snippet: str
    source_url: Optional[str] = None
    publication_date: Optional[str] = None
    trust_tier: str = "trusted_knowledge"
    relevance_score: Optional[float] = None

class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    query: str = Field(..., min_length=1)
    selected_document_id: Optional[str] = None
    filter_trust_tier: Optional[str] = None
    jurisdiction: str = "IN"

class ToolInvocationLog(BaseModel):
    tool_name: str
    arguments: Dict[str, Any]
    status: str
    result_summary: Optional[str] = None

class ChatResponse(BaseModel):
    conversation_id: str
    message_id: str
    query: str
    answer: str
    citations: List[Citation] = []
    tools_used: List[ToolInvocationLog] = []
    escalation_category: str
    escalation_guidance: Optional[str] = None
    has_insufficient_evidence: bool = False
    limitations: Optional[str] = None
    follow_up_suggestions: List[str] = []
    created_at: datetime

class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: Optional[str]
    title: str
    selected_document_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    message_count: int = 0

class ConversationDetailResponse(ConversationResponse):
    messages: List[Dict[str, Any]] = []
