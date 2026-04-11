<div align="center">

# ◈ Axiom

**Think deeper. Know faster.**

An autonomous multi-agent AI research platform — drop a question, get a publication-quality report.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![CrewAI](https://img.shields.io/badge/CrewAI-1.14-FF4B4B?style=flat-square)](https://crewai.com)
[![Gemini](https://img.shields.io/badge/Gemini-2.0_Flash-4285F4?style=flat-square&logo=google)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-MIT-8B0000?style=flat-square)](LICENSE)

</div>

---

## What is Axiom?

Axiom is a **conversational agentic research platform** that turns a single research question into a structured, cited report — in minutes, not days.

You type a question. Three specialised AI agents get to work:

1. **Research Scout** — Breaks your question into 4–6 precise sub-queries
2. **Web Searcher** — Dispatches each query to the live web via Serper, extracts evidence and source URLs
3. **Report Writer** — Synthesises everything into a professional Markdown report with Executive Summary, Methodology, Synthesis, Future Outlook, and Citations

The entire pipeline streams back to you in real time through a Claude-style conversational interface.

---

## Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 16 (App Router) | Conversational UI, SSE streaming |
| Styling | Tailwind CSS v4 + Syne + DM Sans | Editorial design system |
| Animations | Framer Motion | Page transitions, streaming effects |
| Backend | FastAPI + Uvicorn | SSE endpoint, history API |
| Agents | CrewAI 1.14 | Multi-agent orchestration |
| LLM | Gemini 2.0 Flash | Reasoning and synthesis |
| Search | Serper.dev | Live web search |
| Database | MongoDB Atlas M0 | Session persistence, search cache |

**100% free-tier compatible.** No credit card required to run locally.

---

## Architecture

```
                     ┌─────────────────────────────┐
                     │        Browser / User         │
                     └──────────────┬───────────────┘
                                    │  HTTPS
                     ┌──────────────▼───────────────┐
                     │     Next.js  (App Router)     │
                     │  LandingView ─► ResearchCanvas│
                     │  AgentHub terminal  (SSE)     │
                     └──────────────┬───────────────┘
                                    │  POST /api/research
                                    │  ← SSE stream
                     ┌──────────────▼───────────────┐
                     │         FastAPI               │
                     │  /api/research  (SSE)         │
                     │  /api/history   (REST)        │
                     │  /api/health                  │
                     └──────────────┬───────────────┘
                                    │
             ┌──────────────────────┼────────────────────────┐
             ▼                      ▼                        ▼
    ┌────────────────┐   ┌──────────────────┐   ┌─────────────────┐
    │ Research Scout │──▶│  Web Searcher    │──▶│  Report Writer  │
    │ Gemini Flash   │   │  Gemini Flash    │   │  Gemini Flash   │
    │ max_rpm=3      │   │  + SerperDevTool │   │  max_rpm=3      │
    └────────────────┘   └──────────────────┘   └─────────────────┘
                                    │                        │
                         ┌──────────▼───────┐   ┌───────────▼─────┐
                         │   Serper.dev     │   │  MongoDB Atlas   │
                         │  (live web)      │   │  (sessions +     │
                         └──────────────────┘   │   24h cache)     │
                                                └─────────────────┘
```

### Rate-limit safety

Three layers protect you on the free tier:

| Layer | Timeout | Behaviour on breach |
|---|---|---|
| Per-LLM call | 50s | Raises; retried by orchestrator |
| Per-agent | 45–90s | `max_execution_time` on each Agent |
| Per-crew | 120s | `asyncio.wait_for`; returns partial result |
| RPM guard | `max_rpm=3` | CrewAI throttles per-model calls |
| Model fallback | — | `gemini-2.0-flash` → `gemini-2.5-flash-lite` → `gemini-2.0-flash-lite` |

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Free API keys for [Google AI Studio](https://aistudio.google.com/app/apikey), [Serper.dev](https://serper.dev), and [MongoDB Atlas](https://cloud.mongodb.com)

### 1. Backend

```bash
cd axiom/backend

# Create virtual environment
python -m venv .venv && source .venv/bin/activate
# Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure secrets
cp .env.example .env   # then fill in your keys

# Start
python run.py
# → http://localhost:8000
# → Swagger docs: http://localhost:8000/docs
```

### 2. Frontend

```bash
cd axiom/frontend

npm install
npm run dev
# → http://localhost:3000
```

Open **http://localhost:3000**, type a research question, and watch the agents work.

---

## Environment Variables

### `backend/.env`

```env
# Required
GEMINI_API_KEY=your_google_ai_studio_key
SERPER_API_KEY=your_serper_dev_key
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?appName=Axiom

# Optional
ALLOWED_ORIGINS=http://localhost:3000
LOG_LEVEL=INFO
```

### `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## API Reference

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/research` | Start research — returns SSE stream |
| `GET` | `/api/history` | List sessions, newest first |
| `GET` | `/api/history/{id}` | Full session + report |
| `GET` | `/api/health` | Health check + DB status |
| `GET` | `/docs` | Swagger UI |

### SSE event types

```
status       →  "initializing" | "running" | "completed" | "partial" | "failed"
log          →  Granular terminal log line (30+ per session)
query        →  A sub-query dispatched by the Research Scout
report_chunk →  One streamed line of the Markdown report
complete     →  JSON: { session_id, duration, partial, model }
error        →  Actionable error string
```

---

## Report Structure

Every Axiom report follows this format:

```
# [Title]

## Executive Summary       — 150-200 word overview
## Methodology             — search strategy and scope
## Synthesis               — thematic deep-dive (4 sub-sections)
## Future Outlook          — trends and strategic recommendations
## Citations               — numbered, URL-linked references
```

Minimum 800 words. Academic prose. No bullet lists in body text.

---

## Deployment

### Backend → [Render](https://render.com) (free tier)

1. Push to GitHub
2. New Web Service → Root directory: `backend`
3. Render detects `render.yaml` automatically
4. Set env vars in Render dashboard
5. Set `ALLOWED_ORIGINS` to your Vercel URL

### Frontend → [Vercel](https://vercel.com) (free hobby)

1. Import from GitHub → Root directory: `frontend`
2. Set `NEXT_PUBLIC_API_URL` to your Render URL
3. Deploy

> **Note:** Render free tier sleeps after 15 min idle. First request takes ~20s to wake. Add a "warming up..." state in production or upgrade to a paid instance.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `ImportError: Google Gen AI native provider` | `pip install google-genai` |
| `429 RESOURCE_EXHAUSTED` (per-minute) | Wait 60s; the engine auto-retries |
| `429 RESOURCE_EXHAUSTED` (daily, limit: 0) | Quota resets at midnight Pacific, or generate a new API key |
| `404 NOT_FOUND` for a Gemini model | That model is deprecated. The fallback chain uses only verified-active models |
| MongoDB connection timeout | Atlas → Network Access → Add `0.0.0.0/0` |
| SSE stream cuts off on Nginx | `X-Accel-Buffering: no` header is already set |

---

## Project Structure

```
axiom/
├── README.md
├── CLAUDE.md                  ← progress tracker & coding standards
│
├── backend/
│   ├── .env                   ← secrets (gitignored)
│   ├── requirements.txt       ← pinned deps
│   ├── run.py                 ← dev server
│   ├── render.yaml            ← Render deploy config
│   └── app/
│       ├── main.py            ← FastAPI app, CORS, lifespan
│       ├── core/
│       │   ├── config.py      ← Pydantic settings
│       │   ├── database.py    ← Motor async MongoDB
│       │   ├── logging.py     ← structured logging
│       │   └── retry.py       ← rate-limit backoff + daily quota detection
│       ├── models/schemas.py  ← all Pydantic models + SSE event types
│       ├── agents/
│       │   ├── agents.py      ← Scout, Searcher, Writer definitions
│       │   └── crew.py        ← orchestrator, fallback chain, SSE streaming
│       └── api/research.py    ← route handlers + MongoDB persistence
│
└── frontend/
    ├── .env.local             ← NEXT_PUBLIC_API_URL
    ├── vercel.json
    ├── types/index.ts         ← TypeScript types
    ├── hooks/useResearch.ts   ← SSE consumer hook
    ├── components/
    │   ├── AxiomLogo.tsx      ← faceted diamond mark
    │   ├── NavBar.tsx         ← glass nav
    │   ├── LandingView.tsx    ← hero + search pill + chips
    │   ├── InvestigationSidebar.tsx
    │   ├── ResearchCanvas.tsx ← streaming markdown + TOC
    │   ├── AgentHub.tsx       ← terminal log panel
    │   └── TableOfContents.tsx
    └── app/
        ├── layout.tsx         ← Syne + DM Sans + JetBrains Mono
        ├── globals.css        ← design system
        └── page.tsx           ← 3-column layout with FM transitions
```

---

## License

MIT — build it, break it, ship it.
