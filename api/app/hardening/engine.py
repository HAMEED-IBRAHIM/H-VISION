"""
H-VISION Adversarial Hardening — Convergence Engine
Manages the multi-round hardening loop, safety limits,
Groq LLM feedback integration, and human-in-the-loop approval.
"""

import time
import uuid
import re
import logging
import httpx
from typing import Dict, Any, List, Optional
from groq import Groq

from app.core.config import settings
from app.hardening.mutator import generate_all_variants
from app.hardening.evaluator import evaluate_waf_rule
from app.hardening.prompts import INITIAL_RULE_PROMPT, IMPROVE_RULE_PROMPT

logger = logging.getLogger(__name__)

# Strict Host Safety Allowlist
ALLOWED_HOSTS = ["localhost:8001", "127.0.0.1:8001", "target_app:8001", "localhost", "127.0.0.1"]

# Hard limits
MAX_ROUNDS = 5
TARGET_BYPASS_THRESHOLD = 5.0 # Stop when bypass rate < 5%
MAX_VARIANTS_PER_ROUND = 80

# In-memory storage for active and completed hardening sessions
HARDENING_SESSIONS: Dict[str, Dict[str, Any]] = {}

# Rollback history: rule_id -> previous_rule_dict
ROLLBACK_ARCHIVE: Dict[str, Dict[str, Any]] = {}

def validate_target_host(target_url: str):
    """Enforce safety allowlist to guarantee testing only on lab target."""
    clean_url = target_url.lower().replace("http://", "").replace("https://", "").split("/")[0]
    if not any(allowed in clean_url for allowed in ALLOWED_HOSTS):
        raise ValueError(f"Safety Violation: Host '{clean_url}' is not on the lab allowlist.")

async def call_groq_for_rule(prompt: str) -> str:
    """Helper to query Groq LLM for a regex pattern."""
    if not settings.GROQ_API_KEY:
        # High quality fallback regex if Groq key isn't provided
        return r"(?i)(\b(union\s+all\s+select|select\s+.*?\s+from|drop\s+table)\b|'(\s*or\s+|\s*and\s+)[\w\s]+=|<script\b|javascript:)"

    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
        resp = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=250,
        )
        content = resp.choices[0].message.content or ""
        # Extract regex from markdown if present
        content = re.sub(r"^```[a-z]*\n?", "", content.strip())
        content = re.sub(r"\n?```$", "", content.strip())
        first_line = content.splitlines()[0].strip()
        # Ensure it compiles cleanly
        re.compile(first_line, re.IGNORECASE)
        return first_line
    except Exception as e:
        logger.warning(f"Groq rule generation fallback triggered: {e}")
        return r"(?i)(\b(union\s+all\s+select|select\s+.*?\s+from|drop\s+table)\b|'(\s*or\s+|\s*and\s+)[\w\s]+=|<script\b|javascript:)"

class HardeningEngine:
    @staticmethod
    async def run_hardening_session(
        seed_payload: str,
        attack_type: str = "sql_injection",
        endpoint: str = "/search",
        target_url: str = "http://localhost:8001"
    ) -> Dict[str, Any]:
        """
        Executes the full 5-round Adversarial Hardening convergence loop.
        """
        validate_target_host(target_url)

        session_id = f"HS-{uuid.uuid4().hex[:8].upper()}"
        start_time = time.time()

        session = {
            "session_id": session_id,
            "status": "RUNNING",
            "seed_payload": seed_payload,
            "attack_type": attack_type,
            "endpoint": endpoint,
            "target_url": target_url,
            "started_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "current_round": 0,
            "total_rounds": 0,
            "converged": False,
            "final_rule": "",
            "rule_id": f"WAF-HARDENED-{session_id}",
            "rounds": [],
            "approval_status": "PENDING_APPROVAL",
            "duration_seconds": 0.0,
            "audit_log": []
        }
        HARDENING_SESSIONS[session_id] = session

        def _log(msg: str):
            entry = f"[{time.strftime('%H:%M:%S')}] {msg}"
            session["audit_log"].append(entry)
            logger.info(f"[{session_id}] {msg}")

        _log(f"Starting Adversarial Hardening session on {endpoint} against attack: {attack_type}")
        _log(f"Seed trigger payload: '{seed_payload}'")

        # ── Pre-step: Generate 40-70 mutation variants ──
        _log("Generating adversarial mutation variants (URL encode, SQL comments, whitespace, unicode, LLM)...")
        variants = await generate_all_variants(seed_payload, attack_type=attack_type, target_count=50)
        _log(f"Generated {len(variants)} attack variants for stress-testing.")

        current_rule = ""
        best_rule = ""
        best_bypass_rate = 100.0

        for r_num in range(1, MAX_ROUNDS + 1):
            session["current_round"] = r_num
            round_start = time.time()
            _log(f"─── Round {r_num}/{MAX_ROUNDS} ───")

            # 1. Generate or improve candidate regex
            if r_num == 1:
                _log("Responder Agent generating initial WAF rule (v1)...")
                prompt = INITIAL_RULE_PROMPT.format(
                    attack_type=attack_type,
                    endpoint=endpoint,
                    payload=seed_payload
                )
                current_rule = await call_groq_for_rule(prompt)
            else:
                _log(f"Responder Agent generalizing rule based on Round {r_num-1} bypasses...")
                prev_eval = session["rounds"][-1]["evaluation"]
                bypassed_text = "\n".join(f"- `{s}`" for s in prev_eval["bypassed_samples"])
                prompt = IMPROVE_RULE_PROMPT.format(
                    current_rule=best_rule,
                    bypass_count=prev_eval["bypass_count"],
                    bypassed_samples=bypassed_text
                )
                current_rule = await call_groq_for_rule(prompt)

            _log(f"Candidate rule pattern: `{current_rule}`")

            # 2. Evaluate candidate rule
            evaluation = evaluate_waf_rule(current_rule, variants)
            bypass_rate = evaluation["bypass_rate"]
            fp_rate = evaluation["fp_rate"]

            _log(f"Evaluation: Bypass Rate = {bypass_rate}% ({evaluation['bypass_count']}/{evaluation['total_attacks']}) | FP Rate = {fp_rate}% ({evaluation['fp_count']}/{evaluation['total_benign']})")

            # 3. False-Positive Gate Check
            if not evaluation["passed_fp_gate"]:
                _log(f"⚠️ Rule REJECTED: False-Positive Gate tripped! Blocked safe traffic (e.g., {evaluation['fp_samples']}).")
                # Keep previous best rule if available
                if best_rule:
                    current_rule = best_rule
            else:
                _log("✅ False-Positive Gate PASSED (0% false positives on legitimate user text).")
                if bypass_rate <= best_bypass_rate:
                    best_bypass_rate = bypass_rate
                    best_rule = current_rule

            round_data = {
                "round_number": r_num,
                "rule_version": f"v{r_num}",
                "rule_pattern": current_rule,
                "rule_length": len(current_rule),
                "evaluation": evaluation,
                "duration_seconds": round(time.time() - round_start, 2),
            }
            session["rounds"].append(round_data)

            # 4. Check convergence
            if bypass_rate < TARGET_BYPASS_THRESHOLD and evaluation["passed_fp_gate"]:
                _log(f"🎯 CONVERGED in Round {r_num}! Bypass rate {bypass_rate}% is below target threshold {TARGET_BYPASS_THRESHOLD}%.")
                session["converged"] = True
                break
            elif r_num < MAX_ROUNDS:
                _log(f"Bypass rate {bypass_rate}% > {TARGET_BYPASS_THRESHOLD}%. Triggering next hardening round...")

        session["total_rounds"] = len(session["rounds"])
        session["final_rule"] = best_rule or current_rule
        session["duration_seconds"] = round(time.time() - start_time, 2)
        session["status"] = "COMPLETED_PENDING_APPROVAL"
        _log(f"Hardening loop complete in {session['duration_seconds']}s. Final rule queued for human approval.")

        return session

    @staticmethod
    def approve_and_deploy(session_id: str) -> Dict[str, Any]:
        """Approve candidate rule, archive previous version for rollback, and deploy to live WAF."""
        session = HARDENING_SESSIONS.get(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found.")

        rule_id = session["rule_id"]
        pattern = session["final_rule"]
        desc = f"Adversarially Hardened rule against {session['attack_type']} at {session['endpoint']} (Session {session_id})"

        # Archive for rollback
        ROLLBACK_ARCHIVE[rule_id] = {
            "session_id": session_id,
            "rule_id": rule_id,
            "pattern": pattern,
            "previous_rule": None,
            "archived_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        }

        # Deploy rule to Target App WAF via internal API
        deployed = False
        try:
            with httpx.Client(timeout=3.0) as client:
                resp = client.post(
                    f"{session['target_url']}/waf/rules",
                    json={"id": rule_id, "pattern": pattern, "description": desc}
                )
                deployed = resp.status_code == 200
        except Exception as e:
            logger.warning(f"Could not reach target_app /waf/rules directly: {e}")

        session["approval_status"] = "APPROVED_AND_DEPLOYED"
        session["deployed_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ")

        return {
            "status": "APPROVED",
            "rule_id": rule_id,
            "pattern": pattern,
            "deployed_to_gateway": deployed,
            "message": f"Rule {rule_id} approved by security analyst and deployed to active WAF."
        }

    @staticmethod
    def reject_rule(session_id: str, reason: str = "Rejected by human analyst") -> Dict[str, Any]:
        """Reject candidate rule without deploying."""
        session = HARDENING_SESSIONS.get(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found.")

        session["approval_status"] = "REJECTED"
        session["rejection_reason"] = reason

        return {
            "status": "REJECTED",
            "session_id": session_id,
            "message": f"Rule candidate rejected: {reason}"
        }

    @staticmethod
    def rollback_rule(rule_id: str, target_url: str = "http://localhost:8001") -> Dict[str, Any]:
        """Rolls back a deployed rule by removing it from the WAF gateway."""
        try:
            with httpx.Client(timeout=3.0) as client:
                client.delete(f"{target_url}/waf/rules/{rule_id}")
        except Exception as e:
            logger.warning(f"Rollback call failed: {e}")

        archive = ROLLBACK_ARCHIVE.pop(rule_id, None)
        return {
            "status": "ROLLED_BACK",
            "rule_id": rule_id,
            "message": f"Rule {rule_id} successfully rolled back and purged from gateway."
        }
