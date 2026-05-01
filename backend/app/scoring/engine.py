from datetime import datetime
from typing import Dict, Any, List
from app.models.structured import FindingScores, AxiomFinding
from app.core.logging import logger

class ScoringEngine:
    """
    Axiom v4 Deterministic Scoring & Contradiction Detection.
    """
    
    TRUSTED_DOMAINS = {
        "academic": ["arxiv.org", "ieee.org", "nature.com", "science.org", "mit.edu", "stanford.edu"],
        "news": ["reuters.com", "apnews.com", "thehindu.com", "nytimes.com", "bloomberg.com"],
        "government": ["gov", "nih.gov", "who.int", "un.org", "prsindia.org"]
    }

    @classmethod
    def calculate_final_score(cls, query: str, title: str, domain: str, year: int, snippet: str) -> FindingScores:
        relevance   = cls._calculate_relevance(query, title, snippet)
        credibility = cls._calculate_credibility(domain)
        recency     = cls._calculate_recency(year)
        
        # v4 Weighted Formula: 0.4 Relevance, 0.35 Credibility, 0.25 Recency
        final = (0.4 * relevance) + (0.35 * credibility) + (0.25 * recency)
        
        return FindingScores(
            relevance=round(relevance, 2),
            credibility=round(credibility, 2),
            recency=round(recency, 2),
            final_score=round(final, 2)
        )

    @classmethod
    def detect_contradictions(cls, findings: List[AxiomFinding]) -> List[Dict[str, Any]]:
        """
        Identifies findings that may contradict each other based on keywords.
        """
        contradictions = []
        # Simple keyword-based contradiction detection (e.g. "increase" vs "decrease")
        conflict_pairs = [("increase", "decrease"), ("rising", "falling"), ("success", "failure")]
        
        for i in range(len(findings)):
            for j in range(i + 1, len(findings)):
                f1, f2 = findings[i], findings[j]
                text1, text2 = f1.finding.lower(), f2.finding.lower()
                
                for word1, word2 in conflict_pairs:
                    if (word1 in text1 and word2 in text2) or (word2 in text1 and word1 in text2):
                        # Potential contradiction
                        contradictions.append({
                            "type": "potential_contradiction",
                            "sources": [f1.url, f2.url],
                            "terms": [word1, word2],
                            "recommendation": f"Prioritize {f1.url if f1.scores.credibility >= f2.scores.credibility else f2.url} (Higher Credibility)"
                        })
        return contradictions

    @staticmethod
    def _calculate_relevance(query: str, title: str, snippet: str) -> float:
        query_terms = set(query.lower().split())
        content = (title + " " + snippet).lower()
        matches = sum(1 for term in query_terms if term in content)
        return min(1.0, matches / max(1, len(query_terms)))

    @classmethod
    def _calculate_credibility(cls, domain: str) -> float:
        domain = domain.lower()
        if any(d in domain for d in cls.TRUSTED_DOMAINS["academic"]): return 1.0
        if any(d in domain for d in cls.TRUSTED_DOMAINS["government"]): return 0.95
        if any(d in domain for d in cls.TRUSTED_DOMAINS["news"]): return 0.85
        if domain.endswith((".org", ".edu")): return 0.80
        return 0.50

    @staticmethod
    def _calculate_recency(year: int) -> float:
        current_year = 2026
        diff = current_year - year
        if diff <= 0: return 1.0
        if diff == 1: return 0.95
        if diff == 2: return 0.85
        if diff <= 5: return 0.70
        return 0.40
