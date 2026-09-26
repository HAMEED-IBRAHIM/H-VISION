import logging
import time
from fastapi import APIRouter
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/timeline", tags=["Attack Timeline & Kill Chain"])

# ── MITRE ATT&CK Kill Chain Phases ──
KILL_CHAIN_PHASES = [
    {"id": "reconnaissance", "name": "Reconnaissance", "tactic_id": "TA0043", "icon": "🔍"},
    {"id": "resource_dev", "name": "Resource Development", "tactic_id": "TA0042", "icon": "🛠️"},
    {"id": "initial_access", "name": "Initial Access", "tactic_id": "TA0001", "icon": "🚪"},
    {"id": "execution", "name": "Execution", "tactic_id": "TA0002", "icon": "⚡"},
    {"id": "persistence", "name": "Persistence", "tactic_id": "TA0003", "icon": "📌"},
    {"id": "privilege_esc", "name": "Privilege Escalation", "tactic_id": "TA0004", "icon": "⬆️"},
    {"id": "defense_evasion", "name": "Defense Evasion", "tactic_id": "TA0005", "icon": "🥷"},
    {"id": "credential_access", "name": "Credential Access", "tactic_id": "TA0006", "icon": "🔑"},
    {"id": "discovery", "name": "Discovery", "tactic_id": "TA0007", "icon": "🗺️"},
    {"id": "lateral_movement", "name": "Lateral Movement", "tactic_id": "TA0008", "icon": "↔️"},
    {"id": "collection", "name": "Collection", "tactic_id": "TA0009", "icon": "📦"},
    {"id": "exfiltration", "name": "Exfiltration", "tactic_id": "TA0010", "icon": "📤"},
    {"id": "impact", "name": "Impact", "tactic_id": "TA0040", "icon": "💥"},
]

# ── Attack events mapped to kill chain ──
TIMELINE_EVENTS: List[Dict[str, Any]] = []


def record_attack_event(attack_type: str, endpoint: str, payload: str, severity: str, status_code: int):
    """Record an attack event and map it to the MITRE ATT&CK kill chain."""
    # Map attack types to kill chain phases
    phase_map = {
        "sql_injection": "initial_access",
        "xss": "execution",
        "path_traversal": "discovery",
        "brute_force": "credential_access",
        "command_injection": "execution",
        "idor": "lateral_movement",
        "ssrf": "initial_access",
        "nosql": "initial_access",
        "jwt_attack": "credential_access",
    }

    technique_map = {
        "sql_injection": {"id": "T1190", "name": "Exploit Public-Facing Application"},
        "xss": {"id": "T1059.007", "name": "JavaScript Execution"},
        "path_traversal": {"id": "T1083", "name": "File and Directory Discovery"},
        "brute_force": {"id": "T1110", "name": "Brute Force"},
        "command_injection": {"id": "T1059", "name": "Command and Scripting Interpreter"},
        "idor": {"id": "T1078", "name": "Valid Accounts"},
        "ssrf": {"id": "T1190", "name": "Exploit Public-Facing Application"},
        "nosql": {"id": "T1190", "name": "Exploit Public-Facing Application"},
        "jwt_attack": {"id": "T1552", "name": "Unsecured Credentials"},
    }

    phase = phase_map.get(attack_type, "initial_access")
    technique = technique_map.get(attack_type, {"id": "T1190", "name": "Unknown"})

    event = {
        "id": f"EVT-{len(TIMELINE_EVENTS)+1:05d}",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "attack_type": attack_type,
        "kill_chain_phase": phase,
        "technique": technique,
        "endpoint": endpoint,
        "payload_preview": payload[:80] if payload else "",
        "severity": severity,
        "status_code": status_code,
        "blocked": status_code == 403,
        "response": "BLOCKED by WAF" if status_code == 403 else "DETECTED" if severity in ["Critical", "High"] else "LOGGED",
    }
    TIMELINE_EVENTS.append(event)
    return event


@router.get("/events")
async def get_timeline():
    """Get the full attack timeline with kill chain mapping."""
    return {
        "events": TIMELINE_EVENTS[-200:],
        "total": len(TIMELINE_EVENTS),
    }


@router.get("/kill-chain")
async def get_kill_chain_summary():
    """Get kill chain phase summary with counts."""
    phase_counts = {p["id"]: 0 for p in KILL_CHAIN_PHASES}
    phase_blocked = {p["id"]: 0 for p in KILL_CHAIN_PHASES}

    for event in TIMELINE_EVENTS:
        phase = event.get("kill_chain_phase", "initial_access")
        if phase in phase_counts:
            phase_counts[phase] += 1
            if event.get("blocked"):
                phase_blocked[phase] += 1

    result = []
    for phase in KILL_CHAIN_PHASES:
        pid = phase["id"]
        total = phase_counts[pid]
        blocked = phase_blocked[pid]
        result.append({
            **phase,
            "total_attacks": total,
            "blocked": blocked,
            "success_rate": round(((total - blocked) / total * 100) if total > 0 else 0, 1),
            "status": "BREACHED" if total > 0 and blocked < total else "DEFENDED" if total > 0 else "NO_ACTIVITY",
        })
    return {"kill_chain": result}


@router.get("/techniques")
async def get_techniques_used():
    """Get all MITRE ATT&CK techniques observed."""
    techniques = {}
    for event in TIMELINE_EVENTS:
        tech = event.get("technique", {})
        tid = tech.get("id", "unknown")
        if tid not in techniques:
            techniques[tid] = {
                "technique_id": tid,
                "technique_name": tech.get("name", "Unknown"),
                "count": 0,
                "blocked": 0,
                "first_seen": event["timestamp"],
                "last_seen": event["timestamp"],
                "severities": [],
            }
        techniques[tid]["count"] += 1
        if event.get("blocked"):
            techniques[tid]["blocked"] += 1
        techniques[tid]["last_seen"] = event["timestamp"]
        if event["severity"] not in techniques[tid]["severities"]:
            techniques[tid]["severities"].append(event["severity"])

    return {"techniques": list(techniques.values())}
