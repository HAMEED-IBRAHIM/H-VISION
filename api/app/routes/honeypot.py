import logging
import time
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, HTMLResponse
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/honeypot", tags=["Honeypot System"])

# In-memory honeypot trap log
HONEYPOT_TRAPS: List[Dict[str, Any]] = []

# Fake admin panels, login pages, and API endpoints that look real but are traps
HONEYPOT_ENDPOINTS = {
    "/admin": "Admin Panel",
    "/wp-admin": "WordPress Admin",
    "/phpmyadmin": "phpMyAdmin",
    "/.env": "Environment File",
    "/api/v1/users/export": "User Data Export",
    "/backup.sql": "Database Backup",
    "/config.json": "Configuration File",
    "/.git/config": "Git Config",
    "/debug": "Debug Console",
    "/server-status": "Server Status",
}

def _record_trap(request: Request, endpoint: str, trap_type: str):
    """Record an attacker hitting a honeypot."""
    trap = {
        "id": f"TRAP-{len(HONEYPOT_TRAPS)+1:04d}",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source_ip": request.client.host if request.client else "unknown",
        "user_agent": request.headers.get("user-agent", "unknown"),
        "endpoint": endpoint,
        "trap_type": trap_type,
        "method": request.method,
        "headers": dict(request.headers),
        "query_params": dict(request.query_params),
        "threat_level": "HIGH",
        "description": f"Attacker attempted to access honeypot: {HONEYPOT_ENDPOINTS.get(endpoint, endpoint)}"
    }
    HONEYPOT_TRAPS.append(trap)
    logger.warning(f"🍯 HONEYPOT TRIGGERED: {trap['source_ip']} hit {endpoint} ({trap_type})")
    return trap

@router.get("/admin")
@router.post("/admin")
async def fake_admin(request: Request):
    _record_trap(request, "/admin", "Admin Panel Probe")
    return HTMLResponse(content="<html><head><title>Admin Login</title></head><body><h1>401 Unauthorized</h1><p>Authentication required.</p></body></html>", status_code=401)

@router.get("/wp-admin")
@router.get("/wp-login.php")
async def fake_wordpress(request: Request):
    _record_trap(request, "/wp-admin", "WordPress Probe")
    return HTMLResponse(content="<html><head><title>WordPress &rsaquo; Login</title></head><body><div id='login'><h1>WordPress</h1><form><p><label>Username</label><input type='text' name='log'/></p><p><label>Password</label><input type='password' name='pwd'/></p></form></div></body></html>", status_code=200)

@router.get("/.env")
async def fake_env(request: Request):
    _record_trap(request, "/.env", "Sensitive File Probe")
    return JSONResponse(content={"error": "Access denied"}, status_code=403)

@router.get("/.git/config")
async def fake_git(request: Request):
    _record_trap(request, "/.git/config", "Git Config Probe")
    return JSONResponse(content={"error": "Not found"}, status_code=404)

@router.get("/backup.sql")
@router.get("/db.sql")
@router.get("/dump.sql")
async def fake_backup(request: Request):
    _record_trap(request, "/backup.sql", "Database Dump Probe")
    return JSONResponse(content={"error": "Forbidden"}, status_code=403)

@router.get("/debug")
@router.get("/server-status")
async def fake_debug(request: Request):
    _record_trap(request, "/debug", "Debug Console Probe")
    return JSONResponse(content={"error": "Unauthorized"}, status_code=401)

@router.get("/api/v1/users/export")
async def fake_user_export(request: Request):
    _record_trap(request, "/api/v1/users/export", "Data Exfiltration Attempt")
    return JSONResponse(content={"error": "Insufficient privileges"}, status_code=403)

@router.get("/phpmyadmin")
async def fake_phpmyadmin(request: Request):
    _record_trap(request, "/phpmyadmin", "phpMyAdmin Probe")
    return HTMLResponse(content="<html><head><title>phpMyAdmin</title></head><body><h1>phpMyAdmin</h1><p>Access denied. You don't have permission.</p></body></html>", status_code=403)

@router.get("/config.json")
async def fake_config(request: Request):
    _record_trap(request, "/config.json", "Config Probe")
    return JSONResponse(content={"error": "File not found"}, status_code=404)

# ── Management Endpoints ──

@router.get("/traps")
async def get_traps():
    """Get all honeypot trap records."""
    return {"traps": HONEYPOT_TRAPS, "total": len(HONEYPOT_TRAPS), "endpoints_active": len(HONEYPOT_ENDPOINTS)}

@router.get("/stats")
async def get_honeypot_stats():
    """Honeypot statistics."""
    by_type = {}
    by_ip = {}
    for t in HONEYPOT_TRAPS:
        by_type[t["trap_type"]] = by_type.get(t["trap_type"], 0) + 1
        by_ip[t["source_ip"]] = by_ip.get(t["source_ip"], 0) + 1
    return {
        "total_traps": len(HONEYPOT_TRAPS),
        "active_endpoints": len(HONEYPOT_ENDPOINTS),
        "by_type": by_type,
        "by_ip": by_ip,
        "top_attacker": max(by_ip, key=by_ip.get) if by_ip else None
    }
