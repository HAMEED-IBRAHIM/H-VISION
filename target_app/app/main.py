"""
JANUS-Sentinel Target Lab Application — main.py
================================================
A deliberately vulnerable FastAPI application used as the Red Team's
attack target inside the Docker lab network.

Vulnerable routes exist at their natural path.
Secure routes exist under /secure/<same-path>.

The CaptureMiddleware intercepts every request and forwards a
sanitised event to the JANUS-Sentinel API for analysis.
"""

import os
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel
from app.database import engine, Base, seed_data
from app.middleware import CaptureMiddleware
from app.patching import get_mode
from app import waf

# ── Vulnerable routes ──────────────────────────────────────────
from app.routes.vulnerable.sql_injection import router as vuln_sql_router
from app.routes.vulnerable.xss import router as vuln_xss_router
from app.routes.vulnerable.auth import router as vuln_auth_router
from app.routes.vulnerable.authz import router as vuln_authz_router

# ── Secure routes ──────────────────────────────────────────────
from app.routes.secure.secure_sql import router as secure_sql_router
from app.routes.secure.secure_xss import router as secure_xss_router
from app.routes.secure.secure_auth import router as secure_auth_router
from app.routes.secure.secure_authz import router as secure_authz_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("target_app")

app = FastAPI(
    title="JANUS-Sentinel Lab Target",
    description=(
        "Deliberately vulnerable web application for academic security testing. "
        "For use ONLY inside the JANUS-Sentinel Docker lab network."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url=None,
)

# ── CORS (lab-only — intentionally permissive for testing) ─────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Capture middleware (must be added last so it wraps everything)
app.add_middleware(CaptureMiddleware)


# ── Startup / Shutdown ─────────────────────────────────────────
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_data()
    mode = get_mode()
    logger.info("Target application started in %s mode", mode)


@app.on_event("shutdown")
async def shutdown():
    await engine.dispose()


# ── Health check (never captured by middleware) ────────────────
@app.get("/health", tags=["health"])
async def health():
    return {
        "status": "ok",
        "service": "target_app",
        "mode": get_mode(),
    }


# ── Mode info ─────────────────────────────────────────────────
@app.get("/mode", tags=["info"])
async def mode_info():
    return {"mode": get_mode(), "description": "vulnerable or secure"}


# ── Active Defense WAF API ──────────────────────────────────────
class WafRule(BaseModel):
    id: str
    pattern: str
    description: str

@app.post("/waf/rules", tags=["waf"])
async def add_waf_rule(rule: WafRule):
    waf.add_rule(rule.id, rule.pattern, rule.description)
    logger.info(f"WAF Rule added: {rule.id} -> {rule.pattern}")
    return {"status": "success", "message": f"Rule {rule.id} added"}

@app.get("/waf/rules", tags=["waf"])
async def get_waf_rules():
    return {"rules": waf.active_rules}
# ─────────────────────────────────────────────────────────────
#  Cyber Deception (Honey-Tokens)
# ─────────────────────────────────────────────────────────────
@app.get("/admin_backup.zip", tags=["honey-token"])
async def honey_token_backup():
    # If the attacker touches this, the CaptureMiddleware sends it to the SOC
    # and the Detection Engine will flag it as CRITICAL
    return {"error": "Access Denied"}

@app.get("/.aws/credentials", tags=["honey-token"])
async def honey_token_aws():
    return {"error": "Access Denied"}
@app.delete("/waf/rules/{rule_id}", tags=["waf"])
async def delete_waf_rule(rule_id: str):
    waf.remove_rule(rule_id)
    return {"status": "success", "message": f"Rule {rule_id} removed"}

class SelfHealRequest(BaseModel):
    target_file: str
    unified_diff: str

@app.post("/waf/self-heal", tags=["waf", "self-healing"])
async def apply_self_healing_patch(request: SelfHealRequest):
    """
    Self-Healing Code Engine.
    Receives a diff from the Blue Team and applies it to the live source code!
    Uvicorn will automatically detect the file change and restart the worker securely!
    """
    import os
    import patch as p_lib # We need the python-patch library, but we can do a simpler replacement if it's full file
    
    # Actually, the Blue agent currently sends unified diffs.
    # To keep it reliable without external dependencies in target_app, let's just write a simple 
    # file replacement if the payload is the full file, or we can use the `patch` command via os.system.
    
    filepath = os.path.join(os.getcwd(), request.target_file)
    if not os.path.exists(filepath):
        # Maybe it's relative?
        filepath = os.path.join(os.getcwd(), request.target_file.lstrip('/'))
        if not os.path.exists(filepath):
            return {"status": "error", "message": f"File not found: {filepath}"}
            
    # Write the diff to a temporary file and apply it
    diff_path = "/tmp/patch.diff"
    with open(diff_path, "w") as f:
        f.write(request.unified_diff)
        
    res = os.system(f"patch -p1 < {diff_path}")
    if res == 0:
        logger.warning(f"🚀 SELF HEALING SUCCESS: {request.target_file} patched. Restarting...")
        return {"status": "success"}
    else:
        # Fallback: if patch fails, maybe the diff isn't cleanly applying.
        return {"status": "error", "message": "Patch command failed."}


# ─────────────────────────────────────────────────────────────
#  Register vulnerable routes
# ─────────────────────────────────────────────────────────────
app.include_router(vuln_sql_router, tags=["vulnerable-sql"])
app.include_router(vuln_xss_router, tags=["vulnerable-xss"])
app.include_router(vuln_auth_router, tags=["vulnerable-auth"])
app.include_router(vuln_authz_router, tags=["vulnerable-authz"])

# ─────────────────────────────────────────────────────────────
#  Register secure routes (prefix: /secure)
# ─────────────────────────────────────────────────────────────
app.include_router(secure_sql_router, prefix="/secure", tags=["secure-sql"])
app.include_router(secure_xss_router, prefix="/secure", tags=["secure-xss"])
app.include_router(secure_auth_router, prefix="/secure", tags=["secure-auth"])
app.include_router(secure_authz_router, prefix="/secure", tags=["secure-authz"])
