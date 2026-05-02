from typing import List, Optional, Dict
from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime

class FindingScores(BaseModel):
    relevance: float = Field(default=0.0, ge=0.0, le=1.0)
    credibility: float = Field(default=0.0, ge=0.0, le=1.0)
    recency: float = Field(default=0.0, ge=0.0, le=1.0)
    final_score: float = Field(default=0.0, ge=0.0, le=1.0)

class AxiomFinding(BaseModel):
    id: str  # URL hash for deduplication
    query: str
    finding: str
    title: str
    url: str
    domain: str
    year: int
    source_type: str  # 'academic', 'news', 'government', 'web'
    scores: FindingScores
    confidence: str
    is_verified: bool = False
    verification_method: Optional[str] = None
    extracted_text: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)

class ResearchIteration(BaseModel):
    iteration_index: int
    queries: List[str]
    findings_count: int
    reviewer_feedback: Optional[str] = None
    gaps_identified: List[str] = []

class ReviewerDecision(BaseModel):
    decision: str = Field(..., description="GO or REFINE")
    reasoning: str = Field(..., description="Explanation for the decision")
    gap_queries: List[str] = Field(default=[], description="New queries if REFINE is chosen")
    coverage_percent: float = Field(default=0.0, ge=0.0, le=1.0)

class AxiomSessionState(BaseModel):
    goal: str
    roadmap: List[str] = []
    iterations: List[ResearchIteration] = []
    final_findings: List[AxiomFinding] = []
    total_token_usage: int = 0
    total_cost: float = 0.0
    model_usage: Dict[str, int] = {}  # model_name -> token_count
    start_time: datetime = Field(default_factory=datetime.now)
    end_time: Optional[datetime] = None

class ScoutQueries(BaseModel):
    queries: List[str] = Field(..., min_items=3, max_items=10)
