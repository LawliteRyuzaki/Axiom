"""
Entry point for running the Axiom backend server.
Usage:
  Development : python run.py
  Production  : uvicorn app.main:app --host 0.0.0.0 --port 8000
"""

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,           # Hot reload in dev
        log_level="info",
        timeout_keep_alive=65, # Longer than Render's 60s idle timeout
    )
