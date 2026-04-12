"""
Axiom — FastAPI Application Entry Point
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.database import connect_db, disconnect_db
from app.core.logging import logger
from app.api.research import router as research_router


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    env_label = "production" if settings.is_production else "development"
    logger.info("🚀 Axiom v%s starting (%s)...", settings.app_version, env_label)
    logger.info("Allowed CORS origins: %s", settings.origins_list)

    # Log available fallback providers so operators can verify config at boot
    if settings.gemini_api_key_2:
        logger.info("GEMINI_API_KEY_2 detected — secondary Gemini pool active")
    if settings.groq_api_key:
        logger.info("GROQ_API_KEY detected — Groq/Llama-3.1 fallback active")

    await connect_db()
    yield
    logger.info("Shutting down Axiom...")
    await disconnect_db()


# ── App factory ───────────────────────────────────────────────────────────────

def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="Axiom API",
        description="Real-time AI research agent system — multi-agent, SSE-streamed reports",
        version=settings.app_version,
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # ── Dynamic CORS ─────────────────────────────────────────────────────────
    # origins_list already merges env config + localhost for non-production runs.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.origins_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["X-Session-ID"],
    )

    # ── Global exception handler ──────────────────────────────────────────────
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.exception(
            "Unhandled exception on %s %s: %s",
            request.method, request.url.path, exc,
        )
        return JSONResponse(
            status_code=500,
            content={"error": "An unexpected error occurred. Please try again."},
        )

    # ── Routers ───────────────────────────────────────────────────────────────
    app.include_router(research_router, prefix="/api", tags=["research"])

    # ── Root ──────────────────────────────────────────────────────────────────
    @app.get("/", tags=["meta"])
    async def root():
        settings = get_settings()
        return {
            "service": "Axiom API",
            "version": settings.app_version,
            "environment": "production" if settings.is_production else "development",
            "docs": "/docs",
            "health": "/api/health",
        }

    return app


app = create_app()
