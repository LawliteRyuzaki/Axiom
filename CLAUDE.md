# Axiom v4 — Project Bible & Protocol

## Project Overview
**Axiom v4** is a production-grade, deterministic AI Research Engine. It transforms fuzzy agentic flows into a rigid, fault-tolerant research pipeline that guarantees factual integrity and high-fidelity technical analysis.

---

## Architecture (Axiom v4)
```
Browser → Next.js (Tailwind 4) → FastAPI (SSE) → Deterministic Pipeline → Multi-Agent Crew
                                      ↓
                                MongoDB Atlas (Persistence) + Multi-Vector Retrieval
```

## Tech Stack
| Layer | Technology | Version | Role |
|---|---|---|---|
| **Frontend** | Next.js 16 (App Router) | 16.2.x | High-performance React UI |
| **Styling** | Tailwind CSS 4 | 4.x | Design System & Visuals |
| **Backend** | FastAPI | 0.111.x | Async API & SSE Streaming |
| **Orchestration** | CrewAI | 1.14.x | Multi-Agent Execution |
| **Pipeline** | Axiom v4 Controller | - | Deterministic Stage Enforcement |
| **Retrieval** | Multi-Vector Engine | - | Robust Academic + Web + PDF Search |
| **LLM Chain** | Gemini 2.0 → Groq | - | Fault-Tolerant Provider Fallback |

---

## 🛠️ Commands & Protocols

### Backend (Python 3.10+)
- **Start Dev**: `python run.py`
- **Install Deps**: `pip install -r requirements.txt`
- **CORS Config**: Update `ALLOWED_ORIGINS` in `.env`
- **Logging**: Level controlled via `LOG_LEVEL` (default: INFO)

### Frontend (Node 20+)
- **Start Dev**: `npm run dev` (Turbo enabled)
- **Memory Fix**: `$env:NODE_OPTIONS="--max-old-space-size=4096"` (for Windows)
- **API URL**: Set `NEXT_PUBLIC_API_URL` in `.env.local`

---

## 🧠 Axiom v4 Protocol

### 1. Deterministic Execution Stage
Pipeline MUST follow: **Architect → Scout → Searcher/Curator → Reviewer → Writer**.
No stages can be skipped. The pipeline enforces a "Data Guard" before synthesis.

### 2. Retrieval Protocol (Robustness)
Search MUST attempt 3 tiers:
- **Tier 1**: High-fidelity Academic + Web.
- **Tier 2**: Simplified Natural Language (if Tier 1 recall < 3).
- **Tier 3**: Keyword-only extraction (Final fallback).

### 3. Truth Verification
- Every source MUST pass `AxiomBatchVerifierTool`.
- Confidence Scores: `HIGH` (Score > 0.8), `MEDIUM` (Score > 0.6), `LOW` (Reject).
- The Reviewer is physically blocked from synthesis if `Coverage < 10%`.

---

## 📂 Project Structure
```text
backend/
├── app/
│   ├── agents/      # CrewAI Agent & Task definitions
│   ├── pipeline/    # Axiom v4 Controller & State Management
│   ├── retrieval/   # Robust Search Engine & Fallback logic
│   ├── verification/# Hard Content Validation & Scoring
│   ├── memory/      # Thread-safe Context & Caching
│   └── main.py      # API Entry point
frontend/
├── components/      # Glassmorphic UI & Canvas
└── hooks/           # SSE & Research State management
```

---

## 📋 Progress Tracker (Axiom v4)
- [x] **Core Refactor**: Deterministic Pipeline Controller
- [x] **Retrieval**: Multi-strategy fallback engine
- [x] **Truth Engine**: Parallel Batch Verification Tool
- [x] **Memory**: Thread-safe ResearchContext injection
- [x] **Fallbacks**: Gemini-to-Groq provider rotation
- [x] **Production**: SSE streaming headers & deployment configs
- [ ] **Next**: Real-time visualization of the research graph

---

## 🔒 Security & Deployment
- **CORS**: `ALLOWED_ORIGINS` must match the frontend production URL.
- **SSE**: `X-Accel-Buffering: no` is mandatory for Nginx/Render environments.
- **Keys**: NEVER commit `.env`. Use GitHub Secrets for Render/Vercel.

**Axiom v4: Built for Truth. Optimized for Reliability.**
