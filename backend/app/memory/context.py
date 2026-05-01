import asyncio
import threading
from typing import List, Dict, Any, Set
from app.models.structured import AxiomSessionState, AxiomFinding, ResearchIteration
from app.core.logging import logger

class ResearchContext:
    """
    Axiom v4 Central Research State.
    Thread-safe, structured source of truth for the entire pipeline.
    """
    def __init__(self, goal: str):
        self.state = AxiomSessionState(goal=goal)
        self._lock = threading.Lock()
        self.rejected_urls: Set[str] = set()
        self.validated_urls: Set[str] = set()

    async def add_findings(self, findings: List[AxiomFinding]):
        with self._lock:
            for f in findings:
                if f.id not in [existing.id for existing in self.state.final_findings]:
                    self.state.final_findings.append(f)
                    self.validated_urls.add(f.url)

    async def add_rejected_url(self, url: str, reason: str):
        with self._lock:
            self.rejected_urls.add(url)
            logger.info(f"URL Rejected: {url} | Reason: {reason}")

    async def record_iteration(self, iteration: ResearchIteration):
        with self._lock:
            self.state.iterations.append(iteration)

    async def get_summary(self) -> Dict[str, Any]:
        with self._lock:
            return {
                "goal": self.state.goal,
                "findings_count": len(self.state.final_findings),
                "iterations_count": len(self.state.iterations),
                "validated_count": len(self.validated_urls),
                "rejected_count": len(self.rejected_urls)
            }

    async def get_all_findings(self) -> List[AxiomFinding]:
        with self._lock:
            return self.state.final_findings.copy()
