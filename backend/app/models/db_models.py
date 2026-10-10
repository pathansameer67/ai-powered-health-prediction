import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class TrustTier(str, enum.Enum):
    TRUSTED_KNOWLEDGE = "trusted_knowledge"
    PRIVATE_UPLOAD = "private_upload"
    UNVERIFIED = "unverified"

class DocumentStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    INDEXED = "indexed"
    FAILED = "failed"

class EscalationCategory(str, enum.Enum):
    CATEGORY_A = "category_a" # Immediate Emergency (e.g. chest pain, stroke, breathing failure)
    CATEGORY_B = "category_b" # Professional Medical Review Required (e.g. diagnosis, prescription)
    CATEGORY_C = "category_c" # General Information

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    documents = relationship("Document", back_populates="owner", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True) # Null for global trusted knowledge
    title = Column(String(255), nullable=False, index=True)
    original_filename = Column(String(255), nullable=False)
    stored_filepath = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False) # pdf, docx, txt
    file_size_bytes = Column(Integer, nullable=False)
    file_hash = Column(String(64), index=True, nullable=False)
    
    trust_tier = Column(String(50), default=TrustTier.PRIVATE_UPLOAD.value, nullable=False)
    status = Column(String(50), default=DocumentStatus.PENDING.value, nullable=False)
    status_message = Column(Text, nullable=True)
    
    total_pages = Column(Integer, default=1)
    total_chunks = Column(Integer, default=0)
    
    # Metadata for trusted healthcare source attribution
    publisher = Column(String(255), nullable=True) # e.g. WHO, MoHFW India, MedlinePlus, NHS
    source_url = Column(String(500), nullable=True)
    publication_date = Column(String(50), nullable=True)
    version = Column(String(50), default="1.0")
    jurisdiction = Column(String(50), default="Global")
    
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    owner = relationship("User", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    page_number = Column(Integer, nullable=True)
    heading = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    token_count = Column(Integer, nullable=True)
    vector_id = Column(String(64), nullable=True, index=True)

    document = relationship("Document", back_populates="chunks")

class TrustedSource(Base):
    __tablename__ = "trusted_sources"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False, unique=True)
    organization = Column(String(255), nullable=False)
    website_url = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    is_approved = Column(Boolean, default=True)
    category = Column(String(100), default="Official Public Health")
    jurisdiction = Column(String(50), default="IN")
    created_at = Column(DateTime(timezone=True), default=utc_now)

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String(255), default="Healthcare Inquiry")
    selected_document_id = Column(String(36), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")
    selected_document = relationship("Document")

class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), nullable=False) # user, assistant, system
    content = Column(Text, nullable=False)
    
    # RAG, Tool, and Safety Metadata (Stored as JSON string)
    citations_json = Column(Text, nullable=True) # list of cited evidence objects
    tools_used_json = Column(Text, nullable=True) # tools invoked during execution
    escalation_category = Column(String(50), nullable=True) # category_a, category_b, category_c
    escalation_guidance = Column(Text, nullable=True)
    has_insufficient_evidence = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), default=utc_now)

    conversation = relationship("Conversation", back_populates="messages")

class EscalationLog(Base):
    __tablename__ = "escalation_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), nullable=True)
    user_id = Column(String(36), nullable=True)
    user_query = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)
    matched_triggers = Column(Text, nullable=True)
    guidance_provided = Column(Text, nullable=False)
    emergency_contact = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    action = Column(String(100), nullable=False)
    actor_id = Column(String(36), nullable=True)
    resource_type = Column(String(100), nullable=True)
    resource_id = Column(String(36), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
