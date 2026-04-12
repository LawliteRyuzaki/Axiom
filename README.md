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

The entire pipeline streams back to you in real time through a conversational interface, with a live agent terminal on the right and your session history on the left.

---

## Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 16 (App Router) | Conversational UI, SSE streaming |
| Styling | Tailwind CSS v4 + Plus Jakarta Sans + Lora | Editorial design system |
| Animations | Framer Motion | Page transitions, streaming effects |
| Backend | FastAPI + Uvicorn | SSE endpoint, history API |
| Agents | CrewAI 1.14 | Multi-agent orchestration |
| LLM | Gemini 2.0 Flash (primary) | Reasoning and synthesis |
| LLM Fallbacks | Gemini 2.5 Flash-Lite → Gemini 2.0 Flash-Lite → Groq/Llama-3.1 | Quota resilience |
| Search | Serper.dev | Live web search |
| Database | MongoDB Atlas M0 | Session persistence |

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
                     │  InvestigationSidebar (SSE)   │
                     │  AgentHub terminal  (SSE)     │
                     └──────────────┬───────────────┘
                                    │  POST /api/research  { goal, model }
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
    │ Gemini 2.0     │   │  Gemini 2.0      │   │  Gemini 2.0     │
    │ max_rpm=3      │   │  + SerperDevTool │   │  max_rpm=3      │
    └────────────────┘   └──────────────────┘   └─────────────────┘
                                    │                        │
                         ┌──────────▼───────┐   ┌───────────▼─────┐
                         │   Serper.dev     │   │  MongoDB Atlas   │
                         │  (live web)      │   │  (sessions)      │
                         └──────────────────┘   └─────────────────┘
```

### Rate-limit & resilience strategy

| Layer | Setting | Behaviour on breach |
|---|---|---|
| Per-agent RPM | `max_rpm=3` on all agents | CrewAI throttles automatically |
| Per-LLM call | `timeout=150s` | Raises; retried by orchestrator |
| Inter-agent padding | `time.sleep(2)` before kickoff | Drains burst window between agents |
| Per-crew | `asyncio.wait_for(timeout=240s)` | Returns partial result |
| Model fallback | Flash → Flash-Lite → Flash-Lite-2 → Groq | Switches on quota exhaustion |
| Partial safety net | Writer invoked with gathered data on timeout | User always sees content |

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Free API keys for [Google AI Studio](https://aistudio.google.com/app/apikey), [Serper.dev](https://serper.dev), and [MongoDB Atlas](https://cloud.mongodb.com)

### 1. Backend

```bash
cd axiom/backend

python -m venv .venv && source .venv/bin/activate
# Windows: .venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env   # fill in your keys

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

# Optional — fallback providers (strongly recommended in production)
# GEMINI_API_KEY_2=   # fresh daily quota pool (different Google account)
# GROQ_API_KEY=       # Groq Llama-3.1-70b — free tier, separate quota

# CORS — comma-separated, localhost:3000 always added in development
ALLOWED_ORIGINS=http://localhost:3000
# ALLOWED_ORIGINS=https://axiom.vercel.app,http://localhost:3000

LOG_LEVEL=INFO
```

### `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## API Reference

| Method | Path | Body / Params | Description |
|---|---|---|---|
| `POST` | `/api/research` | `{ goal, model }` | Start research — returns SSE stream |
| `GET` | `/api/history` | `?limit=20&skip=0` | List sessions, newest first |
| `GET` | `/api/history/{id}` | — | Full session + report |
| `GET` | `/api/health` | — | Health check + DB status |
| `GET` | `/docs` | — | Swagger UI |

### SSE event types

| Event | Payload | Description |
|---|---|---|
| `status` | `"initializing" \| "running" \| "completed" \| "partial" \| "failed"` | Pipeline lifecycle |
| `log` | string | Granular terminal log line |
| `query` | string | A sub-query dispatched by Scout |
| `report_chunk` | string | One streamed line of Markdown |
| `complete` | `{ session_id, duration, partial, model }` | Final metadata |
| `error` | string | Actionable error string |

### Model selector

The `model` field in the POST body accepts:

| Value | Maps to |
|---|---|
| `"flash"` | `gemini/gemini-2.0-flash` |
| `"pro"` | `gemini/gemini-1.5-pro` (or equivalent paid model) |

---

## UI Layout

```
┌──────────────────────────────────────────────────────────────┐
│  ◈ Axiom  │  [session title truncated…]         ● Running   │  ← NavBar (52px)
├───────────────┬──────────────────────────┬───────────────────┤
│ + NEW RESEARCH│                          │ Agent Log  RUNNING│
│ ─────────────│                          │ ┌─────────────────┐│
│ SESSIONS      │   Research Canvas        │ │ axiom-runtime   ││
│               │   (max-w-3xl, mx-auto)   │ │ 09:41:22 ...    ││
│  ● Session 1  │   text-lg leading-relaxed│ │ 09:41:25 ...    ││
│  ● Session 2  │                          │ └─────────────────┘│
│               │   [Lora report prose]    │                   │
│               │                          │ Search queries    │
│               │                          │ 01 query text...  │
└───────────────┴──────────────────────────┴───────────────────┘
```

- **Logo click** on the research view toggles the Sessions sidebar open/closed (Framer Motion slide)
- **Logo click** on the landing view resets to home
- **Session click** in the sidebar does a `GET /api/history/{id}` and loads the full report into the canvas
- **NEW RESEARCH** button at the top of the sidebar resets to the landing form

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

## Project Structure

```
axiom/
├── README.md
├── CLAUDE.md                    ← coding standards & progress tracker
│
├── backend/
│   ├── .env                     ← secrets (gitignored)
│   ├── .env.example             ← template with all variables documented
│   ├── requirements.txt         ← pinned deps
│   ├── run.py                   ← dev server entry point
│   ├── render.yaml              ← Render deploy config
│   └── app/
│       ├── main.py              ← FastAPI app, dynamic CORS, lifespan
│       ├── core/
│       │   ├── config.py        ← Pydantic settings + production detection
│       │   ├── database.py      ← Motor async MongoDB
│       │   ├── logging.py       ← structured logging (verbose dev / quiet prod)
│       │   └── retry.py         ← rate-limit backoff + daily quota detection
│       ├── models/schemas.py    ← all Pydantic models + SSE event types
│       ├── agents/
│       │   ├── agents.py        ← Scout, Searcher, Writer + full fallback chain
│       │   └── crew.py          ← orchestrator, padded kickoff, partial safety net
│       └── api/research.py      ← route handlers + MongoDB persistence
│
└── frontend/
    ├── .env.local               ← NEXT_PUBLIC_API_URL
    ├── vercel.json
    ├── types/index.ts           ← TypeScript types (SessionStatus, SelectedModel…)
    ├── hooks/useResearch.ts     ← SSE consumer + loadSession (GET history)
    ├── components/
    │   ├── AxiomLogo.tsx        ← three-bar descending mark
    │   ├── NavBar.tsx           ← logo (toggles sidebar) + session title + status
    │   ├── LandingView.tsx      ← hero + controlled model selector + search bar
    │   ├── InvestigationSidebar.tsx  ← NEW RESEARCH button + session list
    │   ├── ResearchCanvas.tsx   ← streaming Markdown, max-w-3xl, text-lg
    │   ├── AgentHub.tsx         ← terminal log panel, aligned header height
    │   └── TableOfContents.tsx  ← auto-generated from ## headings
    └── app/
        ├── layout.tsx           ← Plus Jakarta Sans + Lora + Geist Mono
        ├── globals.css          ← full design system (CSS vars, prose, terminal)
        └── page.tsx             ← root: selectedModel state, sidebar toggle, session load
```

### Removed / deprecated components

The following files are safe to delete — their functionality has been absorbed into the components above:

| File | Replaced by |
|---|---|
| `frontend/components/HistorySidebar.tsx` | `InvestigationSidebar.tsx` |
| `frontend/components/ProgressPanel.tsx` | `AgentHub.tsx` |
| `frontend/components/ReportViewer.tsx` | `ResearchCanvas.tsx` |
| `frontend/components/ResearchForm.tsx` | `LandingView.tsx` |
| `frontend/components/StatusBadge.tsx` | Inline in `NavBar.tsx` |
| `frontend/components/ErrorPanel.tsx` | Inline in `ResearchCanvas.tsx` |

---

## Deployment

### Backend → [Render](https://render.com) (free tier)

1. Push to GitHub
2. New Web Service → Root directory: `backend`
3. Render detects `render.yaml` automatically
4. Set env vars in Render dashboard (`GEMINI_API_KEY`, `SERPER_API_KEY`, `MONGODB_URI`)
5. Set `ALLOWED_ORIGINS` to your Vercel URL

### Frontend → [Vercel](https://vercel.com) (free hobby)

1. Import from GitHub → Root directory: `frontend`
2. Set `NEXT_PUBLIC_API_URL` to your Render URL
3. Deploy

> **Note:** Render free tier sleeps after 15 min idle. First request takes ~20s. The "Queued — Initialising Axiom agent pipeline…" state in the UI covers this gracefully.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `429 RESOURCE_EXHAUSTED` (per-minute) | Wait 60s; the engine auto-retries with backoff |
| `429 RESOURCE_EXHAUSTED` (daily, limit: 0) | Quota resets midnight Pacific. Set `GEMINI_API_KEY_2` or `GROQ_API_KEY` for automatic failover |
| `ImportError: Google Gen AI native provider` | `pip install google-genai` |
| `404 NOT_FOUND` for a Gemini model | That model is deprecated — the fallback chain uses only verified-active models |
| MongoDB connection timeout | Atlas → Network Access → Add `0.0.0.0/0` |
| SSE stream cuts off on Nginx | `X-Accel-Buffering: no` header is already set |
| Sidebar not sliding in | Ensure Framer Motion is installed: `npm install framer-motion` |
| `cfg is undefined` crash in AgentHub | Fixed — all `cfg` accesses now use optional chaining (`cfg?.color`) |

---

## License

MIT — build it, break it, ship it.
