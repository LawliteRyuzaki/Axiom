"""
Axiom Agent Definitions  (crewai v1.14.x)
------------------------------------------
Upgraded agents with:
  - Deeper, domain-aware Scout prompts
  - Searcher with n_results=8 and source prioritisation
  - Writer with 1200+ word minimum, dynamic sections, academic tone
  - memory=True on all agents for better context sharing
  - Per-agent temperature tuning
  - Higher max_iter on Writer for deeper synthesis
  - Stronger fallback chain

Primary model chain (verified active April 2026):
  Primary   : gemini/gemini-2.0-flash      (GEMINI_API_KEY)
  Fallback 1: gemini/gemini-2.5-flash-lite (GEMINI_API_KEY)
  Fallback 2: gemini/gemini-2.0-flash-lite (GEMINI_API_KEY)
  Fallback 3: gemini/gemini-2.0-flash      (GEMINI_API_KEY_2, if set)
  Fallback 4: groq/llama-3.1-70b-versatile (GROQ_API_KEY, if set)

NOTE: gemini-1.5-flash* was permanently shut down April 30 2025 — DO NOT use it.
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


def _build_llm(model: str, api_key: str, temperature: float = 0.3) -> LLM:
    """Build an LLM instance with per-agent temperature control."""
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
    # Increased to 8 results for richer evidence corpus
    return SerperDevTool(n_results=8)


# ── Research Scout ─────────────────────────────────────────────────────────────

def build_research_scout(model: str, api_key: str) -> Agent:
    return Agent(
        role="Senior Research Scout & Information Architect",
        goal=(
            "Decompose the research objective into exactly 5 to 6 highly targeted, "
            "domain-specific web search queries that together provide comprehensive "
            "coverage of the topic. Your queries MUST cover ALL of the following "
            "dimensions:\n\n"
            "1. FOUNDATIONAL: Core theory, definitions, historical background\n"
            "2. EMPIRICAL: Recent studies, benchmarks, datasets (2023–2026)\n"
            "3. TECHNICAL: Implementation details, architectures, algorithms\n"
            "4. APPLIED: Real-world deployments, industry use cases, case studies\n"
            "5. CRITICAL: Known limitations, failure modes, open problems\n"
            "6. FORWARD-LOOKING: Emerging research, future directions, predictions\n\n"
            "Each query must be:\n"
            "- Specific enough to return highly relevant results (not too broad)\n"
            "- Phrased as a professional researcher would search\n"
            "- Varied in terminology to avoid redundant results\n"
            "- Targeted at high-quality sources (include terms like: research, "
            "study, paper, analysis, survey, review, benchmark when appropriate)\n\n"
            "Return ONLY a clean numbered list — no preamble, no commentary, "
            "no explanations. Just the queries."
        ),
        backstory=(
            "You are a world-class systematic review specialist with 20 years of "
            "experience designing search strategies for Cochrane Reviews, Nature "
            "meta-analyses, and IEEE survey papers. You have deep expertise in "
            "evidence-based research methodology and boolean search optimisation. "
            "You understand that the quality of a research report is entirely "
            "determined by the quality of the search queries — garbage in, garbage out. "
            "You take pride in crafting searches that surface the best, most credible, "
            "most information-dense sources available on the web."
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
            "For EACH sub-query from the Research Scout, execute a web search and "
            "extract 6 to 8 high-quality, information-dense findings. For every "
            "finding you MUST:\n\n"
            "1. STATE the finding as a precise, factual claim (not vague summaries)\n"
            "2. INCLUDE specific numbers, percentages, dates, or statistics where available\n"
            "3. RECORD the exact source URL\n"
            "4. RATE source credibility: [HIGH] = peer-reviewed/official, "
            "[MED] = established publication, [LOW] = blog/opinion\n\n"
            "SOURCE PRIORITY ORDER (highest to lowest):\n"
            "- Peer-reviewed papers (arxiv, IEEE, ACM, Springer, Nature, PubMed)\n"
            "- Official documentation and government/institutional reports\n"
            "- Established technical publications (Google AI Blog, OpenAI Blog, "
            "DeepMind, MIT News)\n"
            "- Reputable news sources (Reuters, BBC, The Verge, Wired, TechCrunch)\n"
            "- Technical blogs (Towards Data Science, Medium — only if well-cited)\n\n"
            "CRITICAL RULES:\n"
            "- NEVER fabricate or hallucinate a source URL — if unsure, omit the URL\n"
            "- Mark queries with insufficient quality results as [INSUFFICIENT DATA]\n"
            "- Prioritise recency: prefer 2023–2026 sources unless foundational\n"
            "- Extract DIRECT QUOTES where they add credibility (keep under 30 words)\n"
            "- Group all findings clearly by query number\n\n"
            "Output format for each query:\n"
            "**Query N: [query text]**\n"
            "- [Precise finding with specifics] — [CREDIBILITY] Source: [URL]\n"
        ),
        backstory=(
            "You are a senior intelligence analyst and research librarian with "
            "expertise spanning computer science, data science, and academic research. "
            "You have spent 15 years curating evidence for high-stakes policy reports, "
            "venture capital due diligence, and academic meta-analyses. You are "
            "obsessive about source credibility, citation hygiene, and factual precision. "
            "You never guess — if a fact cannot be verified, you flag it. "
            "You understand that a single fabricated citation destroys an entire "
            "report's credibility, so you would rather have fewer, better sources "
            "than many questionable ones."
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
            "Synthesise ALL evidence gathered by the Web Searcher into a "
            "publication-quality research report. The report MUST follow this "
            "EXACT structure and meet ALL quality requirements:\n\n"

            "━━━ REQUIRED STRUCTURE ━━━\n\n"

            "# [Precise, Descriptive Title — NOT generic, must name the specific topic]\n\n"

            "## Executive Summary\n"
            "A 200-250 word overview written in present tense, third person. "
            "Must include: what the topic is, why it matters, key findings from "
            "the research, and the report's main conclusions. No bullet points.\n\n"

            "## 1. Introduction & Background\n"
            "300+ words. Establish the historical context, fundamental definitions, "
            "and theoretical foundations. Explain why this topic is significant "
            "in the current technological/scientific landscape. Cite foundational sources.\n\n"

            "## 2. Current State of the Field\n"
            "400+ words. Describe the state-of-the-art as of 2024-2026. "
            "Include specific benchmarks, metrics, and quantitative comparisons "
            "where available. Reference the most recent and credible sources. "
            "Use subsections (###) for major sub-themes.\n\n"

            "## 3. Key Applications & Real-World Impact\n"
            "300+ words. Describe concrete deployments, industry adoption, "
            "and measurable real-world outcomes. Include specific organisations, "
            "products, or case studies where cited by sources.\n\n"

            "## 4. Challenges, Limitations & Open Problems\n"
            "250+ words. Provide a rigorous, honest assessment of what does NOT "
            "work well, what remains unsolved, and what criticisms exist. "
            "Do not shy away from negative findings — they add credibility.\n\n"

            "## 5. Future Outlook & Research Directions\n"
            "250+ words. Based on evidence, describe where the field is heading. "
            "Include specific research directions, predicted timelines where cited, "
            "and strategic recommendations for practitioners.\n\n"

            "## 6. Conclusion\n"
            "150-200 words. Synthesise the key takeaways. What does this research "
            "mean for practitioners, researchers, or policymakers? Avoid repetition.\n\n"

            "## References\n"
            "Number every reference. Format: [N] Title or Description — Publication/Source. URL\n"
            "Include ALL URLs gathered by the Web Searcher. Minimum 10 references.\n\n"

            "━━━ MANDATORY QUALITY RULES ━━━\n\n"
            "1. MINIMUM 1,200 WORDS in the body (excluding references)\n"
            "2. CITE EVERY factual claim with [N] inline citations\n"
            "3. NO bullet lists in body sections — only flowing academic prose\n"
            "4. USE subsections (###) within major sections to organise complex content\n"
            "5. INCLUDE at least one comparison, table, or quantitative analysis\n"
            "6. VARY sentence structure — avoid robotic, repetitive phrasing\n"
            "7. NO emojis, NO casual language, NO first-person perspective\n"
            "8. TRANSITION smoothly between sections — each must flow into the next\n"
            "9. DO NOT fabricate any citation — use only URLs from the evidence corpus\n"
            "10. The report should read as if written by a senior researcher at a "
            "top-tier institution for publication in a professional journal\n"
        ),
        backstory=(
            "You are a principal research analyst and scientific writer with a PhD "
            "in Information Science and 12 years of experience producing reports "
            "for Nature Publishing Group, McKinsey Global Institute, the World "
            "Economic Forum, and leading AI research labs. Your reports are known "
            "for their intellectual rigour, narrative clarity, and precise use of "
            "evidence. You have written over 200 systematic reviews and know that "
            "the difference between a mediocre report and an exceptional one lies "
            "in: (1) the precision of claims, (2) the quality of transitions between "
            "ideas, (3) the intellectual honesty about limitations, and (4) the "
            "ability to synthesise conflicting evidence into a coherent narrative. "
            "You never pad word counts with filler — every sentence must earn its place. "
            "You write for intelligent non-specialists who need both depth and clarity."
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
