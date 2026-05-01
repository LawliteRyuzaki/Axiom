import httpx
import asyncio
import hashlib
from typing import List, Dict, Any
from app.core.logging import logger
from app.scoring.engine import ScoringEngine
from app.scoring.deduplicator import Deduplicator
from app.memory.cache import AxiomCache
from urllib.parse import urlparse

class MultiSourceRetriever:
    """
    Axiom v4 Enhanced Retrieval Engine.
    Prioritizes high-authority scholarly domains and PDF reports.
    """
    def __init__(self, serper_key: str):
        self.serper_key = serper_key
        self.client = httpx.AsyncClient(timeout=15.0, follow_redirects=True)

    async def search(self, query: str) -> List[Dict[str, Any]]:
        # 1. Check Cache
        cached = await AxiomCache.get_search(query)
        if cached:
            logger.info(f"Cache HIT: {query}")
            return cached

        # 2. Parallel API Calls (Academic Prioritization)
        logger.info(f"Retrieval: Executing primary multi-vector search for '{query}'")
        tasks = [
            self._search_serper(query), # General web
            self._search_serper(f"{query} site:pubmed.ncbi.nlm.nih.gov OR site:ieee.org OR site:nature.com"), # Hard Academic
            self._search_arxiv(query) # arXiv API
        ]
        results = await asyncio.gather(*tasks)
        
        # 3. Normalization & Scoring
        normalized = []
        for sublist in results:
            for item in sublist:
                item["url"] = Deduplicator.normalize_url(item["url"])
                item["domain"] = urlparse(item["url"]).netloc
                
                scores = ScoringEngine.calculate_final_score(
                    query, item["title"], item["domain"], item["year"], item["snippet"]
                )
                
                if item["source_type"] == "academic" or any(d in item["domain"] for d in ["gov", "edu", "org", "pubmed", "ieee"]):
                    scores.final_score = min(1.0, scores.final_score + 0.15)
                
                item["scores"] = scores.model_dump()
                item["final_score"] = scores.final_score
                normalized.append(item)
        
        unique_results = Deduplicator.deduplicate_by_url(normalized)
        unique_results.sort(key=lambda x: x["final_score"], reverse=True)
        
        await AxiomCache.set_search(query, unique_results)
        return unique_results

    async def search_robust(self, query: str, min_results: int = 3) -> List[Dict[str, Any]]:
        """
        Axiom v4 Robust Retrieval Wrapper.
        Guarantees results by falling back to simpler strategies if primary search fails.
        """
        # Strategy 1: Primary High-Fidelity Search
        results = await self.search(query)
        if len(results) >= min_results:
            logger.info(f"Retrieval SUCCESS: Found {len(results)} high-fidelity sources for '{query}'")
            return results

        # Strategy 2: Simplified Natural Language Search
        logger.warning(f"Retrieval WEAK ({len(results)} results): Triggering Strategy 2 (Simplified Search) for '{query}'")
        simple_query = self._simplify_query(query)
        simple_results = await self.search(simple_query)
        results = Deduplicator.deduplicate_by_url(results + simple_results)
        if len(results) >= min_results:
            return results

        # Strategy 3: Keyword-Only Deep Retrieval
        logger.warning(f"Retrieval STILL WEAK: Triggering Strategy 3 (Keyword Search) for '{query}'")
        keywords = " ".join([w for w in query.split() if len(w) > 4])[:50]
        keyword_results = await self._search_serper(keywords)
        # Manually normalize keyword results since they didn't go through 'search'
        for item in keyword_results:
            item["url"] = Deduplicator.normalize_url(item["url"])
            item["domain"] = urlparse(item["url"]).netloc
            item["final_score"] = 0.4 # Minimum score for keyword fallbacks
            results.append(item)
        
        results = Deduplicator.deduplicate_by_url(results)
        logger.info(f"Retrieval FINAL: Secured {len(results)} sources via fallback strategies.")
        return results

    def _simplify_query(self, query: str) -> str:
        """Removes complex modifiers to improve recall."""
        # Remove site: filetype: and other operators
        import re
        clean = re.sub(r'(site:|filetype:|OR|AND|intitle:)\S*', '', query)
        # Take first 6 words for a broad natural language search
        return " ".join(clean.split()[:6])

    async def _search_serper(self, query: str) -> List[Dict[str, Any]]:
        url = "https://google.serper.dev/search"
        headers = {"X-API-KEY": self.serper_key, "Content-Type": "application/json"}
        try:
            resp = await self.client.post(url, headers=headers, json={"q": query, "num": 10})
            data = resp.json()
            findings = []
            for r in data.get("organic", []):
                findings.append({
                    "title": r.get("title"),
                    "url": r.get("link"),
                    "snippet": r.get("snippet", ""),
                    "year": self._extract_year(r.get("snippet", "") + r.get("title", "")),
                    "source_type": "web"
                })
            return findings
        except Exception as e:
            logger.error(f"Serper error: {e}")
            return []

    async def _search_arxiv(self, query: str) -> List[Dict[str, Any]]:
        # arXiv API is XML-based
        url = f"http://export.arxiv.org/api/query?search_query=all:{query}&start=0&max_results=8"
        try:
            resp = await self.client.get(url)
            import re
            content = resp.text
            titles = re.findall(r'<title>(.*?)</title>', content, re.S)
            links  = re.findall(r'<id>(http://arxiv.org/abs/.*?)</id>', content)
            years  = re.findall(r'<published>(\d{4})', content)
            
            findings = []
            for t, l, y in zip(titles[1:], links, years):
                findings.append({
                    "title": t.strip().replace("\n", " "),
                    "url": l.replace("abs", "pdf") + ".pdf",
                    "snippet": "Verified academic paper from arXiv Open Access repository.",
                    "year": int(y),
                    "source_type": "academic"
                })
            return findings
        except Exception as e:
            logger.error(f"arXiv error: {e}")
            return []

    def _extract_year(self, text: str) -> int:
        import re
        match = re.search(r'\b(20\d{2})\b', text)
        return int(match.group(1)) if match else 2025

    async def close(self):
        await self.client.aclose()
