from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
import uuid


# ── Request / Response models ─────────────────────────────────────────────────

class ResearchRequest(BaseModel):
    goal: str = Field(
        ...,
        min_length=10,
        max_length=500,
        description="The research goal or question to investigate",
        examples=["What are the latest advancements in quantum computing for cryptography?"],
    )


class ResearchSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    goal: str
    status: Literal["queued", "running", "completed", "failed", "partial"] = "queued"
    report: Optional[str] = None
    sources: list[str] = []
    sub_queries: list[str] = []
    error: Optional[str] = None
    partial: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None


class SessionSummary(BaseModel):
    id: str
    goal: str
    status: str
    partial: bool
    created_at: datetime
    duration_seconds: Optional[float]


# ── SSE event payloads ────────────────────────────────────────────────────────

class SSEEvent(BaseModel):
    """Represents a single Server-Sent Event payload."""
    type: Literal[
        "status",       # Agent lifecycle update
        "progress",     # Human-readable progress (legacy)
        "log",          # Granular terminal log line
        "reasoning",    # Internal thought process of the agent
        "thought",      # Short, punchy thought bubbles
        "query",        # A sub-query discovered by Scout
        "source",       # A source URL found
        "report_chunk", # A streaming chunk of the Markdown report
        "complete",     # Final event with session metadata JSON
        "error",        # Terminal error message
    ]
    data: str
    session_id: Optional[str] = None


# ── Search cache model ────────────────────────────────────────────────────────

class CachedSearch(BaseModel):
    query_hash: str
    query: str
    results: list[dict]
    created_at: datetime = Field(default_factory=datetime.utcnow)
