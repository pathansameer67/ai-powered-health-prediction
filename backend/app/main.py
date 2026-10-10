from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.core.config import settings
from app.core.database import init_db
from app.api.v1 import api_v1_router

logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing SQLite database tables...")
    await init_db()
    try:
        from app.ingestion.bootstrap import seed_trusted_knowledge
        indexed = await seed_trusted_knowledge(force=False)
        logger.info(f"Trusted knowledge base ready ({indexed} verified documents).")
    except Exception as exc:
        logger.warning(f"Trusted document bootstrap skipped: {exc}")
    logger.info(f"{settings.APP_NAME} v{settings.APP_VERSION} startup complete.")
    yield
    logger.info("Application shutdown.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Evidence-Grounded Healthcare Information Assistant with Agentic Tool Calling, Safety Escalation, and Multi-Mode Summarization.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS or ["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred while processing the healthcare request."}
    )


app.include_router(api_v1_router)


from fastapi.responses import HTMLResponse

@app.get("/", response_class=HTMLResponse)
def root(request: Request):
    accept = request.headers.get("accept", "")
    if "text/html" not in accept:
        return JSONResponse({
            "message": f"Welcome to {settings.APP_NAME}",
            "version": settings.APP_VERSION,
            "docs": "/docs",
            "api": "/api/v1",
            "frontend": "http://localhost:5173"
        })
    return HTMLResponse(content=f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{settings.APP_NAME} - Backend API</title>
      <style>
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background: #090d16;
          color: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 24px;
        }}
        .card {{
          background: #131b2e;
          border: 1px solid #1e293b;
          border-radius: 16px;
          padding: 40px;
          max-width: 640px;
          width: 100%;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }}
        .badge {{
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          font-size: 13px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 9999px;
          margin-bottom: 20px;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }}
        .dot {{
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          display: inline-block;
          animation: pulse 2s infinite;
        }}
        @keyframes pulse {{
          0%, 100% {{ opacity: 1; transform: scale(1); }}
          50% {{ opacity: 0.5; transform: scale(0.9); }}
        }}
        h1 {{ font-size: 26px; font-weight: 700; margin-bottom: 12px; color: #ffffff; }}
        p {{ color: #94a3b8; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }}
        .actions {{
          display: flex;
          flex-direction: column;
          gap: 12px;
        }}
        .btn {{
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 14px 20px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }}
        .btn-primary {{
          background: #0284c7;
          color: #ffffff;
        }}
        .btn-primary:hover {{ background: #0369a1; }}
        .btn-secondary {{
          background: #1e293b;
          color: #cbd5e1;
          border: 1px solid #334155;
        }}
        .btn-secondary:hover {{ background: #334155; color: #ffffff; }}
        .meta {{
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #1e293b;
          font-size: 13px;
          color: #64748b;
          display: flex;
          justify-content: space-between;
        }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge"><span class="dot"></span> Backend API is Online & Healthy</div>
        <h1>{settings.APP_NAME}</h1>
        <p>This is the FastAPI backend service providing document ingestion, vector retrieval with ChromaDB, Groq LLM orchestration, and clinical safety escalation policies.</p>
        <div class="actions">
          <a href="http://localhost:5173" class="btn btn-primary" target="_blank">🌐 Open Frontend Web Application (localhost:5173)</a>
          <a href="/docs" class="btn btn-secondary">📖 Interactive Swagger API Documentation (/docs)</a>
          <a href="/api/v1/system/health" class="btn btn-secondary">🩺 System Health Check (/api/v1/system/health)</a>
        </div>
        <div class="meta">
          <span>Version {settings.APP_VERSION}</span>
          <span>Environment: {settings.APP_ENV}</span>
        </div>
      </div>
    </body>
    </html>
    """)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
