# Axiom

Axiom is a high-fidelity research engine designed for deterministic, multi-agent analysis and real-time source verification. It leverages a structured orchestration pipeline to transform complex research goals into comprehensive, evidence-based reports.

## Methodology

Axiom operates on the v4 Research Core, which utilizes a rigid, four-phase pipeline to ensure factual integrity and minimize hallucination:

1.  **Orchestrated Planning**: The system decomposes research objectives into a hierarchical set of investigation tasks.
2.  **Autonomous Retrieval**: Agents execute parallel queries across academic databases, technical reports, and the open web.
3.  **Heuristic Verification**: Every retrieved source is processed through a verification engine that checks for technical relevance and source credibility.
4.  **Evidence Synthesis**: A final report is synthesized exclusively from verified data points, complete with direct citations and confidence scoring.

## Key Features

- **Multi-Agent Orchestration**: Powered by CrewAI, the system coordinates specialized agents for search, verification, and synthesis.
- **Real-Time Streaming**: Utilizing Server-Sent Events (SSE), research progress and agent internal thoughts are streamed to the interface as they happen.
- **Weighted Scoring Engine**: Sources are ranked and filtered based on a multi-dimensional scoring algorithm (relevance, authority, and recency).
- **Session Persistence**: Complete research sessions are persisted to MongoDB, allowing for historical review and iterative analysis.
- **Export Capabilities**: Finalized manuscripts can be exported to PDF format for professional distribution.

## Technical Stack

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Agent Framework**: CrewAI 1.14.x
- **Database**: MongoDB (via Motor/Pymongo)
- **Primary LLM**: Google Gemini (Flash/Pro)
- **Fallback Chain**: Groq (Llama 3.1)
- **Deployment**: Configured for Render.com

### Frontend
- **Framework**: Next.js (React 19)
- **Styling**: Tailwind CSS 4
- **Animation**: Framer Motion
- **Data Visualization**: Recharts
- **Deployment**: Configured for Vercel

## Configuration

The system requires several environment variables for full operation.

### Backend (.env)
- `GEMINI_API_KEY`: Primary inference key.
- `SERPER_API_KEY`: Web search capabilities.
- `MONGODB_URI`: Atlas or local MongoDB connection string.
- `GROQ_API_KEY`: (Optional) Fallback inference provider.

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL`: URL of the running Axiom backend.

## Local Setup

### Backend
1. Navigate to the backend directory.
2. Install dependencies: `pip install -r requirements.txt`.
3. Configure the `.env` file with required keys.
4. Start the server: `python run.py`.

### Frontend
1. Navigate to the frontend directory.
2. Install dependencies: `npm install`.
3. Configure the `.env.local` file.
4. Start the development server: `npm run dev`.

## License

MIT License. Developed as part of the Axiom Research Initiative.
