"""
target_app/app/patching.py
==========================
Patching toggle module for the Blue Team.

VULNERABLE_ENABLED (env var) controls the global mode:
  "true"  → vulnerable endpoints are active (default for lab)
  "false" → secure endpoints are active

The Blue Team Agent calls apply_patch() via the JANUS-Sentinel
API, which in turn sets the environment variable and calls
apply_patch() here to hot-reload the behaviour.
"""

import os
import logging
from typing import Dict, List, Optional
from datetime import datetime

logger = logging.getLogger("target_app.patching")

# ── In-memory patch registry ───────────────────────────────────
_PATCH_REGISTRY: Dict[str, Dict] = {
    "sql_injection": {
        "name": "SQL Injection Fix",
        "description": "Replace raw string-interpolated SQL with parameterized queries",
        "vulnerability_type": "SQL_INJECTION",
        "cwe": "CWE-89",
        "risk_level": "HIGH",
        "applied": False,
        "applied_at": None,
    },
    "stored_xss": {
        "name": "Stored XSS Fix",
        "description": "HTML-encode all user-supplied content before storage and rendering",
        "vulnerability_type": "XSS",
        "cwe": "CWE-79",
        "risk_level": "HIGH",
        "applied": False,
        "applied_at": None,
    },
    "broken_auth": {
        "name": "Authentication Fix",
        "description": "Replace plaintext passwords with bcrypt hashing and add rate limiting",
        "vulnerability_type": "BROKEN_AUTHENTICATION",
        "cwe": "CWE-287",
        "risk_level": "CRITICAL",
        "applied": False,
        "applied_at": None,
    },
    "missing_authz": {
        "name": "Authorisation Fix",
        "description": "Add JWT-based ownership checks to profile and admin endpoints",
        "vulnerability_type": "BROKEN_ACCESS_CONTROL",
        "cwe": "CWE-639",
        "risk_level": "HIGH",
        "applied": False,
        "applied_at": None,
    },
    "idor": {
        "name": "IDOR Fix",
        "description": "Validate resource ownership before serving profile/order data",
        "vulnerability_type": "IDOR",
        "cwe": "CWE-284",
        "risk_level": "HIGH",
        "applied": False,
        "applied_at": None,
    },
    "missing_rate_limit": {
        "name": "Rate Limiting Fix",
        "description": "Add per-IP and per-endpoint rate limiting to authentication routes",
        "vulnerability_type": "MISSING_RATE_LIMIT",
        "cwe": "CWE-770",
        "risk_level": "MEDIUM",
        "applied": False,
        "applied_at": None,
    },
}

# ── Global mode ────────────────────────────────────────────────
# Reads from env; can be overridden at runtime.
_current_mode: str = (
    "vulnerable"
    if os.environ.get("VULNERABLE_ENABLED", "true").lower() == "true"
    else "secure"
)


def get_mode() -> str:
    """
    Returns the current patching mode: 'vulnerable' or 'secure'.
    """
    return _current_mode


def set_mode(mode: str) -> bool:
    """
    Switches the global mode.  Accepted values: 'vulnerable', 'secure'.
    Returns True if changed, False if invalid mode.
    """
    global _current_mode
    if mode not in ("vulnerable", "secure"):
        logger.error("Invalid mode: %s — must be 'vulnerable' or 'secure'", mode)
        return False
    _current_mode = mode
    logger.info("Mode switched to: %s", mode)
    return True


def apply_patch(patch_name: str) -> Dict:
    """
    Mark a patch as applied and switch to secure mode.

    Args:
        patch_name: Key from _PATCH_REGISTRY (e.g., 'sql_injection')

    Returns:
        dict with success, message, patch details.
    """
    global _current_mode

    if patch_name not in _PATCH_REGISTRY:
        return {
            "success": False,
            "message": f"Unknown patch: '{patch_name}'. Available: {list(_PATCH_REGISTRY.keys())}",
        }

    patch = _PATCH_REGISTRY[patch_name]
    if patch["applied"]:
        return {
            "success": True,
            "message": f"Patch '{patch_name}' was already applied.",
            "patch": patch,
        }

    patch["applied"] = True
    patch["applied_at"] = datetime.utcnow().isoformat()

    # Check if all patches applied → switch to fully secure mode
    if all(p["applied"] for p in _PATCH_REGISTRY.values()):
        _current_mode = "secure"
        logger.info("All patches applied — switching to fully secure mode.")

    logger.info("Patch applied: %s (%s)", patch_name, patch["vulnerability_type"])
    return {
        "success": True,
        "message": f"Patch '{patch_name}' applied successfully.",
        "patch": patch,
        "global_mode": _current_mode,
    }


def revert_patch(patch_name: str) -> Dict:
    """
    Revert a previously applied patch (for testing purposes).
    """
    global _current_mode

    if patch_name not in _PATCH_REGISTRY:
        return {"success": False, "message": f"Unknown patch: '{patch_name}'"}

    patch = _PATCH_REGISTRY[patch_name]
    patch["applied"] = False
    patch["applied_at"] = None
    _current_mode = "vulnerable"

    logger.info("Patch reverted: %s", patch_name)
    return {"success": True, "message": f"Patch '{patch_name}' reverted.", "patch": patch}


def list_patches() -> List[Dict]:
    """
    Returns a list of all available patches with their current status.
    """
    return [
        {
            "id": key,
            **{k: v for k, v in patch.items()},
        }
        for key, patch in _PATCH_REGISTRY.items()
    ]


def get_patch(patch_name: str) -> Optional[Dict]:
    """
    Returns a single patch descriptor or None if not found.
    """
    if patch_name not in _PATCH_REGISTRY:
        return None
    return {"id": patch_name, **_PATCH_REGISTRY[patch_name]}


def patch_is_applied(patch_name: str) -> bool:
    """
    Returns True if the given patch is currently applied.
    """
    patch = _PATCH_REGISTRY.get(patch_name)
    return patch["applied"] if patch else False
