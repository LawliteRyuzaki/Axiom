import time
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import get_settings
from app.core.logging import logger
from collections import defaultdict

class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    Simple In-Memory Rate Limiter.
    In a distributed production environment, this should use Redis.
    """
    def __init__(self, app):
        super().__init__(app)
        self.requests = defaultdict(list)
        self.settings = get_settings()

    async def dispatch(self, request: Request, call_next):
        # Only rate limit research endpoints
        if not request.url.path.startswith("/api/research"):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()
        
        # Clean up old requests (older than 60s)
        self.requests[client_ip] = [t for t in self.requests[client_ip] if current_time - t < 60]
        
        limit = self.settings.rate_limit_requests_per_minute
        if len(self.requests[client_ip]) >= limit:
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            raise HTTPException(
                status_code=429, 
                detail="Too many research requests. Please wait a minute."
            )
        
        self.requests[client_ip].append(current_time)
        return await call_next(request)
