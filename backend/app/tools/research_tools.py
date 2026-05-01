from typing import Any
from crewai.tools import BaseTool
from app.retrieval.engine import MultiSourceRetriever
from app.verification.validator import SourceValidator
from app.core.config import get_settings
from app.memory.cache import AxiomCache
import asyncio
import json
import hashlib
from app.models.structured import AxiomFinding, FindingScores

class AxiomDeepSearchTool(BaseTool):
    name: str = "axiom_deep_search"
    description: str = "Axiom v4 High-Performance Search. Concurrently queries hybrid sources and returns ranked, deduplicated results."

    def _run(self, query: str) -> str:
        logger.info(f"Tool: axiom_deep_search | Query: {query}")
        settings = get_settings()
        retriever = MultiSourceRetriever(settings.serper_api_key)
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            results = loop.run_until_complete(retriever.search_robust(query))
            
            # v4: Robust threshold handling. 
            # If we have very few high-score results, we allow lower-score ones to pass.
            primary_threshold = settings.scoring_threshold
            filtered = [r for r in results if r["final_score"] >= primary_threshold]
            
            if len(filtered) < 3:
                logger.warning(f"Tool: axiom_deep_search | Only {len(filtered)} results above threshold. Relaxing for robustness.")
                filtered = results[:8] # Take top 8 regardless of score to ensure data flow
                
            return json.dumps(filtered[:10], indent=2)
        finally:
            loop.run_until_complete(retriever.close())
            loop.close()

class AxiomBatchVerifierTool(BaseTool):
    name: str = "axiom_batch_verifier"
    description: str = (
        "Axiom v4 High-Throughput Validator. Accepts a JSON list of {url, claim} objects. "
        "Performs parallel hard content verification. Use this to validate MANY sources at once. "
        "Returns confidence labels (HIGH/MEDIUM/LOW)."
    )
    context: Any = None # Axiom v4 Context Injection

    def _run(self, targets_json: str) -> str:
        logger.info(f"Tool: axiom_batch_verifier | Batch size: {targets_json.count('url')}")
        """
        Input: '[{"url": "...", "claim": "..."}, ...]'
        """
        try:
            targets = json.loads(targets_json)
            if not isinstance(targets, list):
                return "Error: Input must be a JSON list of objects."
        except Exception as e:
            return f"Error parsing input: {e}"

        validator = SourceValidator()
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            # Execute batch validation in parallel
            results = loop.run_until_complete(validator.validate_batch(targets))
            
            outcome = []
            for target, res in zip(targets, results):
                is_valid, score, confidence, error = res
                outcome.append({
                    "url": target["url"],
                    "status": "VERIFIED" if is_valid else "REJECTED",
                    "confidence": confidence,
                    "score": round(score, 2),
                    "error": error
                })
                
                # Axiom v4: Automatically populate the ResearchContext if available
                if self.context and is_valid:
                    finding_id = hashlib.md5(target["url"].encode()).hexdigest()[:12]
                    finding = AxiomFinding(
                        id=finding_id,
                        query=target.get("query", "Verification Cycle"),
                        finding=target["claim"],
                        title=target.get("title", "Verified Source"),
                        url=target["url"],
                        domain=target["url"].split("//")[-1].split("/")[0],
                        year=2024, # Default or extracted
                        scores=FindingScores(final_score=score),
                        confidence=confidence,
                        is_verified=True
                    )
                    # We run this in the background or use the existing loop
                    loop.run_until_complete(self.context.add_findings([finding]))

            return json.dumps(outcome, indent=2)
        finally:
            loop.run_until_complete(validator.close())
            loop.close()
