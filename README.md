# Axiom

**Deep Research. Verified Sources. Live Reports.**

Axiom is a research engine that uses AI agents to perform multi-phase analysis on any topic. It doesn't just summarize; it searches for real evidence, verifies sources, and builds a comprehensive report with actual citations.

---

## How it Works

Axiom uses a structured pipeline to ensure the reports are accurate and grounded in data:

1.  **Planning**: The system creates a research roadmap based on your goal.
2.  **Searching**: Agents generate targeted queries to find the best sources (Academic, Web, and Reports).
3.  **Verification**: Every source is checked for technical accuracy before being used.
4.  **Synthesis**: A final report is written using only the verified evidence.

---

---

## 🏗️ Architecture
Axiom is built for speed and reliability, using parallel search and automated verification to keep hallucinations to a minimum.

*   **Parallel Search**: Searches across multiple sources simultaneously to save time.
*   **Verification Engine**: Checks the content of URLs to make sure they actually support the claims.
*   **Ranking**: Sources are ranked by relevance and credibility.
*   **Caching**: Results are cached to speed up repeat queries.

---

## ⚡ Tech Stack

- **Frontend**: Next.js 16, Tailwind CSS, Framer Motion
- **Backend**: FastAPI (Python)
- **Agents**: CrewAI
- **Database**: MongoDB Atlas
- **Search**: Serper API

---

## 🚀 Quick Start

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
python run.py
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

---

---

Built with Axiom v4 core. MIT License.
