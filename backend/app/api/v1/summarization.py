from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.db_models import User, Document
from app.schemas.document import SummarizeRequest, SummarizeResponse
from app.services.summarizer import DocumentSummarizer

router = APIRouter(prefix="/summarize", tags=["Document Summarization"])

@router.post("", response_model=SummarizeResponse)
async def summarize_document_endpoint(
    req: SummarizeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Document).where(Document.id == req.document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    if doc.user_id and doc.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access denied to summarize this private document.")

    try:
        summarizer = DocumentSummarizer(db)
        summary_result = await summarizer.summarize(
            document_id=req.document_id,
            mode=req.mode,
            target_question=req.target_question,
            compare_document_ids=req.compare_document_ids
        )
        return summary_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")
