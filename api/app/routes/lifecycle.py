import logging
import time
from fastapi import APIRouter
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/lifecycle", tags=["Vulnerability Lifecycle"])

# ── Real Vulnerability Lifecycle Pipeline ──
# Vulnerabilities flow through: DISCOVERED → TRIAGED → ASSIGNED → IN_PROGRESS → PATCHED → VERIFIED → CLOSED
VULNERABILITY_PIPELINE: List[Dict[str, Any]] = []

LIFECYCLE_STAGES = [
    {"id": "discovered", "name": "Discovered", "icon": "🔍", "color": "red"},
    {"id": "triaged", "name": "Triaged", "icon": "📋", "color": "orange"},
    {"id": "assigned", "name": "Assigned", "icon": "👤", "color": "amber"},
    {"id": "in_progress", "name": "In Progress", "icon": "🔧", "color": "blue"},
    {"id": "patched", "name": "Patched", "icon": "🩹", "color": "cyan"},
    {"id": "verified", "name": "Verified", "icon": "✅", "color": "emerald"},
    {"id": "closed", "name": "Closed", "icon": "🔒", "color": "slate"},
]


def ingest_vulnerability_from_detection(detection: dict) -> None:
    """
    Called by the detection pipeline when a real vulnerability is found.
    Creates a lifecycle entry from actual detection data.
    """
    vuln_id = f"VULN-{len(VULNERABILITY_PIPELINE)+1:04d}"

    vuln = {
        "id": vuln_id,
        "title": f"{detection.get('rule_name', 'Unknown')} on {detection.get('event_path', 'unknown')}",
        "detection_id": detection.get("id", ""),
        "severity": detection.get("severity", "Medium"),
        "attack_type": detection.get("rule_name", "Unknown"),
        "endpoint": detection.get("event_path", "unknown"),
        "evidence": detection.get("evidence", ""),
        "stage": "discovered",
        "discovered_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "assigned_to": None,
        "history": [
            {
                "stage": "discovered",
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "actor": "DetectionEngine",
                "note": f"Auto-discovered via {detection.get('rule_name', 'detection engine')}",
            }
        ],
        "sla_hours": _get_sla(detection.get("severity", "Medium")),
        "sla_remaining_hours": _get_sla(detection.get("severity", "Medium")),
        "has_waf_rule": False,
        "has_patch": False,
    }

    # Check if WAF auto-blocked it
    try:
        from app.routes.proxy import ACTIVE_WAF_RULES
        evidence = detection.get("evidence", "")
        import re
        for rule in ACTIVE_WAF_RULES:
            try:
                if evidence and re.search(rule.get("pattern", ""), evidence, re.IGNORECASE):
                    vuln["has_waf_rule"] = True
                    vuln["stage"] = "in_progress"
                    vuln["history"].append({
                        "stage": "in_progress",
                        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                        "actor": "WAF AutoDefense",
                        "note": f"Auto-mitigated by WAF rule {rule.get('id', 'unknown')}",
                    })
                    break
            except Exception:
                pass
    except ImportError:
        pass

    VULNERABILITY_PIPELINE.append(vuln)
    logger.info(f"🔄 Lifecycle: Created {vuln_id} — {vuln['title']} [{vuln['stage']}]")


def _get_sla(severity: str) -> int:
    """Get SLA hours based on severity (industry standards)."""
    sla_map = {"Critical": 4, "High": 24, "Medium": 72, "Low": 168}
    return sla_map.get(severity, 72)


@router.get("/vulnerabilities")
async def get_vulnerability_pipeline():
    """Get the full vulnerability lifecycle pipeline with real data."""
    # Auto-ingest any new detections that haven't been added yet
    _sync_from_detections()

    return {
        "vulnerabilities": VULNERABILITY_PIPELINE,
        "total": len(VULNERABILITY_PIPELINE),
        "by_stage": {stage["id"]: sum(1 for v in VULNERABILITY_PIPELINE if v["stage"] == stage["id"]) for stage in LIFECYCLE_STAGES},
        "stages": LIFECYCLE_STAGES,
    }


@router.get("/board")
async def get_kanban_board():
    """Get vulnerabilities organized as a Kanban board by stage."""
    _sync_from_detections()

    board = {}
    for stage in LIFECYCLE_STAGES:
        board[stage["id"]] = {
            "stage": stage,
            "items": [v for v in VULNERABILITY_PIPELINE if v["stage"] == stage["id"]],
            "count": sum(1 for v in VULNERABILITY_PIPELINE if v["stage"] == stage["id"]),
        }
    return {"board": board}


@router.post("/vulnerabilities/{vuln_id}/advance")
async def advance_vulnerability(vuln_id: str, body: dict = None):
    """Move a vulnerability to the next stage in its lifecycle."""
    body = body or {}
    for vuln in VULNERABILITY_PIPELINE:
        if vuln["id"] == vuln_id:
            current_idx = next((i for i, s in enumerate(LIFECYCLE_STAGES) if s["id"] == vuln["stage"]), 0)
            if current_idx < len(LIFECYCLE_STAGES) - 1:
                next_stage = LIFECYCLE_STAGES[current_idx + 1]["id"]
                vuln["stage"] = next_stage
                vuln["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ")
                vuln["history"].append({
                    "stage": next_stage,
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "actor": body.get("actor", "admin"),
                    "note": body.get("note", f"Advanced to {next_stage}"),
                })
                if body.get("assigned_to"):
                    vuln["assigned_to"] = body["assigned_to"]
                logger.info(f"🔄 Lifecycle: {vuln_id} → {next_stage}")
                return {"status": "success", "new_stage": next_stage, "vuln": vuln}
            return {"error": "Already at final stage"}
    return {"error": "Vulnerability not found"}


@router.post("/vulnerabilities/{vuln_id}/set-stage")
async def set_vulnerability_stage(vuln_id: str, body: dict):
    """Set a vulnerability to a specific stage (e.g., skip to verified)."""
    target_stage = body.get("stage", "")
    valid_stages = [s["id"] for s in LIFECYCLE_STAGES]
    if target_stage not in valid_stages:
        return {"error": f"Invalid stage. Valid: {valid_stages}"}

    for vuln in VULNERABILITY_PIPELINE:
        if vuln["id"] == vuln_id:
            vuln["stage"] = target_stage
            vuln["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ")
            vuln["history"].append({
                "stage": target_stage,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "actor": body.get("actor", "admin"),
                "note": body.get("note", f"Manually set to {target_stage}"),
            })
            return {"status": "success", "vuln": vuln}
    return {"error": "Vulnerability not found"}


@router.get("/stats")
async def get_lifecycle_stats():
    """Get real lifecycle statistics."""
    _sync_from_detections()

    total = len(VULNERABILITY_PIPELINE)
    open_vulns = sum(1 for v in VULNERABILITY_PIPELINE if v["stage"] not in ["verified", "closed"])
    closed_vulns = sum(1 for v in VULNERABILITY_PIPELINE if v["stage"] in ["verified", "closed"])

    return {
        "total": total,
        "open": open_vulns,
        "closed": closed_vulns,
        "closure_rate": round((closed_vulns / total * 100) if total > 0 else 0, 1),
        "by_severity": {
            "Critical": sum(1 for v in VULNERABILITY_PIPELINE if v["severity"] == "Critical" and v["stage"] not in ["verified", "closed"]),
            "High": sum(1 for v in VULNERABILITY_PIPELINE if v["severity"] == "High" and v["stage"] not in ["verified", "closed"]),
            "Medium": sum(1 for v in VULNERABILITY_PIPELINE if v["severity"] == "Medium" and v["stage"] not in ["verified", "closed"]),
        },
        "sla_breached": sum(1 for v in VULNERABILITY_PIPELINE if v.get("sla_remaining_hours", 999) <= 0),
    }


def _sync_from_detections():
    """Auto-sync new detections into the vulnerability pipeline."""
    try:
        from app.routes.events import DETECTIONS_DB
        existing_det_ids = {v["detection_id"] for v in VULNERABILITY_PIPELINE}
        for det in DETECTIONS_DB:
            det_id = det.get("id", "")
            if det_id and det_id not in existing_det_ids:
                ingest_vulnerability_from_detection(det)
    except ImportError:
        pass
