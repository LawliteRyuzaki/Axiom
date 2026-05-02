
import os
from crewai import Agent, LLM
from crewai_tools import SerperDevTool
from crewai.tools import BaseTool
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
    
    # Axiom v4: Enhanced LLM initialization with provider-specific fallbacks
    try:
        return LLM(
            model=model,
            api_key=api_key,
            temperature=temperature,
            max_tokens=8192,
            timeout=150,
        )
    except Exception as e:
        if "groq" in model.lower():
            logger.warning(f"Native Groq provider failed, falling back to OpenAI-compatible endpoint: {e}")
            # Use OpenAI compatibility layer for Groq without a prefix to avoid strict validation
            return LLM(
                model="llama-3.3-70b-versatile",
                api_key=api_key,
                base_url="https://api.groq.com/openai/v1",
                temperature=temperature,
                max_tokens=8192,
                timeout=150,
            )
        raise e


def _build_serper_tool() -> SerperDevTool:
    settings = get_settings()
    os.environ["SERPER_API_KEY"] = settings.serper_api_key
    return SerperDevTool(n_results=12)


def build_research_architect(model: str, api_key: str) -> Agent:
    return Agent(
        role="Principal System Architect",
        goal=(
            "Deconstruct the research goal into a verifiable, 3-phase technical roadmap.\n"
            "Identify exactly which quantitative metrics and primary sources are required."
        ),
        backstory="You are a systems architect for a global intelligence agency, specialized in creating bulletproof investigation frameworks.",
        llm=_build_llm(model, api_key, temperature=0.1),
        verbose=True,
        allow_delegation=False
    )

def build_research_scout(model: str, api_key: str) -> Agent:
    return Agent(
        role="Information Architecture Scout",
        goal=(
            "1. Generate exactly 5-8 hyper-targeted search queries based on the architect's roadmap.\n"
            "2. Ensure queries target official whitepapers, peer-reviewed journals, and technical benchmarks.\n"
            "MANDATORY: You MUST return the queries in a structured JSON format."
        ),
        backstory=(
            "You are a master of search heuristic design. You operate under a strict protocol: "
            "Every research roadmap must be broken into exactly 5-8 distinct, verifiable search vectors. "
            "You provide output in JSON format to ensure the downstream pipeline can process your queries deterministically. [DEBUG: AGENT_ACTIVE_LOGGING_ENABLED]"
        ),
        llm=_build_llm(model, api_key, temperature=0.1),
        verbose=True,
        allow_delegation=False
    )

def build_web_searcher(model: str, api_key: str, context=None) -> Agent:
    from app.tools.research_tools import AxiomDeepSearchTool, AxiomBatchVerifierTool
    return Agent(
        role="Lead Verification Specialist",
        goal=(
            "1. Execute ALL scouted queries via 'axiom_deep_search'.\n"
            "2. IMMEDIATELY verify all candidate findings via 'axiom_batch_verifier'.\n"
            "MANDATORY: You are PROHIBITED from outputting any finding that has not been verified via 'axiom_batch_verifier'.\n"
            "MANDATORY: If 'axiom_deep_search' returns no results, report 'NO DATA FOUND' - do not fabricate."
        ),
        backstory=(
            "You are a clinical data auditor. You treat every piece of information as a hallucination until "
            "it passes the hardware validator. You do not write; you only verify and curate. [DEBUG: AGENT_ACTIVE_LOGGING_ENABLED]"
        ),
        tools=[AxiomDeepSearchTool(), AxiomBatchVerifierTool(context=context)],
        llm=_build_llm(model, api_key, temperature=0.1),
        verbose=True,
        allow_delegation=False
    )

def build_research_reviewer(model: str, api_key: str) -> Agent:
    return Agent(
        role="Quality Audit Director",
        goal=(
            "Perform a clinical audit of the verified evidence.\n"
            "CRITICAL DECISION:\n"
            "- If all roadmap phases have high-fidelity data -> DECISION: GO\n"
            "- If gaps exist or data is weak -> DECISION: REFINE [Provide specific gap queries]"
        ),
        backstory="You are the lead editor for a premier scientific journal, known for a zero-tolerance policy on data gaps.",
        llm=_build_llm(model, api_key, temperature=0.1),
        verbose=True,
        allow_delegation=False
    )

def build_report_writer(model: str, api_key: str) -> Agent:
    return Agent(
        role="Principal Research Correspondent",
        goal=(
            "Write a comprehensive, well-structured research report on the given topic.\n"
            "Prioritize the verified sources provided. Where source coverage is limited, "
            "draw on your expert knowledge — but always distinguish cited evidence from synthesis.\n"
            "Never refuse to write. Always produce a complete, structured report."
        ),
        backstory="You are a prize-winning technical correspondent and domain expert. You synthesize verified evidence and expert knowledge into elite research manuscripts. You always deliver a complete report, even when source coverage is partial.",
        llm=_build_llm(model, api_key, temperature=0.4),
        verbose=True,
        allow_delegation=False
    )

def build_agents(model: str, api_key: str, context=None) -> tuple[Agent, Agent, Agent, Agent, Agent]:
    architect = build_research_architect(model, api_key)
    scout     = build_research_scout(model, api_key)
    searcher  = build_web_searcher(model, api_key, context=context)
    reviewer  = build_research_reviewer(model, api_key)
    writer    = build_report_writer(model, api_key)
    
    logger.info("Axiom v4 Engine Ready — Logic: Deterministic | Truth: Hard-Verified | Mode: High-Performance")
    return architect, scout, searcher, reviewer, writer

