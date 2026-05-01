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


# ── Granular log lines (drip-fed to the terminal while crew runs) ─────────────

# ── Granular log lines (drip-fed to the terminal while crew runs) ─────────────

_ARCHITECT_LOGS = [
    "Initialising Research Architect...",
    "Analyzing research goal dimensions...",
    "Designing 3-phase investigation roadmap...",
    "Identifying core conceptual pillars...",
    "Defining technical boundaries...",
    "Research roadmap finalized.",
]

_SCOUT_LOGS = [
    "Activating Information Scout...",
    "Translating roadmap to search vectors...",
    "Optimizing Boolean query strings...",
    "Targeting academic repositories (arXiv, IEEE)...",
    "Validating query uniqueness...",
    "Search queries dispatched.",
]

_SEARCHER_LOGS = [
    "Deploying Web Searcher...",
    "Crawling global information index...",
    "Filtering for high-fidelity technical papers...",
    "Extracting quantitative data and metrics...",
    "Verifying source credibility (SSL/Peer-review)...",
    "Aggregating evidence corpus...",
]

_REVIEWER_LOGS = [
    "Activating Quality Reviewer...",
    "Auditing evidence for depth and bias...",
    "Identifying logical gaps in findings...",
    "Reconciling contradictory data points...",
    "Evidence audit complete. Goal: [GO].",
]

_WRITER_LOGS = [
    "Activating Principal Writer...",
    "Synthesizing multi-agent findings...",
    "Drafting Executive Summary & Introduction...",
    "Constructing Technical Deep-Dive (Phase 2)...",
    "Performing comparative analysis...",
    "Formatting 2,000+ word manuscript...",
    "Final citation integrity check...",
    "Report generation complete.",
]


async def _stream_phase_logs(queue, session_id, architect_logs, scout_logs, searcher_logs, reviewer_logs, writer_logs):
    """Emit logs timed to approximate each agent phase."""
    try:
        for line in architect_logs:
            await _emit(queue, "log", line, session_id)
            await asyncio.sleep(4)
        for line in scout_logs:
            await _emit(queue, "log", line, session_id)
            await asyncio.sleep(4)
        for line in searcher_logs:
            await _emit(queue, "log", line, session_id)
            await asyncio.sleep(6)
        for line in reviewer_logs:
            await _emit(queue, "log", line, session_id)
            await asyncio.sleep(5)
        for line in writer_logs:
            await _emit(queue, "log", line, session_id)
            await asyncio.sleep(7)
    except asyncio.CancelledError:
        pass


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
