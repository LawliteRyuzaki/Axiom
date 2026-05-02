"""
Research API Router
────────────────────
POST /api/research         — Start research, stream SSE events
GET  /api/history          — List past sessions (paginated)
GET  /api/history/{id}     — Retrieve a specific session
GET  /api/health           — Health check
"""

import json
import time
from datetime import datetime
from typing import AsyncGenerator

from fastapi import APIRouter, HTTPException, Request
from sse_starlette.sse import EventSourceResponse

from app.agents.crew import run_research_crew
from app.core.logging import logger
from app.services.session_service import SessionService
from app.models.schemas import (
    ResearchRequest,
    ResearchSession,
    SessionSummary,
    SSEEvent,
)

router = APIRouter()


# ── SSE Helpers ───────────────────────────────────────────────────────────────

def _sse_format(event: SSEEvent) -> str:
    """Format an SSEEvent into the SSE wire protocol."""
    payload = json.dumps({"type": event.type, "data": event.data, "session_id": event.session_id})
    return payload


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/research")
async def start_research(request: ResearchRequest):
    """
    Start a new research job.
    Returns a Server-Sent Events stream with real-time progress.

    Event types:
      status        → "initializing" | "running" | "completed" | "partial" | "failed"
      progress      → Human-readable progress message
      query         → A sub-query being searched
      report_chunk  → A chunk of the Markdown report
      complete      → Final JSON: {session_id, duration, partial}
      error         → Error message string
    """
    # Create session record via Service
    session = await SessionService.create_session(request.goal, request.model)
    logger.info("New research session %s: %s", session.id, request.goal[:60])

    report_chunks: list[str] = []
    sub_queries: list[str] = []
    start_time = time.monotonic()

    async def event_generator() -> AsyncGenerator[dict, None]:
        nonlocal report_chunks, sub_queries
        final_status = "failed"
        partial = False

        try:
            async for event in run_research_crew(request.goal, session.id):
                # Collect data for DB persistence
                if event.type == "report_chunk":
                    report_chunks.append(event.data)
                elif event.type == "query":
                    sub_queries.append(event.data)
                elif event.type == "status":
                    final_status = event.data
                elif event.type == "complete":
                    try:
                        meta = json.loads(event.data)
                        partial = meta.get("partial", False)
                    except Exception:
                        pass

                # Yield the SSE event to the client
                yield {
                    "event": event.type,
                    "data": _sse_format(event),
                }

        except Exception as exc:
            logger.exception("SSE generator error: %s", exc)
            yield {
                "event": "error",
                "data": json.dumps({"type": "error", "data": str(exc)}),
            }
            final_status = "failed"

        finally:
            # Persist final session state via Service
            duration = round(time.monotonic() - start_time, 1)
            full_report = "".join(report_chunks)
            
            await SessionService.update_session(session.id, {
                "status": final_status,
                "report": full_report if full_report else None,
                "sub_queries": sub_queries,
                "partial": partial,
                "duration_seconds": duration,
            })
            
            logger.info(
                "Session %s finished — status: %s, duration: %.1fs",
                session.id, final_status, duration,
            )

    return EventSourceResponse(
        event_generator(),
        headers={
            "X-Session-ID": session.id,
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # Disable Nginx buffering for SSE
        },
    )


@router.get("/history", response_model=list[SessionSummary])
async def get_history(limit: int = 20, skip: int = 0):
    """Return a paginated list of past research sessions (newest first)."""
    return await SessionService.get_history(limit, skip)


@router.get("/history/{session_id}", response_model=ResearchSession)
async def get_session(session_id: str):
    """Retrieve a specific research session by ID."""
    doc = await SessionService.get_session(session_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    return doc


@router.get("/health")
async def health_check():
    """Health check — verifies DB connectivity."""
    db = get_db()
    try:
        await db.command("ping")
        db_status = "connected"
    except Exception as exc:
        db_status = f"error: {exc}"

    return {
        "status": "ok",
        "version": "1.0.0",
        "database": db_status,
    }
