import os
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.config import settings
from app.core.database import get_db
from app.models.db_models import Document, Conversation, Message, EscalationLog, User, TrustTier
from app.retrieval.vector_store import VectorStoreManager
from app.safety.escalation_policy import EscalationPolicy, EMERGENCY_CONTACTS

router = APIRouter(prefix="/system", tags=["System & Safety Status"])

@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    vector_store = VectorStoreManager()
    
    # Check DB
    db_status = "healthy"
    try:
        await db.execute(select(func.count(User.id)))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    # Check Vector Store
    vector_status = "healthy"
    vector_count = 0
    try:
        vector_count = vector_store.count_vectors()
    except Exception as e:
        vector_status = f"unhealthy: {str(e)}"

    groq_configured = bool(settings.GROQ_API_KEY and settings.GROQ_API_KEY != "your_groq_api_key_here")

    return {
        "status": "healthy" if db_status == "healthy" and vector_status == "healthy" else "degraded",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
        "database": db_status,
        "vector_store": {
            "status": vector_status,
            "total_vectors": vector_count,
            "backend": "ChromaDB"
        },
        "llm_service": {
            "provider": "Groq",
            "model": settings.GROQ_MODEL,
            "fallback_model": settings.FALLBACK_GROQ_MODEL,
            "api_key_configured": groq_configured
        },
        "safety_subsystem": {
            "status": "active",
            "jurisdiction": settings.DEFAULT_JURISDICTION,
            "emergency_number": settings.PAN_INDIA_EMERGENCY_NUMBER
        }
    }

@router.get("/safety-policy")
async def get_safety_policy():
    return {
        "policy_name": "Antigravity Clinical Safety & Escalation Standard",
        "categories": {
            "category_a": {
                "name": "Potential Medical Emergency",
                "description": "Immediate life-threatening or acute conditions (e.g. chest pain, stroke, severe dyspnea, self-harm, poisoning).",
                "action": "Immediate emergency routing to official hotlines without delay."
            },
            "category_b": {
                "name": "Professional Review Required",
                "description": "Clinical diagnosis, prescription changes, medication adjustments, or lab interpretation.",
                "action": "Evidence-grounded general info with mandatory physician consultation advisory."
            },
            "category_c": {
                "name": "General Informational Healthcare",
                "description": "Educational, preventive, lifestyle, anatomical, or general document synthesis inquiries.",
                "action": "Evidence-grounded response with source citations and standard disclaimer."
            }
        },
        "emergency_contacts": EMERGENCY_CONTACTS
    }

@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    total_docs = await db.scalar(select(func.count(Document.id))) or 0
    trusted_docs = await db.scalar(select(func.count(Document.id)).where(Document.trust_tier == TrustTier.TRUSTED_KNOWLEDGE.value)) or 0
    private_docs = await db.scalar(select(func.count(Document.id)).where(Document.trust_tier == TrustTier.PRIVATE_UPLOAD.value)) or 0
    total_conversations = await db.scalar(select(func.count(Conversation.id))) or 0
    total_messages = await db.scalar(select(func.count(Message.id))) or 0
    escalations_count = await db.scalar(select(func.count(EscalationLog.id))) or 0

    vector_store = VectorStoreManager()
    vector_count = vector_store.count_vectors()

    return {
        "total_documents": total_docs,
        "trusted_documents": trusted_docs,
        "private_documents": private_docs,
        "total_conversations": total_conversations,
        "total_messages": total_messages,
        "total_vector_chunks": vector_count,
        "total_escalations": escalations_count
    }
