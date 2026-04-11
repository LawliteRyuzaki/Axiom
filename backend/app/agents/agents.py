"""
Axiom Agent Definitions  (crewai v1.14.x)
------------------------------------------
Three specialised CrewAI agents for professional research synthesis.

Model chain (verified active April 2026, separate quota pools):
  Primary   : gemini-2.0-flash
  Fallback 1: gemini-2.5-flash-lite
  Fallback 2: gemini-2.0-flash-lite

NOTE: gemini-1.5-flash* was permanently shut down April 30 2025 — DO NOT use it.
max_rpm=3 protects the shared 15 RPM free-tier limit across all agents.
"""

import os
from crewai import Agent, LLM
from crewai_tools import SerperDevTool

from app.core.config import get_settings
from app.core.logging import logger

GEMINI_FALLBACK_CHAIN = [
    "gemini/gemini-2.0-flash",
    "gemini/gemini-2.5-flash-lite",
    "gemini/gemini-2.0-flash-lite",
]


def _build_llm(model: str) -> LLM:
    settings = get_settings()
    os.environ["GEMINI_API_KEY"] = settings.gemini_api_key
    logger.info("LLM: %s", model)
    return LLM(
        model=model,
        api_key=settings.gemini_api_key,
        temperature=0.25,
        max_tokens=8192,
        timeout=50,
    )


def _build_serper_tool() -> SerperDevTool:
    settings = get_settings()
    os.environ["SERPER_API_KEY"] = settings.serper_api_key
    return SerperDevTool(n_results=6)


def build_research_scout(model: str) -> Agent:
    """Decomposes research objective into 4-6 precise sub-queries."""
    return Agent(
        role="Research Scout",
        goal=(
            "Decompose the research objective into exactly 4 to 6 distinct, "
            "targeted web search queries covering: foundational theory, recent "
            "empirical advances (2023-2025), real-world applications, known "
            "limitations, and emerging research directions. "
            "Return ONLY a numbered list — no preamble, no commentary."
        ),
        backstory=(
            "You are a systematic review specialist trained in evidence-based "
            "research methodology. You design search strategies that maximise "
            "recall and precision across academic and technical sources."
        ),
        llm=_build_llm(model),
        verbose=True,
        allow_delegation=False,
        max_iter=3,
        max_execution_time=45,
        max_rpm=3,
    )


def build_web_searcher(model: str) -> Agent:
    """Executes sub-queries, extracts structured evidence with source citations."""
    return Agent(
        role="Web Searcher",
        goal=(
            "For each sub-query, search the web and extract 4-6 high-quality "
            "facts, findings, or statistics. Prioritise: peer-reviewed papers, "
            "conference proceedings, official documentation, and reputable "
            "technical publications. Record the source URL for every fact. "
            "Group output by query. Mark queries with no useful results [NO DATA]."
        ),
        backstory=(
            "You are a research librarian and intelligence analyst. You evaluate "
            "source credibility, extract information-dense findings, and maintain "
            "rigorous citation hygiene. You never fabricate sources."
        ),
        tools=[_build_serper_tool()],
        llm=_build_llm(model),
        verbose=True,
        allow_delegation=False,
        max_iter=12,
        max_execution_time=75,
        max_rpm=3,
    )


def build_report_writer(model: str) -> Agent:
    """Synthesises all evidence into a professional structured Markdown report."""
    return Agent(
        role="Report Writer",
        goal=(
            "Synthesise all gathered evidence into a professional, publication-quality "
            "report following this exact structure:\n\n"
            "# [Precise, Descriptive Title]\n\n"
            "## Executive Summary\n"
            "A concise 150-200 word overview of the research objective, key findings, "
            "and strategic implications. Written in present tense, third person.\n\n"
            "## Methodology\n"
            "Describe the research approach: search strategy, sources consulted, "
            "scope, and any limitations of the evidence base.\n\n"
            "## Synthesis\n"
            "### [Theme 1: Foundational Concepts]\n"
            "### [Theme 2: Current State of the Field]\n"
            "### [Theme 3: Applications and Impact]\n"
            "### [Theme 4: Challenges and Open Problems]\n"
            "In-depth analysis integrating evidence across sources. "
            "Use precise technical language. Cite every claim as [N].\n\n"
            "## Future Outlook\n"
            "Emerging trends, predicted developments, and strategic recommendations.\n\n"
            "## Citations\n"
            "[1] Title — Source Name. URL\n"
            "Number each citation sequentially. Include every referenced URL.\n\n"
            "STYLE RULES: Professional third-person prose. No casual language. "
            "No emojis. No generic headings. Body text in paragraphs, not bullets. "
            "Minimum 800 words."
        ),
        backstory=(
            "You are a senior research analyst and technical writer who produces "
            "high-stakes intelligence reports for executive and technical audiences. "
            "You write with the precision of a McKinsey report and the depth of an "
            "ACM survey paper."
        ),
        llm=_build_llm(model),
        verbose=True,
        allow_delegation=False,
        max_iter=3,
        max_execution_time=90,
        max_rpm=3,
    )


def build_agents(model: str) -> tuple[Agent, Agent, Agent]:
    scout   = build_research_scout(model)
    searcher = build_web_searcher(model)
    writer  = build_report_writer(model)
    logger.info("Axiom agents ready — model: %s", model.split("/")[-1])
    return scout, searcher, writer
