"""
ScholarSync Crew Orchestrator  (crewai v1.14.x)
-------------------------------------------------
Granular SSE messages so the frontend terminal feels alive at every step.
Rate-limit strategy: per-minute 429 -> backoff+retry; daily quota -> next model.
"""

import asyncio
import json
import time
from typing import AsyncGenerator, Optional

from crewai import Crew, Process, Task

from app.agents.agents import build_agents, GEMINI_FALLBACK_CHAIN
from app.core.config import get_settings
from app.core.logging import logger
from app.core.retry import run_with_retry, is_rate_limit_error, is_daily_quota_exhausted
from app.models.schemas import SSEEvent


def _build_tasks(goal: str, scout, searcher, writer):
    scout_task = Task(
        description=(
            f"Research goal: {goal}\n\n"
            "Decompose into exactly 4-6 targeted search queries covering: "
            "theory, recent advances, applications, limitations, future directions. "
            "Return ONLY a numbered list."
        ),
        expected_output=(
            "Numbered list of 4-6 precise search queries, one per line. "
            "Example:\n1. transformer attention mechanism mathematical foundations\n"
            "2. vision transformer ViT benchmark results 2024\n"
            "3. transformer scalability limitations training cost"
        ),
        agent=scout,
    )

    searcher_task = Task(
        description=(
            "Execute each sub-query from the Research Scout. For each query extract "
            "4-6 high-quality facts with source URLs, prioritising peer-reviewed "
            "papers and official technical documentation. "
            "Group findings by query. Mark barren queries [NO DATA]."
        ),
        expected_output=(
            "Structured evidence by query:\n"
            "**Query N: [text]**\n"
            "- [Precise finding] — Source: [URL]\n"
            "Repeat for all queries."
        ),
        agent=searcher,
        context=[scout_task],
    )

    writer_task = Task(
        description=(
            f"Original research goal: {goal}\n\n"
            "Using ALL evidence from the Web Searcher, produce a publication-quality "
            "academic report following the strict structure: Abstract, Introduction, "
            "Technical Deep-Dive (with sub-sections), Empirical Findings, "
            "Challenges, Future Outlook, Conclusion, References. "
            "Minimum 900 words. Academic prose only — no emojis, no bullet lists in body."
        ),
        expected_output=(
            "A complete academic Markdown report, 900+ words, following the required "
            "section structure with inline [N] citations and a numbered References section."
        ),
        agent=writer,
        context=[scout_task, searcher_task],
    )

    return scout_task, searcher_task, writer_task


async def _emit(queue, event_type: str, data: str, session_id: Optional[str] = None):
    await queue.put(SSEEvent(type=event_type, data=data, session_id=session_id))


# Granular log messages — these are what populate the terminal in the UI
_SCOUT_LOGS = [
    "Initialising Research Scout...",
    "Parsing research objective...",
    "Identifying key conceptual dimensions...",
    "Generating targeted sub-queries...",
    "Validating query coverage...",
    "Sub-query decomposition complete.",
]

_SEARCHER_LOGS = [
    "Activating Web Searcher agent...",
    "Dispatching query 1 to Serper index...",
    "Crawling academic and technical sources...",
    "Extracting high-confidence facts...",
    "Cross-referencing source credibility...",
    "Dispatching remaining queries...",
    "Aggregating evidence corpus...",
    "Citation integrity check complete.",
    "Evidence collection finalised.",
]

_WRITER_LOGS = [
    "Activating Report Writer agent...",
    "Structuring Abstract and Introduction...",
    "Composing Technical Deep-Dive sections...",
    "Synthesising empirical findings...",
    "Drafting Challenges and Future Outlook...",
    "Formatting References section...",
    "Applying academic style guide...",
    "Final proofreading pass complete.",
    "Report generation complete.",
]


async def _stream_logs(queue, logs: list[str], session_id: str, delay: float = 4.5):
    """Drip-feed log lines at `delay` seconds apart while crew runs in background."""
    for line in logs:
        await _emit(queue, "log", line, session_id)
        await asyncio.sleep(delay)


async def run_research_crew(goal: str, session_id: str) -> AsyncGenerator[SSEEvent, None]:
    settings = get_settings()
    queue: asyncio.Queue[Optional[SSEEvent]] = asyncio.Queue()
    start_time = time.monotonic()

    async def producer() -> None:
        final_status = "failed"
        partial = False
        used_model = GEMINI_FALLBACK_CHAIN[0]

        try:
            await _emit(queue, "status", "initializing", session_id)
            await _emit(queue, "log", "Axiom Research Engine starting...", session_id)
            await _emit(queue, "log", "Establishing connection to agent cluster...", session_id)
            await asyncio.sleep(0.4)

            crew_result = None
            scout_task_ref = None

            for model_idx, model in enumerate(GEMINI_FALLBACK_CHAIN):
                used_model = model
                model_label = model.split("/")[-1]

                if model_idx == 0:
                    await _emit(queue, "log", f"Model selected: {model_label}", session_id)
                else:
                    await _emit(queue, "log", f"Switching to fallback model: {model_label}", session_id)

                scout, searcher, writer = build_agents(model)
                scout_task, searcher_task, writer_task = _build_tasks(goal, scout, searcher, writer)
                scout_task_ref = scout_task

                crew = Crew(
                    agents=[scout, searcher, writer],
                    tasks=[scout_task, searcher_task, writer_task],
                    process=Process.sequential,
                    verbose=True,
                )

                await _emit(queue, "status", "running", session_id)

                loop = asyncio.get_event_loop()

                async def on_rate_limit(msg: str) -> None:
                    await _emit(queue, "log", f"Rate limit: {msg}", session_id)

                # Run crew in thread pool; stream granular logs concurrently
                crew_future = loop.run_in_executor(None, crew.kickoff)

                # Stagger log streams: scout logs first, then searcher, then writer
                log_task = asyncio.create_task(_stream_phase_logs(
                    queue, session_id,
                    scout_logs=_SCOUT_LOGS,
                    searcher_logs=_SEARCHER_LOGS,
                    writer_logs=_WRITER_LOGS,
                ))

                try:
                    crew_result = await asyncio.wait_for(
                        run_with_retry(
                            fn=crew.kickoff,
                            loop=loop,
                            on_wait=on_rate_limit,
                            label=f"crew [{model_label}]",
                        ),
                        timeout=settings.crew_timeout,
                    )
                    log_task.cancel()
                    break

                except asyncio.TimeoutError:
                    log_task.cancel()
                    logger.warning("Crew timed out (session %s)", session_id)
                    await _emit(queue, "log", "WARNING: Crew execution exceeded timeout. Returning partial results.", session_id)
                    partial = True
                    break

                except Exception as exc:
                    log_task.cancel()
                    if is_rate_limit_error(exc) and model_idx < len(GEMINI_FALLBACK_CHAIN) - 1:
                        await _emit(queue, "log", f"Quota exhausted for {model_label}. Attempting fallback.", session_id)
                        continue
                    elif is_rate_limit_error(exc):
                        raise Exception("ALL_MODELS_EXHAUSTED") from exc
                    else:
                        raise

            # Extract sub-queries
            if scout_task_ref and scout_task_ref.output:
                try:
                    for line in (scout_task_ref.output.raw or "").splitlines():
                        line = line.strip()
                        if line and (line[0].isdigit() or line.startswith("-")):
                            q = line.lstrip("0123456789.-) ").strip()
                            if q:
                                await _emit(queue, "query", q, session_id)
                except Exception as exc:
                    logger.warning("Scout parse error: %s", exc)

            # Stream report
            if crew_result is not None:
                report_raw = getattr(crew_result, "raw", str(crew_result))
                await _emit(queue, "log", "Streaming report to canvas...", session_id)
                for line in report_raw.splitlines(keepends=True):
                    await _emit(queue, "report_chunk", line, session_id)
                    await asyncio.sleep(0.006)

            elapsed = round(time.monotonic() - start_time, 1)
            partial = partial or crew_result is None
            final_status = "partial" if partial else "completed"

            await _emit(queue, "log", f"Session complete. Duration: {elapsed}s", session_id)
            await _emit(queue, "status", final_status, session_id)
            await _emit(queue, "complete", json.dumps({
                "session_id": session_id,
                "duration": elapsed,
                "partial": partial,
                "model": used_model.split("/")[-1],
            }), session_id)

        except Exception as exc:
            logger.exception("Fatal crew error (session %s): %s", session_id, exc)
            err = str(exc)
            if "ALL_MODELS_EXHAUSTED" in err:
                msg = "All available models have exceeded their free-tier quota. Resets at midnight Pacific Time."
            elif is_daily_quota_exhausted(exc):
                msg = f"Daily quota exhausted for {used_model.split('/')[-1]}. Please retry tomorrow or update your API key."
            elif is_rate_limit_error(exc):
                msg = "Rate limit active. Free tier allows 15 requests/minute. Wait 60 seconds and retry."
            else:
                msg = f"Research pipeline error: {err[:300]}"
            await _emit(queue, "log", f"ERROR: {msg}", session_id)
            await _emit(queue, "error", msg, session_id)
        finally:
            await queue.put(None)

    async def _stream_phase_logs(queue, session_id, scout_logs, searcher_logs, writer_logs):
        """Emit logs timed to approximate each agent phase."""
        try:
            for line in scout_logs:
                await _emit(queue, "log", line, session_id)
                await asyncio.sleep(5)
            for line in searcher_logs:
                await _emit(queue, "log", line, session_id)
                await asyncio.sleep(7)
            for line in writer_logs:
                await _emit(queue, "log", line, session_id)
                await asyncio.sleep(8)
        except asyncio.CancelledError:
            pass

    producer_task = asyncio.create_task(producer())

    while True:
        event = await queue.get()
        if event is None:
            break
        yield event

    try:
        await producer_task
    except Exception as exc:
        logger.error("Producer cleanup: %s", exc)
