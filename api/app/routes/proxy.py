import logging
import httpx
import re
from fastapi import APIRouter, Request, Response, HTTPException
from fastapi.responses import JSONResponse
from typing import List, Dict

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Reverse Proxy Gateway"])

# Active WAF rules stored in memory (in a production environment, this would sync with Redis/DB)
# Format: {"id": "rule_1", "pattern": "regex_pattern", "description": "Blocks XSS"}
ACTIVE_WAF_RULES: List[Dict[str, str]] = []

# Target application we are protecting (e.g., OWASP Juice Shop)
TARGET_URL = "http://juice-shop:3000"

# Httpx client for forwarding requests
client = httpx.AsyncClient()

def check_waf(payload: str) -> bool:
    """Returns True if the payload violates a WAF rule, False otherwise."""
    for rule in ACTIVE_WAF_RULES:
        try:
            if re.search(rule["pattern"], payload, re.IGNORECASE):
                logger.warning(f"🛡️ WAF BLOCKED REQUEST! Matched rule: {rule['id']} - {rule['description']}")
                return True
        except Exception as e:
            logger.error(f"Regex error in rule {rule['id']}: {e}")
    return False

@router.api_route("/proxy/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
async def reverse_proxy(request: Request, path: str):
    """
    Real-Time Reverse Proxy & AI WAF
    Intercepts traffic, checks it against active AI-generated rules, and forwards it to the target app.
    """
    # 1. Capture the request data
    body = await request.body()
    body_str = body.decode('utf-8', errors='ignore')
    query_string = request.url.query
    
    # 2. Reconstruct the full payload for analysis
    full_payload = f"{path} ? {query_string} \n {body_str}"
    
    # 3. Active Defense WAF Check
    if check_waf(full_payload):
        return JSONResponse(
            status_code=403, 
            content={
                "error": "Access Denied by JANUS-Sentinel AI WAF",
                "message": "Malicious payload detected and blocked."
            }
        )
    
    # 4. Forward the request to the real downstream target
    target_req_url = f"{TARGET_URL}/{path}"
    if query_string:
        target_req_url += f"?{query_string}"
        
    try:
        # Build headers (excluding host to avoid conflicts)
        headers = {}
        for k, v in request.headers.items():
            if k.lower() not in ("host", "content-length"):
                headers[k] = v
                
        # Send the proxy request
        proxy_resp = await client.request(
            method=request.method,
            url=target_req_url,
            headers=headers,
            content=body,
            timeout=10.0
        )
        
        # 5. Return the target's response back to the client
        response_headers = dict(proxy_resp.headers)
        response_headers.pop("content-encoding", None)
        response_headers.pop("content-length", None)
        
        return Response(
            content=proxy_resp.content,
            status_code=proxy_resp.status_code,
            headers=response_headers,
            media_type=proxy_resp.headers.get("content-type")
        )
        
    except httpx.RequestError as exc:
        logger.error(f"Proxy error forwarding to {TARGET_URL}: {exc}")
        raise HTTPException(status_code=502, detail="Bad Gateway: Target application is unreachable.")

@router.post("/waf/rules")
async def add_waf_rule(rule: dict):
    """
    Endpoint for the Blue Team AI to dynamically inject new WAF rules.
    Expected payload: {"id": "str", "pattern": "regex", "description": "str"}
    """
    if "pattern" not in rule or "id" not in rule:
        raise HTTPException(status_code=400, detail="Invalid rule format. Requires 'id' and 'pattern'.")
    
    # Test if the regex is valid
    try:
        re.compile(rule["pattern"])
    except re.error:
        raise HTTPException(status_code=400, detail="Invalid regex pattern.")
        
    ACTIVE_WAF_RULES.append(rule)
    logger.info(f"✅ New WAF Rule injected: {rule['id']} -> {rule['pattern']}")
    return {"status": "success", "message": f"Rule {rule['id']} activated in real-time WAF memory.", "rules_count": len(ACTIVE_WAF_RULES)}

@router.get("/waf/rules")
async def get_waf_rules():
    return {"rules": ACTIVE_WAF_RULES}

@router.delete("/waf/rules/{rule_id}")
async def delete_waf_rule(rule_id: str):
    global ACTIVE_WAF_RULES
    ACTIVE_WAF_RULES = [r for r in ACTIVE_WAF_RULES if r["id"] != rule_id]
    return {"status": "success", "message": f"Rule {rule_id} removed."}
