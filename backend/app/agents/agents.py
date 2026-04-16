
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
        chain.append(("groq/llama-3.3-70b-versatile", groq_key))
        logger.info("GROQ_API_KEY found — added Groq/Llama-3.3 as final fallback")
    return chain


FULL_FALLBACK_CHAIN = _build_fallback_chain()


def _build_llm(model: str, api_key: str, temperature: float = 0.3) -> LLM:
    if model.startswith("groq/"):
        os.environ["GROQ_API_KEY"] = api_key
    else:
        os.environ["GEMINI_API_KEY"] = api_key
    logger.info("LLM: %s (temp=%.2f)", model, temperature)
    return LLM(
        model=model,
        api_key=api_key,
        temperature=temperature,
        max_tokens=8192,
        timeout=150,
    )


def _build_serper_tool() -> SerperDevTool:
    settings = get_settings()
    os.environ["SERPER_API_KEY"] = settings.serper_api_key
    return SerperDevTool(n_results=12)


# ── Research Scout ─────────────────────────────────────────────────────────────

def build_research_scout(model: str, api_key: str) -> Agent:
    return Agent(
        role="Senior Research Scout & Information Architect",
        goal=(
            "Generate exactly 5 to 6 highly targeted search queries.\n\n"

            "CRITICAL RULE:\n"
            "- EVERY query MUST include time constraints such as: 2024, 2025, 2026, "
            "'latest', or 'recent research'\n\n"

            "COVERAGE RULE:\n"
            "- Ensure queries cover DIFFERENT aspects of the topic:\n"
            "  • foundational theory\n"
            "  • latest research\n"
            "  • real-world applications\n"
            "  • challenges/limitations\n"
            "  • future trends\n\n"

            "Queries must:\n"
            "- Be specific and professional\n"
            "- Avoid overlapping intent\n"
            "- Target diverse high-quality sources\n\n"

            "Return ONLY a numbered list."
        ),
        backstory=(
            "You are a world-class research strategist specialising in comprehensive and well-balanced search design."
        ),
        llm=_build_llm(model, api_key, temperature=0.2),
        verbose=True,
        allow_delegation=False,
        memory=True,
        max_iter=4,
        max_execution_time=120,
        max_rpm=3,
    )


# ── Web Searcher ───────────────────────────────────────────────────────────────

def build_web_searcher(model: str, api_key: str) -> Agent:
    return Agent(
        role="Expert Research Analyst & Evidence Curator",
        goal=(
            "For EACH query, extract 6–8 HIGH-QUALITY findings.\n\n"

            "RECENCY RULE:\n"
            "- At least 70% sources should be from 2024–2026\n"
            "- Older sources allowed ONLY if foundational and must be labeled [FOUNDATIONAL]\n\n"

            "SOURCE QUALITY RULE:\n"
            "- Prefer high-quality sources: arXiv, IEEE, Springer, ScienceDirect, official organizations\n"
            "- Avoid overusing ResearchGate\n\n"

            "SOURCE DIVERSITY RULE:\n"
            "- Use a WIDE variety of sources\n"
            "- Avoid repeating the same domain excessively\n"
            "- Try to introduce NEW sources for new findings\n\n"

            "COVERAGE RULE:\n"
            "- Ensure findings collectively cover:\n"
            "  • models/techniques\n"
            "  • real-world applications\n"
            "  • metrics/benchmarks\n"
            "  • limitations\n"
            "  • trends\n\n"

            "MANDATORY SOURCE RULE:\n"
            "- EVERY finding MUST include a FULL URL\n"
            "- If URL is weak → mark [LOW CONFIDENCE]\n\n"

            "DATA PRESERVATION:\n"
            "- Always include:\n"
            "  • Title\n"
            "  • URL\n"
            "  • Year\n\n"

            "OUTPUT FORMAT:\n"
            "**Query N: [query text]**\n"
            "- [Precise finding] (Year: XXXX)\n"
            "  Title: [Exact title]\n"
            "  URL: [Full link]\n"
            "  Credibility: [HIGH/MED/LOW]\n"
        ),
        backstory=(
            "You are a senior research analyst focused on diverse, high-quality, and well-balanced evidence collection."
        ),
        tools=[_build_serper_tool()],
        llm=_build_llm(model, api_key, temperature=0.15),
        verbose=True,
        allow_delegation=False,
        memory=True,
        max_iter=15,
        max_execution_time=180,
        max_rpm=3,
    )


# ── Report Writer ──────────────────────────────────────────────────────────────

def build_report_writer(model: str, api_key: str) -> Agent:
    return Agent(
        role="Principal Research Analyst & Scientific Writer",
        goal=(
            "Write a structured research report using ONLY the provided findings.\n\n"

            "STRICT CITATION POLICY:\n"
            "- Use ONLY URLs provided\n"
            "- Do not invent sources\n"
            "- Remove unsupported claims\n\n"

            "SOURCE DIVERSITY RULE:\n"
            "- Use a wide range of references\n"
            "- Avoid over-relying on a few sources\n\n"

            "COVERAGE RULE:\n"
            "- Ensure ALL major aspects are covered:\n"
            "  • background\n"
            "  • current state\n"
            "  • applications\n"
            "  • challenges\n"
            "  • future trends\n\n"

            "REFERENCE FORMATTING RULE:\n"
            "- Format cleanly:\n"
            "  [1] Title. Source, Year.\n"
            "      URL: link\n"
            "- No author spam\n"
            "- No merging\n\n"

            "REFERENCE CONSISTENCY RULE (FINAL FIX):\n"
            "- Each UNIQUE URL must have ONE UNIQUE reference number\n"
            "- Different URLs MUST have DIFFERENT reference numbers\n"
            "- NEVER assign the same reference number to multiple different sources\n"
            "- Reuse a reference number ONLY when the URL is EXACTLY identical\n\n"

            "Write clearly, concisely, and with strong evidence."
        ),
        backstory=(
            "You are a principal analyst producing comprehensive, balanced, and well-cited research reports."
        ),
        llm=_build_llm(model, api_key, temperature=0.4),
        verbose=True,
        allow_delegation=False,
        memory=True,
        max_iter=5,
        max_execution_time=240,
        max_rpm=3,
    )


# ── Builder ────────────────────────────────────────────────────────────────────

def build_agents(model: str, api_key: str) -> tuple[Agent, Agent, Agent]:
    scout    = build_research_scout(model, api_key)
    searcher = build_web_searcher(model, api_key)
    writer   = build_report_writer(model, api_key)
    logger.info(
        "Axiom agents ready — model: %s | Scout(temp=0.2) Searcher(temp=0.15) Writer(temp=0.4)",
        model.split("/")[-1]
    )
    return scout, searcher, writer

