"""
Retry & Rate-Limit Utilities
─────────────────────────────
Wraps synchronous callables (crew.kickoff) with:
  - Automatic detection of 429 / RESOURCE_EXHAUSTED errors
  - Respects the Retry-After hint from the error payload
  - Exponential backoff with human-readable SSE progress messages
  - Hard cap: MAX_ATTEMPTS before giving up cleanly
"""

import asyncio
import re
from typing import Any, Callable, Coroutine, TypeVar

from app.core.logging import logger

T = TypeVar("T")

# Seconds to wait if no Retry-After is provided in the error
_DEFAULT_BACKOFF = [65, 90, 120]
MAX_ATTEMPTS = 3


def _extract_retry_after(error_str: str) -> float | None:
    """Parse 'retryDelay: 54.47s' or 'retry in 54 seconds' from the error message."""
    m = re.search(r"retryDelay['\"]?\s*[=:]\s*['\"]?(\d+(?:\.\d+)?)\s*s", error_str, re.IGNORECASE)
    if m:
        return float(m.group(1))
    m = re.search(r"retry.*?in\s+(\d+(?:\.\d+)?)\s*s", error_str, re.IGNORECASE)
    if m:
        return float(m.group(1))
    m = re.search(r"(\d+(?:\.\d+)?)\s*second", error_str, re.IGNORECASE)
    if m:
        return float(m.group(1))
    return None


def is_rate_limit_error(exc: Exception) -> bool:
    """Return True if this exception is a Gemini 429 / quota-exhausted error."""
    msg = str(exc).lower()
    return any(k in msg for k in (
        "429",
        "resource_exhausted",
        "rate limit",
        "quota exceeded",
        "you exceeded your current quota",
    ))


def is_daily_quota_exhausted(exc: Exception) -> bool:
    """
    Return True specifically when the *daily* quota is gone (limit: 0).
    This is distinct from per-minute rate limiting — a retry won't help;
    we need to switch models instead.
    """
    msg = str(exc)
    return "limit: 0" in msg or "GenerateRequestsPerDayPerProject" in msg


async def run_with_retry(
    fn: Callable[[], T],
    loop: asyncio.AbstractEventLoop,
    on_wait: Callable[[str], Coroutine[Any, Any, None]] | None = None,
    label: str = "operation",
) -> T:
    """
    Run a synchronous callable in the thread pool, retrying on per-minute 429s.

    Raises immediately (without retrying) if the daily quota is exhausted —
    the caller should then switch to the next model in the fallback chain.

    Args:
        fn:       Sync callable to run (e.g. crew.kickoff)
        loop:     Running asyncio event loop
        on_wait:  Async callback called with a progress message before each wait
        label:    Name for log messages
    """
    last_exc: Exception | None = None

    for attempt in range(MAX_ATTEMPTS):
        try:
            return await loop.run_in_executor(None, fn)

        except Exception as exc:
            last_exc = exc

            if not is_rate_limit_error(exc):
                raise  # Not rate-related — propagate immediately

            # Daily quota gone — signal caller to try next model
            if is_daily_quota_exhausted(exc):
                logger.warning("%s: daily quota exhausted — signalling model switch", label)
                raise  # Caller catches this and moves to fallback

            # Per-minute limit — parse wait time and retry
            error_str = str(exc)
            suggested = _extract_retry_after(error_str)
            wait = suggested or _DEFAULT_BACKOFF[min(attempt, len(_DEFAULT_BACKOFF) - 1)]

            if attempt + 1 >= MAX_ATTEMPTS:
                logger.error(
                    "%s: rate-limited on final attempt %d/%d — giving up",
                    label, attempt + 1, MAX_ATTEMPTS,
                )
                break

            logger.warning(
                "%s: per-minute rate limit (attempt %d/%d) — waiting %.0fs",
                label, attempt + 1, MAX_ATTEMPTS, wait,
            )

            if on_wait:
                mins = int(wait // 60)
                secs = int(wait % 60)
                time_str = f"{mins}m {secs}s" if mins else f"{secs}s"
                await on_wait(
                    f"⏳ Rate limit hit — auto-retrying in {time_str} "
                    f"(attempt {attempt + 1}/{MAX_ATTEMPTS})..."
                )

            await asyncio.sleep(wait)

    raise last_exc  # type: ignore[misc]
