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
            "4. Summarize all findings — both verified and unverified — in a structured report.\n"
            "MANDATORY: You must return a detailed report of findings with their URLs and confidence scores. "
            "Report MEDIUM and HIGH confidence findings prominently. Even if confidence is LOW, "
            "include the source so the writer can make an informed judgment."
        ),
        expected_output="A comprehensive list of findings with live URLs, confidence labels, and key excerpts.",
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
            "Write a comprehensive, professional research report on this topic. "
            "Use the verified sources and findings provided by the curator as primary citations. "
            "Where source coverage is limited, supplement with your expert knowledge on the topic — "
            "but clearly distinguish between cited evidence and expert synthesis. "
            "Structure: Executive Summary, Introduction, Technical Analysis, Key Findings, "
            "Challenges & Limitations, Future Directions, References. "
            "Target 1,500–3,000 words. Use markdown headings. Cite URLs inline as [N]."
        ),
        expected_output="A well-structured, 1,500+ word research manuscript with inline citations.",
        agent=correspondent,
        context=[architect_task, curator_task, reviewer_task],
    )

    return architect_task, scout_task, curator_task, reviewer_task, writer_task
