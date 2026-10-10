from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.db_models import User, TrustedSource
from app.schemas.document import TrustedSourceCreate, TrustedSourceResponse

router = APIRouter(prefix="/sources", tags=["Trusted Health Sources Registry"])

@router.get("", response_model=List[TrustedSourceResponse])
async def list_sources(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TrustedSource).order_by(TrustedSource.name))
    return result.scalars().all()

@router.post("", response_model=TrustedSourceResponse, status_code=status.HTTP_201_CREATED)
async def register_source(
    req: TrustedSourceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only administrator accounts can register official health sources.")

    source = TrustedSource(
        name=req.name,
        organization=req.organization,
        website_url=req.website_url,
        description=req.description,
        category=req.category,
        jurisdiction=req.jurisdiction,
        is_approved=True
    )
    db.add(source)
    await db.commit()
    await db.refresh(source)
    return source
