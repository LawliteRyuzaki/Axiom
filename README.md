# 🎓 ScholarSync — AI Research Agent System

A production-ready, **100% free-tier** multi-agent research system for MCA students.  
Enter a research goal → a CrewAI crew searches the web → a structured academic report streams back live.

---

## ✨ Features

- **3-Agent CrewAI Crew** — Research Scout, Web Searcher, Report Writer working in sequence
- **Real-time SSE streaming** — watch the report being written word-by-word
- **Gemini 2.0 Flash** — fast, free LLM via Google AI Studio
- **Serper.dev search** — live web search with source attribution
- **MongoDB Atlas** — persists every session; searchable history sidebar
- **3-layer timeout safety** — per-LLM (45s) → per-agent (60s) → per-crew (120s)
- **Download as Markdown** — export any report with one click

---

## 🏗️ Architecture

```
Browser
  │
  ▼
Next.js 14 (App Router + Tailwind)
  │  POST /api/research  →  SSE stream back
  ▼
FastAPI (Python 3.12)
  │
  ▼
CrewAI 1.14.1 Crew (sequential process)
  ├── Research Scout   → decomposes goal into 3-5 sub-queries   (Gemini 2.0 Flash)
  ├── Web Searcher     → Serper.dev search, extracts facts+URLs  (Gemini 2.0 Flash)
  └── Report Writer    → synthesises full Markdown report        (Gemini 2.0 Flash)
  │
  ├── MongoDB Atlas  → session persistence + 24h search cache
  └── Serper.dev     → Google Search API (2,500 free req/month)
```

---

## 💰 Zero-Cost Stack

| Service | Free Tier Limits |
|---|---|
| Google AI Studio (Gemini 2.0 Flash) | 15 RPM, 1M tokens/day |
| Serper.dev | 2,500 searches/month |
| MongoDB Atlas M0 | 512 MB storage |
| Vercel (Frontend) | Unlimited hobby projects |
| Render (Backend) | 750 hrs/month free |

---

## 🚀 Quick Start (Local)

### Prerequisites
- Python 3.11+
- Node.js 18+
- API keys for Gemini, Serper, MongoDB (all free)

### 1. Clone & configure

```bash
git clone <your-repo-url>
cd scholarsync
```

### 2. Backend setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment (already populated with your keys)
# Edit backend/.env if you need to change anything:
# GEMINI_API_KEY=...
# SERPER_API_KEY=...
# MONGODB_URI=...

# Start the backend
python run.py
# → API running at http://localhost:8000
# → Swagger docs at http://localhost:8000/docs
```

### 3. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
# → App running at http://localhost:3000
```

Open **http://localhost:3000** and enter a research goal!

---

## 📁 Project Structure

```
scholarsync/
├── CLAUDE.md                     ← Project bible & progress tracker
├── README.md
│
├── backend/
│   ├── .env                      ← Secrets (gitignored)
│   ├── requirements.txt          ← Pinned Python deps
│   ├── run.py                    ← Dev server entry point
│   ├── render.yaml               ← Render deploy config
│   └── app/
│       ├── main.py               ← FastAPI app + CORS + lifespan
│       ├── core/
│       │   ├── config.py         ← Pydantic settings
│       │   ├── database.py       ← Motor async MongoDB
│       │   └── logging.py        ← Structured logging
│       ├── models/
│       │   └── schemas.py        ← All Pydantic models
│       ├── agents/
│       │   ├── agents.py         ← 3 CrewAI agent definitions
│       │   └── crew.py           ← Crew orchestrator + SSE streaming
│       └── api/
│           └── research.py       ← All API route handlers
│
└── frontend/
    ├── .env.local                ← NEXT_PUBLIC_API_URL
    ├── vercel.json               ← Vercel deploy config
    ├── tailwind.config.ts
    ├── types/index.ts            ← TypeScript types
    ├── hooks/
    │   └── useResearch.ts        ← SSE stream hook
    ├── components/
    │   ├── ResearchForm.tsx      ← Goal input + examples
    │   ├── ProgressPanel.tsx     ← Live progress log + queries
    │   ├── ReportViewer.tsx      ← Streaming Markdown renderer
    │   ├── HistorySidebar.tsx    ← Past sessions list
    │   └── StatusBadge.tsx       ← Status indicator
    └── app/
        ├── layout.tsx
        └── page.tsx              ← Main page
```

---

## 🌐 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/research` | Start research (SSE stream) |
| `GET` | `/api/history` | List sessions (newest first) |
| `GET` | `/api/history/{id}` | Get full session + report |
| `GET` | `/api/health` | Health check + DB status |
| `GET` | `/docs` | Interactive Swagger UI |

### SSE Event Types

The `POST /api/research` endpoint streams Server-Sent Events:

```
status       → "initializing" | "running" | "completed" | "partial" | "failed"
progress     → Human-readable message (e.g. "🌐 Web Searcher is gathering evidence...")
query        → A sub-query being searched (e.g. "quantum cryptography RSA 2024")
report_chunk → One line of the streaming Markdown report
complete     → JSON: { session_id, duration, partial }
error        → Error message string
```

---

## ☁️ Deployment

### Backend → Render (Free)

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service → connect repo
3. Set **Root Directory** to `backend`
4. Render auto-detects `render.yaml`
5. Add env vars in Render dashboard:
   - `GEMINI_API_KEY`
   - `SERPER_API_KEY`
   - `MONGODB_URI`
   - `ALLOWED_ORIGINS=https://your-app.vercel.app`

### Frontend → Vercel (Free)

1. Go to [vercel.com](https://vercel.com) → Import Git Repository
2. Set **Root Directory** to `frontend`
3. Add env var: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com`
4. Deploy!

---

## ⚙️ Configuration

All backend config lives in `backend/.env`:

```env
GEMINI_API_KEY=...          # Google AI Studio
SERPER_API_KEY=...          # Serper.dev
MONGODB_URI=...             # MongoDB Atlas connection string
ALLOWED_ORIGINS=...         # Comma-separated CORS origins
LOG_LEVEL=INFO              # DEBUG | INFO | WARNING | ERROR
```

Timeout tuning (in `backend/app/core/config.py`):
```python
tool_timeout  = 15   # Per-tool call (seconds)
agent_timeout = 45   # Per-agent (seconds)
crew_timeout  = 120  # Full crew run (seconds)
```

---

## 🧪 Testing the API

```bash
# Health check
curl http://localhost:8000/api/health

# Start research (streams SSE)
curl -N -X POST http://localhost:8000/api/research \
  -H "Content-Type: application/json" \
  -d '{"goal": "Latest advances in transformer architectures for NLP"}' 

# Get history
curl http://localhost:8000/api/history
```

---

## 🛠️ Troubleshooting

| Problem | Solution |
|---|---|
| `ImportError: Google Gen AI native provider not available` | Run `pip install google-genai` |
| MongoDB connection timeout | Check Atlas Network Access → add `0.0.0.0/0` |
| Gemini 429 rate limit | Free tier is 15 RPM; wait 1 minute and retry |
| Render backend sleeping | First request wakes it (~30s); add "warming up" UX |
| SSE stream cuts off | Set `X-Accel-Buffering: no` header (already done) |

---

## 📄 License

MIT — build freely, deploy freely, learn freely.
