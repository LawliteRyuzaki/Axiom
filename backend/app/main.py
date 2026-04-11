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


# ── Lifespan (replaces deprecated on_event) ───────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    settings = get_settings()
    logger.info("🚀 Axiom v%s starting up...", settings.app_version)
    logger.info("Allowed origins: %s", settings.origins_list)
    await connect_db()
    yield
    # Shutdown
    logger.info("Shutting down Axiom...")
    await disconnect_db()


# ── App factory ───────────────────────────────────────────────────────────────

def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="Axiom API",
        description="Real-time AI research agent system for MCA students",
        version=settings.app_version,
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.origins_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["X-Session-ID"],
    )

    # ── Global exception handlers ─────────────────────────────────────────────

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled exception on %s %s: %s", request.method, request.url.path, exc)
        return JSONResponse(
            status_code=500,
            content={"error": "An unexpected error occurred. Please try again."},
        )

    # ── Routers ───────────────────────────────────────────────────────────────
    app.include_router(research_router, prefix="/api", tags=["research"])

    # ── Root ──────────────────────────────────────────────────────────────────
    @app.get("/", tags=["meta"])
    async def root():
        return {
            "service": "Axiom API",
            "version": settings.app_version,
            "docs": "/docs",
            "health": "/api/health",
        }

    return app


app = create_app()
