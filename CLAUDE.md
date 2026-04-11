# ScholarSync — Project Bible & Progress Tracker

## Project Overview
**ScholarSync** is a real-time AI Agentic System for MCA students.
A user enters a research goal; a multi-agent CrewAI "crew" searches the web and generates a structured report, streamed live to the browser via SSE.

---

## Architecture
```
Browser → Next.js (App Router) → FastAPI → CrewAI Crew → Gemini Flash + Serper
                                     ↓
                               MongoDB Atlas (session/history store)
```

## Tech Stack
| Layer | Technology | Version | Cost |
|---|---|---|---|
| Frontend | Next.js (App Router) | 14.x | Free |
| Styling | Tailwind CSS | 3.x | Free |
| Backend | FastAPI + Uvicorn | 0.109.x | Free |
| AI Orchestration | CrewAI | 0.28.x | Free (OSS) |
| LLM | Gemini 2.0 Flash (Google AI Studio) | gemini-2.0-flash | Free tier |
| Web Search | Serper.dev | - | Free (2,500 req/mo) |
| Database | MongoDB Atlas M0 | - | Free forever |
| Frontend Host | Vercel | - | Free hobby |
| Backend Host | Render / Railway | - | Free tier |

---

## Coding Standards

### Python (Backend)
- Formatter: `black` with line length 88
- Linter: `ruff`
- Type hints: mandatory on all function signatures
- Async: use `async def` for all route handlers
- Errors: never swallow exceptions silently — log then raise/return structured error
- Env: all secrets via `python-dotenv` — NEVER hardcode credentials

### TypeScript (Frontend)
- Strict mode: enabled
- Components: functional only, no class components
- Fetching: native `fetch` with `EventSource` for SSE
- State: React `useState` + `useReducer` for complex state
- Styling: Tailwind utility classes only

### Git Conventions
- Branch: `main` (production), `dev` (active development)
- Commits: `feat:`, `fix:`, `chore:`, `docs:` prefixes
- Never commit `.env` files

---

## Agent Roles

| Agent | Role | Tools |
|---|---|---|
| Research Scout | Decomposes research goal into 3-5 targeted sub-queries | None (LLM reasoning only) |
| Web Searcher | Executes each sub-query via Serper, extracts key facts | SerperDevTool |
| Report Writer | Synthesizes all findings into structured Markdown report | None (LLM synthesis) |

---

## Timeout Strategy (3-layer)
1. Per-tool call: **15 seconds**
2. Per-agent task: **45 seconds**
3. Per-crew run: **120 seconds**

On timeout: return partial results with a `partial: true` flag. Never hard 500.

---

## API Endpoints
| Method | Path | Description |
|---|---|---|
| POST | `/api/research` | Start a new research job (returns SSE stream) |
| GET | `/api/history` | List past research sessions |
| GET | `/api/history/{id}` | Get a specific session's report |
| GET | `/api/health` | Health check |

---

## Progress Tracker

### Phase 1 — Backend ✅ IN PROGRESS
- [x] Project scaffold
- [x] CLAUDE.md
- [x] FastAPI app shell
- [x] MongoDB connection
- [x] CrewAI agents (Scout, Searcher, Writer)
- [x] SSE streaming endpoint
- [x] Timeout handling
- [x] History endpoints

### Phase 2 — Frontend ⬜ TODO
- [ ] Next.js scaffold
- [ ] Research goal input form
- [ ] Real-time SSE progress component
- [ ] Report markdown renderer
- [ ] History sidebar
- [ ] Error/timeout states

### Phase 3 — Integration & Deploy ⬜ TODO
- [ ] CORS config
- [ ] Environment validation on startup
- [ ] Vercel deployment config
- [ ] Render deployment config (backend)
- [ ] End-to-end smoke test

---

## Environment Variables

### Backend (`backend/.env`)
```
GEMINI_API_KEY=...
SERPER_API_KEY=...
MONGODB_URI=...
ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Known Constraints & Mitigations
| Constraint | Mitigation |
|---|---|
| Gemini free tier: 15 RPM | Queue requests; surface rate-limit errors gracefully |
| Serper free tier: 2,500/mo | Cache search results in MongoDB by query hash |
| Render free tier sleeps after 15min | Show "warming up..." UI state on first request |
| CrewAI agent timeouts | 3-layer timeout with partial result fallback |
