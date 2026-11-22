"""
H-VISION API — Adversarial Hardening Routes
Endpoints for orchestrating multi-round WAF mutation convergence,
human approval, rule deployment, and rollback.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from app.hardening.engine import (
    HardeningEngine,
    HARDENING_SESSIONS,
    ROLLBACK_ARCHIVE,
    validate_target_host
)

router = APIRouter(prefix="/hardening", tags=["Adversarial Hardening"])

class StartHardeningRequest(BaseModel):
    seed_payload: str = "' OR '1'='1"
    attack_type: str = "sql_injection"
    endpoint: str = "/search"
    target_url: str = "http://localhost:8001"

class RejectRequest(BaseModel):
    reason: Optional[str] = "Manually rejected by SOC analyst"

@router.post("/start")
async def start_hardening(request: StartHardeningRequest):
    """
    Initiate an Adversarial Hardening loop against a trigger attack payload.
    Runs mutation stress-testing and converges on a resilient WAF rule.
    """
    try:
        validate_target_host(request.target_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        session = await HardeningEngine.run_hardening_session(
            seed_payload=request.seed_payload,
            attack_type=request.attack_type,
            endpoint=request.endpoint,
            target_url=request.target_url
        )
        return session
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hardening loop execution error: {str(e)}")

@router.get("/sessions")
async def list_sessions():
    """List all executed Adversarial Hardening sessions."""
    summaries = []
    for s_id, s in HARDENING_SESSIONS.items():
        summaries.append({
            "session_id": s["session_id"],
            "status": s["status"],
            "attack_type": s["attack_type"],
            "seed_payload": s["seed_payload"],
            "total_rounds": s["total_rounds"],
            "converged": s["converged"],
            "final_rule": s["final_rule"],
            "approval_status": s["approval_status"],
            "started_at": s["started_at"],
            "duration_seconds": s["duration_seconds"],
        })
    return {"sessions": summaries, "total": len(summaries)}

@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    """Retrieve full session data, including rounds, convergence chart data, and audit logs."""
    session = HARDENING_SESSIONS.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.post("/sessions/{session_id}/approve")
async def approve_rule(session_id: str):
    """Human-in-the-loop: Approve the hardened rule and deploy it to the live target WAF."""
    try:
        result = HardeningEngine.approve_and_deploy(session_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sessions/{session_id}/reject")
async def reject_rule(session_id: str, body: RejectRequest = None):
    """Human-in-the-loop: Reject candidate rule without deploying."""
    reason = body.reason if body else "Rejected by analyst"
    try:
        return HardeningEngine.reject_rule(session_id, reason=reason)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/rules/{rule_id}/rollback")
async def rollback_rule(rule_id: str):
    """Rollback a deployed rule, purging it from the gateway."""
    return HardeningEngine.rollback_rule(rule_id)

@router.get("/rollback-archive")
async def get_rollback_archive():
    """List rules available for rollback."""
    return {"archive": list(ROLLBACK_ARCHIVE.values())}
