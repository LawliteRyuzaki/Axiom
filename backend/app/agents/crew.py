"""
Axiom Crew Orchestrator  (crewai v1.14.x)
------------------------------------------
Granular SSE messages so the frontend terminal feels alive at every step.

Key resilience improvements:
  - Full provider fallback chain (Gemini primary → Gemini-lite → secondary key → Groq)
  - 2-second mandatory sleep between agent transitions to prevent burst-rate trips
  - Report Writer is invoked even on timeout so the user always sees content
  - Per-minute 429 → exponential backoff+retry; daily quota → next provider
"""

import asyncio
import json
import time
from typing import AsyncGenerator, Optional

from crewai import Crew, Process, Task

from app.agents.agents import build_agents, FULL_FALLBACK_CHAIN
from app.pipeline.controller import ResearchPipeline
from app.core.config import get_settings
from app.core.logging import logger
from app.core.retry import run_with_retry, is_rate_limit_error, is_daily_quota_exhausted
from app.models.schemas import SSEEvent

# ── Helpers ───────────────────────────────────────────────────────────────────

async def _emit(queue, event_type: str, data: str, session_id: Optional[str] = None):
    await queue.put(SSEEvent(type=event_type, data=data, session_id=session_id))


async def run_research_crew(goal: str, session_id: str) -> AsyncGenerator[SSEEvent, None]:
    settings = get_settings()
    queue: asyncio.Queue[Optional[SSEEvent]] = asyncio.Queue()
    pipeline = ResearchPipeline(goal)

    async def producer() -> None:
        try:
            await _emit(queue, "status", "initializing", session_id)
            await _emit(queue, "log", f"Axiom v4 Engine Active [Trace: {pipeline.trace_id}]", session_id)
            
            # Define emitter for the pipeline to send logs back to the user
            async def pipeline_emitter(event_type: str, data: str):
                await _emit(queue, event_type, data, session_id)

            # Run the Deterministic Pipeline with full fallback support
            report_raw = await pipeline.run(FULL_FALLBACK_CHAIN, emitter=pipeline_emitter)
            
            # Stream the final report
            await _emit(queue, "log", "Final manuscript verification complete. Streaming...", session_id)
            for line in report_raw.splitlines(keepends=True):
                await _emit(queue, "report_chunk", line, session_id)
                await asyncio.sleep(0.005)

            await _emit(queue, "status", "completed", session_id)
            await _emit(queue, "complete", json.dumps({
                "session_id": session_id,
                "trace_id": pipeline.trace_id,
                "duration": round(time.monotonic() - pipeline.start_time, 1)
            }), session_id)

        except Exception as exc:
            logger.exception(f"[{pipeline.trace_id}] Pipeline Fatal Error: {exc}")
            await _emit(queue, "error", f"Research pipeline failed: {str(exc)[:200]}", session_id)
        finally:
            await queue.put(None)

    producer_task = asyncio.create_task(producer())
    while True:
        event = await queue.get()
        if event is None: break
        yield event
    await producer_task
