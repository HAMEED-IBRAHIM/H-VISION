import logging
from fastapi import APIRouter
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/compliance", tags=["Compliance & Risk"])

OWASP_TOP_10 = {
    "A01": {"name": "Broken Access Control", "cwe": ["CWE-22", "CWE-284", "CWE-285", "CWE-639"], "attacks": ["idor", "path_traversal"]},
    "A02": {"name": "Cryptographic Failures", "cwe": ["CWE-259", "CWE-327", "CWE-328"], "attacks": ["jwt_attack"]},
    "A03": {"name": "Injection", "cwe": ["CWE-79", "CWE-89", "CWE-78"], "attacks": ["sql_injection", "xss", "command_injection", "nosql"]},
    "A04": {"name": "Insecure Design", "cwe": ["CWE-209", "CWE-256"], "attacks": []},
    "A05": {"name": "Security Misconfiguration", "cwe": ["CWE-16", "CWE-611"], "attacks": ["ssrf"]},
    "A06": {"name": "Vulnerable Components", "cwe": ["CWE-1104"], "attacks": []},
    "A07": {"name": "Auth Failures", "cwe": ["CWE-287", "CWE-307"], "attacks": ["brute_force"]},
    "A08": {"name": "Software & Data Integrity", "cwe": ["CWE-502"], "attacks": []},
    "A09": {"name": "Logging & Monitoring Failures", "cwe": ["CWE-778"], "attacks": []},
    "A10": {"name": "SSRF", "cwe": ["CWE-918"], "attacks": ["ssrf"]},
}

@router.get("/score")
async def get_compliance_score():
    """Calculate a real-time Security Posture Score based on system state."""
    from app.routes.events import DETECTIONS_DB
    from app.routes.proxy import ACTIVE_WAF_RULES
    from app.routes.honeypot import HONEYPOT_TRAPS
    
    total_detections = len(DETECTIONS_DB)
    total_waf_rules = len(ACTIVE_WAF_RULES)
    total_traps = len(HONEYPOT_TRAPS)
    
    # Scoring algorithm:
    # Start at 100, deduct for unpatched vulns, add for active defenses
    base_score = 100
    
    # Deduct for unpatched critical findings
    critical_count = sum(1 for d in DETECTIONS_DB if d.get("severity") == "Critical")
    high_count = sum(1 for d in DETECTIONS_DB if d.get("severity") == "High")
    medium_count = sum(1 for d in DETECTIONS_DB if d.get("severity") == "Medium")
    
    deductions = (critical_count * 8) + (high_count * 4) + (medium_count * 2)
    
    # Add points for active defenses
    defense_bonus = min(30, total_waf_rules * 5)  # Max 30 bonus points for WAF rules
    honeypot_bonus = min(10, total_traps * 2)  # Honeypots catching attackers is good
    
    final_score = max(0, min(100, base_score - deductions + defense_bonus + honeypot_bonus))
    
    # OWASP mapping
    owasp_status = []
    for code, info in OWASP_TOP_10.items():
        related_detections = [d for d in DETECTIONS_DB if any(a in d.get("rule_name", "").lower() for a in info["attacks"])] if info["attacks"] else []
        related_waf = [r for r in ACTIVE_WAF_RULES if any(a in r.get("description", "").lower() for a in info["attacks"])] if info["attacks"] else []
        
        if related_detections and not related_waf:
            status = "FAILING"
        elif related_detections and related_waf:
            status = "MITIGATED"
        elif not info["attacks"]:
            status = "NOT_TESTED"
        else:
            status = "PASSING"
        
        owasp_status.append({
            "code": code,
            "name": info["name"],
            "status": status,
            "vulnerabilities_found": len(related_detections),
            "waf_rules_active": len(related_waf),
        })
    
    return {
        "security_posture_score": final_score,
        "grade": "A+" if final_score >= 95 else "A" if final_score >= 85 else "B" if final_score >= 70 else "C" if final_score >= 50 else "D" if final_score >= 30 else "F",
        "total_detections": total_detections,
        "critical_vulns": critical_count,
        "high_vulns": high_count,
        "medium_vulns": medium_count,
        "active_waf_rules": total_waf_rules,
        "honeypot_traps": total_traps,
        "owasp_top_10": owasp_status,
        "recommendations": [
            "Enable rate limiting on all authentication endpoints" if high_count > 0 else None,
            "Deploy additional honeypot endpoints for lateral movement detection" if total_traps < 5 else None,
            f"Address {critical_count} critical vulnerabilities immediately" if critical_count > 0 else None,
            "Consider implementing Content Security Policy headers" if any(d.get("rule_name", "").lower().count("xss") for d in DETECTIONS_DB) else None,
        ]
    }

@router.get("/owasp")
async def get_owasp_mapping():
    return {"owasp_top_10": OWASP_TOP_10}
