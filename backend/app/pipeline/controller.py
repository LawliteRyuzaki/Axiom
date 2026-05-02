import asyncio
import time
import uuid
import json
import re
from typing import List, Dict, Any, Optional
from app.core.logging import logger
from app.memory.context import ResearchContext
from app.models.structured import ResearchIteration, AxiomFinding
from app.agents.agents import build_agents
from app.pipeline.tasks import _build_tasks
from crewai import Crew, Process

class ResearchPipeline:
    """
    Axiom v4 Staff-Level Research Pipeline.
    Deterministic controller for the multi-stage research lifecycle.
    """
    def __init__(self, goal: str, max_iterations: int = 3):
        self.goal = goal
        self.max_iterations = max_iterations
        self.context = ResearchContext(goal)
        self.trace_id = str(uuid.uuid4())[:8]
        self.start_time = time.monotonic()

    async def run(self, fallback_chain: List[tuple[str, str]], emitter=None) -> str:
        """
        Executes the research lifecycle with automated fallback recovery.
        """
        logger.info(f"[{self.trace_id}] Pipeline initiated for: {self.goal}")
        loop = asyncio.get_event_loop()
        
        current_chain_index = 0
        while current_chain_index < len(fallback_chain):
            model, api_key = fallback_chain[current_chain_index]
            try:
                # 1. Initialize Agents with current model and context
                agents = build_agents(model, api_key, context=self.context)
                
                # 2. Iterative Discovery Phase
                current_iteration = 0
                while current_iteration < self.max_iterations:
                    current_iteration += 1
                    it_start = time.monotonic()
                    
                    if emitter:
                        await emitter("log", f"Discovery Phase (Iteration {current_iteration}/{self.max_iterations}) using {model.split('/')[-1]}...")

                    tasks = _build_tasks(self.goal, *agents)
                    discovery_tasks = tasks[:4]
                    
                    # --- STAGE 1: ARCHITECT ---
                    architect_crew = Crew(agents=[agents[0]], tasks=[tasks[0]], verbose=True)
                    await architect_crew.kickoff_async()
                    if emitter: await emitter("log", "Stage 1: Research roadmap finalized.")

                    # --- STAGE 2: SCOUT ---
                    scout_crew = Crew(agents=[agents[1]], tasks=[tasks[1]], verbose=True)
                    scout_result = await scout_crew.kickoff_async()
                    
                    try:
                        # Axiom v4: Robust JSON extraction (handles both Pydantic and raw text filler)
                        raw_output = str(scout_result.raw)
                        json_match = re.search(r'\{.*\}', raw_output, re.DOTALL)
                        
                        if json_match:
                            data = json.loads(json_match.group())
                            queries = data.get("queries", [])
                        else:
                            # Fallback: simple line parsing if JSON fails
                            queries = [line.strip("- ").strip() for line in raw_output.splitlines() if "?" in line or len(line) > 10]
                        
                        if len(queries) < 3:
                            raise ValueError(f"Insufficient queries generated ({len(queries)})")
                        
                        if emitter: 
                            await emitter("log", f"Stage 2: {len(queries)} research queries generated.")
                            for q in queries: await emitter("log", f"  ↳ {q}")
                    except Exception as e:
                        logger.error(f"[{self.trace_id}] Scout Failure: {e}")
                        raise Exception(f"Scout failed to generate valid queries: {e}")

                    # --- STAGE 3: SEARCHER / CURATOR ---
                    curator_crew = Crew(agents=[agents[2]], tasks=[tasks[2]], verbose=True)
                    await curator_crew.kickoff_async()
                    
                    # Verify findings in context
                    all_findings = await self.context.get_all_findings()
                    if emitter: await emitter("log", f"Stage 3: Search complete. {len(all_findings)} sources identified.")

                    # --- STAGE 4: REVIEWER ---
                    reviewer_crew = Crew(agents=[agents[3]], tasks=[tasks[3]], verbose=True)
                    discovery_result = await reviewer_crew.kickoff_async()
                    
                    # Deterministic Decision Logic (Rebalanced v4)
                    verified_findings = [f for f in all_findings if f.confidence in ["HIGH", "MEDIUM"]]
                    
                    # Calculate Coverage Score
                    coverage_score = sum(1.0 if f.confidence == "HIGH" else 0.6 for f in verified_findings)
                    target_coverage = 4.0 
                    coverage_percent = min(1.0, coverage_score / target_coverage)
                    
                    logger.info(f"[{self.trace_id}] Research Coverage: {round(coverage_percent * 100, 1)}%")
                    if emitter: await emitter("log", f"Stage 4: Quality Audit - {round(coverage_percent*100)}% coverage.")

                    # Final Decision
                    decision = str(discovery_result).upper()
                    
                    # STRICT GUARD: No data = REFINE
                    if coverage_percent == 0 or not verified_findings:
                        if emitter: await emitter("log", "⚠️ Quality Audit: INSUFFICIENT DATA. Pivoting research queries...")
                        await self.context.record_iteration(ResearchIteration(
                            iteration_index=current_iteration,
                            queries=queries, 
                            findings_count=len(verified_findings), 
                            reviewer_feedback=str(discovery_result)
                        ))
                        continue # Re-run loop

                    if (coverage_percent >= 0.35) or (coverage_percent >= 0.1 and ("GO" in decision)):
                        status_msg = f"Quality Audit: SUFFICIENT. Proceeding to synthesis."
                        if emitter: await emitter("log", f"✅ {status_msg}")
                        break
                    else:
                        if emitter: await emitter("log", f"Quality Audit: INCOMPLETE ({round(coverage_percent*100)}%). Refining...")
                        await self.context.record_iteration(ResearchIteration(
                            iteration_index=current_iteration,
                            queries=queries, 
                            findings_count=len(verified_findings), 
                            reviewer_feedback=str(discovery_result)
                        ))

                # --- STAGE 5: WRITER ---
                all_findings = await self.context.get_all_findings()
                verified_findings = [f for f in all_findings if f.confidence in ["HIGH", "MEDIUM"]]
                
                if not verified_findings:
                    # v4: Production Fallback - Don't abort, try to synthesize what we have or a placeholder
                    logger.warning(f"[{self.trace_id}] Synthesis triggered with ZERO verified findings. Attempting partial synthesis.")
                    if emitter: await emitter("log", "⚠️ Synthesis: No verified evidence found. Generating partial findings report...")
                else:
                    if emitter: await emitter("log", f"Stage 5: Synthesizing {len(verified_findings)} verified sources into manuscript...")
                
                writer_task = tasks[4]
                synthesis_crew = Crew(agents=[agents[4]], tasks=[writer_task], verbose=True)
                final_report = await synthesis_crew.kickoff_async()
                
                total_duration = round(time.monotonic() - self.start_time, 2)
                logger.info(f"[{self.trace_id}] Research complete. Total duration: {total_duration}s")
                return str(final_report)

            except Exception as exc:
                err_msg = str(exc)
                if "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg:
                    current_chain_index += 1
                    if current_chain_index < len(fallback_chain):
                        next_model = fallback_chain[current_chain_index][0].split("/")[-1]
                        logger.warning(f"[{self.trace_id}] Quota exhausted for {model}. Pivoting to {next_model}...")
                        if emitter:
                            await emitter("log", f"⚠️ Quota exhausted for {model.split('/')[-1]}. Pivoting to {next_model}...")
                        continue
                raise exc

        return "Error: All models in the fallback chain were exhausted."
