import os
import time
import httpx
import logging
import asyncio
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from fastapi.responses import JSONResponse
from app import waf

logger = logging.getLogger(__name__)

class CaptureMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.api_url = os.getenv("API_URL", "http://localhost:8000")
        self.internal_token = os.getenv("INTERNAL_SERVICE_TOKEN", "change-me")
        
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Capture request body
        body = b""
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                body = await request.body()
            except Exception:
                pass

        response = None
        is_blocked = False
        
        # Check WAF rules BEFORE processing the request
        if waf.check_request(request.url.path, str(request.query_params), body.decode('utf-8', errors='ignore')):
            is_blocked = True
            response = JSONResponse(
                status_code=403, 
                content={"error": "Forbidden", "message": "Request blocked by Active Defense WAF."}
            )
            process_time_ms = (time.time() - start_time) * 1000
        else:
            response = await call_next(request)
            process_time_ms = (time.time() - start_time) * 1000
        
        if request.url.path == "/health":
            return response
            
        # Asynchronously send event to main API
        asyncio.create_task(self.send_event(
            method=request.method,
            path=request.url.path,
            query_params=str(request.query_params),
            headers=dict(request.headers),
            body=body.decode('utf-8', errors='ignore'),
            status_code=response.status_code,
            process_time_ms=process_time_ms,
            ip=request.client.host if request.client else "unknown",
            user_agent=request.headers.get("user-agent", "unknown")
        ))
        
        return response
        
    async def send_event(self, **event_data):
        try:
            # Mask sensitive data here
            if "authorization" in event_data.get("headers", {}):
                event_data["headers"]["authorization"] = "[MASKED]"
                
            async with httpx.AsyncClient() as client:
                await client.post(
                    f"{self.api_url}/api/v1/internal/events",
                    json=event_data,
                    headers={"Authorization": f"Bearer {self.internal_token}"},
                    timeout=5.0
                )
        except Exception as e:
            logger.error(f"Failed to send captured event: {e}")
