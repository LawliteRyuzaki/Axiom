import time
from typing import List, Dict, Any, Optional

class AxiomCache:
    """
    Axiom v4 High-Performance Caching Layer.
    Reduces latency by storing search results and validation status.
    """
    _search_cache: Dict[str, Dict[str, Any]] = {}
    _validation_cache: Dict[str, Dict[str, Any]] = {}
    
    # TTL: 1 hour for searches, 24 hours for URL validation
    SEARCH_TTL = 3600
    VALIDATION_TTL = 86400

    @classmethod
    def get_search(cls, query: str) -> Optional[List[Dict[str, Any]]]:
        cached = cls._search_cache.get(query)
        if cached and (time.time() - cached["timestamp"] < cls.SEARCH_TTL):
            return cached["data"]
        return None

    @classmethod
    def set_search(cls, query: str, data: List[Dict[str, Any]]):
        cls._search_cache[query] = {
            "data": data,
            "timestamp": time.time()
        }

    @classmethod
    def get_validation(cls, url: str) -> Optional[Dict[str, Any]]:
        cached = cls._validation_cache.get(url)
        if cached and (time.time() - cached["timestamp"] < cls.VALIDATION_TTL):
            return cached["data"]
        return None

    @classmethod
    def set_validation(cls, url: str, is_valid: bool, score: float):
        cls._validation_cache[url] = {
            "data": {"is_valid": is_valid, "score": score},
            "timestamp": time.time()
        }
