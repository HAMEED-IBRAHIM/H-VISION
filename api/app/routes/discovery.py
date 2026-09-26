import logging
import time
import httpx
from fastapi import APIRouter
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/discovery", tags=["API Discovery & Attack Surface"])

# ── Discovered endpoints inventory ──
DISCOVERED_ENDPOINTS: List[Dict[str, Any]] = []
SCAN_RESULTS: Dict[str, Any] = {}

# Common paths to probe for discovery
COMMON_PATHS = [
    "/", "/api", "/api/v1", "/api/v2", "/login", "/register", "/admin",
    "/users", "/user", "/profile", "/settings", "/dashboard",
    "/search", "/products", "/cart", "/checkout", "/orders",
    "/upload", "/download", "/files", "/images", "/static",
    "/health", "/status", "/metrics", "/debug", "/info",
    "/robots.txt", "/sitemap.xml", "/.well-known/security.txt",
    "/graphql", "/swagger", "/docs", "/redoc", "/openapi.json",
    "/rest/user/login", "/rest/user/whoami", "/rest/products/search",
    "/rest/basket", "/rest/admin", "/api/Feedbacks", "/api/Users",
    "/api/Products", "/api/Challenges", "/api/Complaints",
    "/api/SecurityQuestions", "/api/Recycles", "/api/SecurityAnswers",
    "/ftp", "/encryptionkeys", "/premium-content", "/support/logs",
    "/snippets", "/redirect", "/video", "/promotion", "/accounting",
]

SECURITY_HEADERS_CHECKLIST = [
    "strict-transport-security",
    "content-security-policy",
    "x-content-type-options",
    "x-frame-options",
    "x-xss-protection",
    "referrer-policy",
    "permissions-policy",
    "cross-origin-opener-policy",
    "cross-origin-resource-policy",
]


@router.post("/scan")
async def scan_target(body: dict = None):
    """Discover all endpoints on a target application and analyze its attack surface."""
    target_url = (body or {}).get("target_url", "http://juice-shop:3000")
    
    global DISCOVERED_ENDPOINTS, SCAN_RESULTS
    DISCOVERED_ENDPOINTS = []
    
    results = {
        "target": target_url,
        "scan_started": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "endpoints_found": 0,
        "status_codes": {},
        "security_headers": {},
        "missing_security_headers": [],
        "technologies_detected": [],
        "risk_summary": {},
    }
    
    async with httpx.AsyncClient(timeout=5.0, follow_redirects=True) as client:
        # 1. Probe common paths
        for path in COMMON_PATHS:
            try:
                url = f"{target_url}{path}"
                resp = await client.get(url)
                status = resp.status_code
                
                endpoint = {
                    "path": path,
                    "status_code": status,
                    "content_type": resp.headers.get("content-type", "unknown"),
                    "content_length": len(resp.content),
                    "server": resp.headers.get("server", "unknown"),
                    "accessible": status < 400,
                    "methods": ["GET"],
                }
                DISCOVERED_ENDPOINTS.append(endpoint)
                
                # Count status codes
                sc = str(status)
                results["status_codes"][sc] = results["status_codes"].get(sc, 0) + 1
                
            except Exception:
                pass
        
        # 2. Check security headers on root
        try:
            root_resp = await client.get(target_url)
            for header in SECURITY_HEADERS_CHECKLIST:
                present = header in [h.lower() for h in root_resp.headers.keys()]
                results["security_headers"][header] = present
                if not present:
                    results["missing_security_headers"].append(header)
            
            # Technology detection
            server = root_resp.headers.get("server", "")
            powered = root_resp.headers.get("x-powered-by", "")
            if server:
                results["technologies_detected"].append(f"Server: {server}")
            if powered:
                results["technologies_detected"].append(f"Framework: {powered}")
            body_text = root_resp.text[:2000].lower()
            if "express" in powered.lower() or "node" in body_text:
                results["technologies_detected"].append("Runtime: Node.js")
            if "angular" in body_text:
                results["technologies_detected"].append("Frontend: Angular")
            if "react" in body_text:
                results["technologies_detected"].append("Frontend: React")
                
        except Exception:
            pass
    
    results["endpoints_found"] = len(DISCOVERED_ENDPOINTS)
    results["accessible_endpoints"] = len([e for e in DISCOVERED_ENDPOINTS if e["accessible"]])
    results["scan_completed"] = time.strftime("%Y-%m-%dT%H:%M:%SZ")
    
    # Risk summary
    accessible = results["accessible_endpoints"]
    missing_headers = len(results["missing_security_headers"])
    results["risk_summary"] = {
        "attack_surface_score": min(100, accessible * 2 + missing_headers * 5),
        "exposed_endpoints": accessible,
        "missing_headers": missing_headers,
        "risk_level": "CRITICAL" if accessible > 20 else "HIGH" if accessible > 10 else "MEDIUM" if accessible > 5 else "LOW",
    }
    
    SCAN_RESULTS = results
    logger.info(f"🔍 API Discovery: Found {results['endpoints_found']} endpoints on {target_url}")
    return results


@router.get("/endpoints")
async def get_endpoints():
    return {"endpoints": DISCOVERED_ENDPOINTS, "total": len(DISCOVERED_ENDPOINTS)}


@router.get("/results")
async def get_results():
    return SCAN_RESULTS if SCAN_RESULTS else {"message": "No scan has been run yet. POST /discovery/scan to start."}
