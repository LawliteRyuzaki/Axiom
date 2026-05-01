from crewai import Task
from typing import Tuple
from app.models.structured import ScoutQueries

def _build_tasks(goal: str, architect, scout, curator, reviewer, correspondent) -> Tuple[Task, Task, Task, Task, Task]:
    """
    Axiom v4 Centralized Task Builder.
    Decoupled from orchestrator to prevent circular imports.
    """
    architect_task = Task(
        description=(
            f"Research Goal: {goal}\n\n"
            "Analyze the core objective and design a technical research roadmap. "
            "Identify exactly what information is required to provide a staff-level answer."
        ),
        expected_output="A structured 3-phase technical research roadmap.",
        agent=architect,
    )

    scout_task = Task(
        description=(
            "Based on the architect's roadmap, generate a structured list of 5-8 hyper-optimized search queries. "
            "Focus on technical metrics, benchmarks, and primary research sources. "
            "MANDATORY: You must return the queries as a JSON object: {\"queries\": [\"query1\", ...]}."
        ),
        expected_output="A JSON object containing a list of 5-8 technical search queries.",
        agent=scout,
        context=[architect_task],
    )

    curator_task = Task(
        description=(
            "1. Iterate through EVERY query provided by the scout.\n"
            "2. For EACH query, execute 'axiom_deep_search' to find primary sources.\n"
            "3. Collect all candidate URLs and run 'axiom_batch_verifier' to confirm technical truth.\n"
            "MANDATORY: You must return a detailed report of verified findings. "
            "If no data is found, explicitly state 'NO VERIFIED DATA FOUND'."
        ),
        expected_output="A comprehensive list of verified findings with live URLs and truth scores.",
        agent=curator,
        context=[scout_task],
    )

    reviewer_task = Task(
        description=(
            "Critically audit the verified evidence. "
            "Identify any remaining gaps or technical contradictions. "
            "Output: DECISION: GO or DECISION: REFINE [Provide gap details]"
        ),
        expected_output="A formal audit decision with specific refinement queries if required.",
        agent=reviewer,
        context=[curator_task],
    )

    writer_task = Task(
        description=(
            f"Original research goal: {goal}\n\n"
            "Synthesize the DETERMINISTICALLY VERIFIED evidence into a professional report. "
            "Maintain 1:1 RAW URL integrity. No hallucination."
        ),
        expected_output="A high-fidelity research manuscript with 100% verified citations.",
        agent=correspondent,
        context=[architect_task, curator_task, reviewer_task],
    )

    return architect_task, scout_task, curator_task, reviewer_task, writer_task
