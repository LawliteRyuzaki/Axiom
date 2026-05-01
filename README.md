<div align="center">

# ◈ Axiom v4

**Deterministic Insight. Staff-Level Research.**

A high-trust research engine designed for absolute truth and academic rigor.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Axiom_v4](https://img.shields.io/badge/Axiom_v4-Engine-blue?style=flat-square)](https://axiom.ai)

</div>

---

## What is Axiom v4?

Axiom v4 is a **Deterministic Research Engine** that transforms complex goals into verified, strategic manuscripts. It moves beyond probabilistic agent reasoning into a clinical, code-driven execution pipeline.

### The v4 Truth-First Protocol

1.  **Research Architect** — Designs a verifiable 3-phase technical roadmap.
2.  **Information Scout** — Generates hyper-optimized search queries targeting high-fidelity domains.
3.  **Evidence Curator** — Performs **Hard Verification** (live URL cross-referencing) and **Deterministic Scoring**.
4.  **Quality Auditor** — Clinical peer-review with automated **Iterative Refinement Loops**.
5.  **Principal Correspondent** — Synthesizes a 100% verified manuscript with verbatim citations.

---

## 🏗️ Architecture

Axiom v4 operates as a **State Machine**. The LLM handles reasoning, while the deterministic core handles data integrity and speed.

*   **Parallel Retrieval**: Concurrent search across arXiv and general web.
*   **Hard Verification**: Live content matching to eliminate hallucinations.
*   **Deterministic Scoring**: Weighted ranking (Relevance, Credibility, Recency) via Python logic.
*   **Deduplication Engine**: Hash-based URL normalization for zero redundancy.
*   **AxiomCache**: TTL-based in-memory caching for ultra-low latency.

---

## ⚡ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 + Framer Motion |
| **Backend** | FastAPI + Uvicorn |
| **Orchestrator** | Axiom v4 Pipeline Controller |
| **Agents** | CrewAI 1.14 |
| **Verification** | Deterministic SourceValidator (v4) |
| **Search** | Hybrid (Serper + arXiv API) |
| **Database** | MongoDB Atlas |

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

## 🛡️ Failure Policy

*   **Verified Only**: If no sources pass the hard verification threshold, the engine returns an empty result rather than a hallucinated one.
*   **No Placeholders**: Citations must be live, reachable, and factually accurate.
*   **Clinical Objectivity**: Reports are written in an editorial, scholarly tone free of AI fluff.

---

MIT License. Build with truth.
