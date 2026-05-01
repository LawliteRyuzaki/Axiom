import hashlib
from typing import List, Dict, Any
from app.models.structured import AxiomFinding

class Deduplicator:
    """
    Axiom v4 Deterministic Deduplication.
    Uses URL hashing and semantic clustering to ensure unique evidence.
    """
    
    @staticmethod
    def deduplicate_by_url(findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Removes exact URL duplicates, keeping the one with the highest score.
        """
        seen: Dict[str, Dict[str, Any]] = {}
        for f in findings:
            url_hash = hashlib.md5(f["url"].lower().strip().encode()).hexdigest()
            if url_hash not in seen:
                seen[url_hash] = f
            else:
                # Keep the one with higher final score
                if f.get("final_score", 0) > seen[url_hash].get("final_score", 0):
                    seen[url_hash] = f
        
        return list(seen.values())

    @staticmethod
    def normalize_url(url: str) -> str:
        """
        Standardizes URLs to improve hash-based deduplication.
        """
        url = url.split("#")[0] # Remove fragments
        if url.endswith("/"):
            url = url[:-1]
        return url.lower().strip()
