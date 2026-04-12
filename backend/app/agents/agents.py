"""
Axiom Agent Definitions  (crewai v1.14.x)
------------------------------------------
Three specialised CrewAI agents for professional research synthesis.

Primary model chain (verified active April 2026):
  Primary   : gemini/gemini-2.0-flash      (GEMINI_API_KEY)
  Fallback 1: gemini/gemini-2.5-flash-lite (GEMINI_API_KEY)
  Fallback 2: gemini/gemini-2.0-flash-lite (GEMINI_API_KEY)
  Fallback 3: gemini/gemini-2.0-flash      (GEMINI_API_KEY_2, if set)
  Fallback 4: groq/llama-3.1-70b-versatile (GROQ_API_KEY, if set)

NOTE: gemini-1.5-flash* was permanently shut down April 30 2025 — DO NOT use it.

Rate-limit guardrails:
  ALL agents : max_rpm=3 (hard cap — prevents free-tier 429 crashes)
  max_execution_time: Scout=120s, Searcher/Writer=180s
  LLM timeout: 150s
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


def _build_fallback_chain() -> list[tuple[str, str]]:
    settings = get_settings()
    chain: list[tuple[str, str]] = [
        (m, settings.gemini_api_key) for m in GEMINI_FALLBACK_CHAIN
    ]
    secondary_key = os.environ.get("GEMINI_API_KEY_2", "").strip()
    if secondary_key:
        chain.append(("gemini/gemini-2.0-flash", secondary_key))
        logger.info("GEMINI_API_KEY_2 found — added as provider fallback")
    groq_key = os.environ.get("GROQ_API_KEY", "").strip()
    if groq_key:
        chain.append(("groq/llama-3.1-70b-versatile", groq_key))
        logger.info("GROQ_API_KEY found — added Groq/Llama-3.1 as final fallback")
    return chain


FULL_FALLBACK_CHAIN = _build_fallback_chain()


def _build_llm(model: str, api_key: str) -> LLM:
    if model.startswith("groq/"):
        os.environ["GROQ_API_KEY"] = api_key
    else:
        os.environ["GEMINI_API_KEY"] = api_key
    logger.info("LLM: %s", model)
    return LLM(
        model=model,
        api_key=api_key,
        temperature=0.25,
        max_tokens=8192,
        timeout=150,
    )


def _build_serper_tool() -> SerperDevTool:
    settings = get_settings()
    os.environ["SERPER_API_KEY"] = settings.serper_api_key
    return SerperDevTool(n_results=5)


def build_research_scout(model: str, api_key: str) -> Agent:
    return Agent(
        role="Research Scout",
        goal=(
            "Decompose the research objective into exactly 4 to 6 distinct, "
            "targeted web search queries covering: foundational theory, recent "
            "empirical advances (2023-2026), real-world applications, known "
            "limitations, and emerging research directions. "
            "Return ONLY a numbered list — no preamble, no commentary."
        ),
        backstory=(
            "You are a systematic review specialist trained in evidence-based "
            "research methodology. You design search strategies that maximise "
            "recall and precision across academic and technical sources."
        ),
        llm=_build_llm(model, api_key),
        verbose=True,
        allow_delegation=False,
        max_iter=3,
        max_execution_time=120,
        max_rpm=3,
    )


def build_web_searcher(model: str, api_key: str) -> Agent:
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
        llm=_build_llm(model, api_key),
        verbose=True,
        allow_delegation=False,
        max_iter=12,
        max_execution_time=180,
        max_rpm=3,
    )


def build_report_writer(model: str, api_key: str) -> Agent:
    return Agent(
        role="Report Writer",
        goal=(
            "Synthesise all gathered evidence into a professional, publication-quality "
            "report following this exact structure:\n\n"
            "# [Precise, Descriptive Title]\n\n"
            "## Executive Summary\n"
            "150-200 word overview. Present tense, third person.\n\n"
            "## Methodology\n"
            "Search strategy, sources, scope, limitations.\n\n"
            "## Synthesis\n"
            "### [Theme 1: Foundational Concepts]\n"
            "### [Theme 2: Current State of the Field]\n"
            "### [Theme 3: Applications and Impact]\n"
            "### [Theme 4: Challenges and Open Problems]\n"
            "Cite every claim as [N].\n\n"
            "## Future Outlook\n"
            "Trends, predictions, strategic recommendations.\n\n"
            "## Citations\n"
            "[1] Title — Source Name. URL\n\n"
            "STYLE: Professional prose. No emojis. No bullet lists in body. Min 800 words."
        ),
        backstory=(
            "You are a senior research analyst producing high-stakes intelligence "
            "reports for executive and technical audiences."
        ),
        llm=_build_llm(model, api_key),
        verbose=True,
        allow_delegation=False,
        max_iter=3,
        max_execution_time=180,
        max_rpm=3,
    )


def build_agents(model: str, api_key: str) -> tuple[Agent, Agent, Agent]:
    scout    = build_research_scout(model, api_key)
    searcher = build_web_searcher(model, api_key)
    writer   = build_report_writer(model, api_key)
    logger.info("Axiom agents ready — model: %s", model.split("/")[-1])
    return scout, searcher, writer
