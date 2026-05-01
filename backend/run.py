"""
Entry point for running the Axiom backend server.
Usage:
  Development : python run.py
  Production  : uvicorn app.main:app --host 0.0.0.0 --port 8000
"""

import uvicorn
import os

if __name__ == "__main__":
    # Render provides the PORT environment variable
    port = int(os.environ.get("PORT", 8000))
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=False,          # Disable reload in production
        log_level="info",
        timeout_keep_alive=65,
    )
