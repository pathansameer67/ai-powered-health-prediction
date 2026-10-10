import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List, Dict, Any

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.db_models import User, Conversation, Message
from app.agents.orchestrator import AgentOrchestrator
from app.schemas.chat import (
    ChatRequest, ChatResponse, ConversationResponse, ConversationDetailResponse
)

router = APIRouter(prefix="/chat", tags=["Healthcare Chat Assistant"])

@router.post("", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    orchestrator = AgentOrchestrator(db, user_id=current_user.id)
    return await orchestrator.execute_query(
        query=req.query,
        conversation_id=req.conversation_id,
        selected_document_id=req.selected_document_id,
        filter_trust_tier=req.filter_trust_tier,
        jurisdiction=req.jurisdiction
    )

@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Conversation).where(Conversation.user_id == current_user.id).order_by(Conversation.updated_at.desc())
    result = await db.execute(query)
    conversations = result.scalars().all()

    response = []
    for c in conversations:
        # Count messages
        msg_res = await db.execute(select(Message).where(Message.conversation_id == c.id))
        msgs = msg_res.scalars().all()
        response.append(ConversationResponse(
            id=c.id,
            user_id=c.user_id,
            title=c.title,
            selected_document_id=c.selected_document_id,
            created_at=c.created_at,
            updated_at=c.updated_at,
            message_count=len(msgs)
        ))
    return response

@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            (Conversation.user_id == current_user.id) | (Conversation.user_id.is_(None))
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found or access denied.")

    msgs_res = await db.execute(
        select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at)
    )
    msgs = msgs_res.scalars().all()

    formatted_msgs = []
    for m in msgs:
        formatted_msgs.append({
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "citations": json.loads(m.citations_json) if m.citations_json else [],
            "tools_used": json.loads(m.tools_used_json) if m.tools_used_json else [],
            "escalation_category": m.escalation_category,
            "escalation_guidance": m.escalation_guidance,
            "has_insufficient_evidence": m.has_insufficient_evidence,
            "created_at": m.created_at
        })

    return ConversationDetailResponse(
        id=conv.id,
        user_id=conv.user_id,
        title=conv.title,
        selected_document_id=conv.selected_document_id,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        message_count=len(msgs),
        messages=formatted_msgs
    )

@router.delete("/conversations/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    await db.delete(conv)
    await db.commit()
    return None
