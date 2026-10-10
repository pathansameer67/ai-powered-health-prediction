import os
import shutil
import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.core.database import get_db
from app.core.config import settings
from app.api.v1.auth import get_current_user
from app.models.db_models import User, Document, DocumentChunk, TrustTier, DocumentStatus
from app.schemas.document import DocumentResponse, DocumentDetailResponse, DocumentChunkInfo
from app.ingestion.pipeline import IngestionPipeline
from app.ingestion.extractors import DocumentExtractor
from app.retrieval.vector_store import VectorStoreManager

router = APIRouter(prefix="/documents", tags=["Document Knowledge Base"])

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    trust_tier: str = Form(TrustTier.PRIVATE_UPLOAD.value),
    publisher: Optional[str] = Form(None),
    source_url: Optional[str] = Form(None),
    publication_date: Optional[str] = Form(None),
    jurisdiction: str = Form("IN"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Validate extension
    ext = Path(file.filename).suffix.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # Save to disk with secure UUID filename
    doc_id = str(uuid.uuid4())
    save_dir = settings.TRUSTED_DOCS_DIR if trust_tier == TrustTier.TRUSTED_KNOWLEDGE.value else settings.UPLOAD_DIR
    save_filename = f"{doc_id}{ext}"
    saved_filepath = save_dir / save_filename

    with open(saved_filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = saved_filepath.stat().st_size
    if file_size == 0:
        saved_filepath.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes).")

    if file_size > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        saved_filepath.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail=f"File exceeds maximum size ({settings.MAX_UPLOAD_SIZE_MB}MB).")

    # Compute SHA-256
    file_hash = DocumentExtractor.compute_sha256(str(saved_filepath))

    doc_title = title.strip() if title and title.strip() else Path(file.filename).stem

    # Create Initial DB record
    doc = Document(
        id=doc_id,
        user_id=current_user.id if trust_tier != TrustTier.TRUSTED_KNOWLEDGE.value else None,
        title=doc_title,
        original_filename=file.filename,
        stored_filepath=str(saved_filepath),
        file_type=ext.replace(".", ""),
        file_size_bytes=file_size,
        file_hash=file_hash,
        trust_tier=trust_tier,
        status=DocumentStatus.PENDING.value,
        publisher=publisher or ("Approved Health Source" if trust_tier == TrustTier.TRUSTED_KNOWLEDGE.value else "Private User Upload"),
        source_url=source_url,
        publication_date=publication_date,
        jurisdiction=jurisdiction
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    # Run Ingestion Pipeline (extraction, chunking, Chroma indexing)
    try:
        pipeline = IngestionPipeline(db)
        doc = await pipeline.process_document(
            document_id=doc.id,
            filepath=str(saved_filepath),
            title=doc.title,
            user_id=doc.user_id,
            trust_tier=doc.trust_tier,
            publisher=doc.publisher,
            source_url=doc.source_url,
            publication_date=doc.publication_date,
            jurisdiction=doc.jurisdiction
        )
        return doc
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document indexing failed: {str(e)}")

@router.get("", response_model=List[DocumentResponse])
async def list_documents(
    trust_tier: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Returns global trusted knowledge + user's private documents
    query = select(Document).where(
        (Document.user_id == current_user.id) | (Document.trust_tier == TrustTier.TRUSTED_KNOWLEDGE.value)
    )
    if trust_tier:
        query = query.where(Document.trust_tier == trust_tier)

    query = query.order_by(Document.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{document_id}", response_model=DocumentDetailResponse)
async def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    if doc.user_id and doc.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access denied to this private document.")

    chunks_res = await db.execute(
        select(DocumentChunk).where(DocumentChunk.document_id == document_id).order_by(DocumentChunk.chunk_index)
    )
    chunks = chunks_res.scalars().all()

    return DocumentDetailResponse(
        id=doc.id,
        user_id=doc.user_id,
        title=doc.title,
        original_filename=doc.original_filename,
        file_type=doc.file_type,
        file_size_bytes=doc.file_size_bytes,
        trust_tier=doc.trust_tier,
        status=doc.status,
        status_message=doc.status_message,
        total_pages=doc.total_pages,
        total_chunks=doc.total_chunks,
        publisher=doc.publisher,
        source_url=doc.source_url,
        publication_date=doc.publication_date,
        version=doc.version,
        jurisdiction=doc.jurisdiction,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
        chunks=[DocumentChunkInfo.model_validate(c) for c in chunks]
    )

@router.delete("/{document_id}", status_code=204)
async def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    if doc.user_id and doc.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Unauthorized to delete this document.")

    # 1. Delete vector embeddings in Chroma
    vector_store = VectorStoreManager()
    vector_store.delete_document(document_id)

    # 2. Delete file on disk
    if os.path.exists(doc.stored_filepath):
        try:
            os.remove(doc.stored_filepath)
        except Exception:
            pass

    # 3. Delete database record & chunks
    await db.delete(doc)
    await db.commit()
    return None

@router.post("/{document_id}/reprocess", response_model=DocumentResponse)
async def reprocess_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    pipeline = IngestionPipeline(db)
    updated_doc = await pipeline.process_document(
        document_id=doc.id,
        filepath=doc.stored_filepath,
        title=doc.title,
        user_id=doc.user_id,
        trust_tier=doc.trust_tier,
        publisher=doc.publisher,
        source_url=doc.source_url,
        publication_date=doc.publication_date,
        jurisdiction=doc.jurisdiction
    )
    return updated_doc
