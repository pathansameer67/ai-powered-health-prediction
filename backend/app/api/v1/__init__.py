from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.chat import router as chat_router
from app.api.v1.documents import router as documents_router
from app.api.v1.summarization import router as summarization_router
from app.api.v1.sources import router as sources_router
from app.api.v1.system import router as system_router
from app.api.v1.xray import router as xray_router
from app.api.v1.concierge import router as concierge_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(auth_router)
api_v1_router.include_router(chat_router)
api_v1_router.include_router(documents_router)
api_v1_router.include_router(summarization_router)
api_v1_router.include_router(sources_router)
api_v1_router.include_router(system_router)
api_v1_router.include_router(xray_router)
api_v1_router.include_router(concierge_router)
