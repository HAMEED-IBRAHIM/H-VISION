"""
JANUS-Sentinel Detection Engine
================================
Hybrid detection combining deterministic rules, pattern matching, 
anomaly scoring, and risk scoring formula.

Risk Score Formula:
  score = (severity_weight * confidence * rule_match_bonus * frequency_multiplier)
  
  Where:
    severity_weight: critical=1.0, high=0.8, medium=0.5, low=0.2
    confidence: 0.0-1.0 from pattern match
    rule_match_bonus: 1 + (0.1 * additional_matching_rules)
    frequency_multiplier: 1.0 + (request_count_last_minute / 10)
    
  Final: clamped to [0.0, 10.0]
"""
from __future__ import annotations

import re
import hashlib
import json
from dataclasses import dataclass, field
from typing import Any
import logging

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Detection Rule Definitions
# ---------------------------------------------------------------------------

@dataclass
class DetectionRule:
    rule_id: str
    name: str
    description: str
    pattern: str
    detection_type: str
    severity: str          # critical | high | medium | low
    severity_weight: float
    targets: list[str]     # query_params | body | path | headers


DETECTION_RULES: list[DetectionRule] = [
    # SQL Injection
    DetectionRule(
        rule_id="SQL-001",
        name="SQL OR Injection",
        description="Detects classic SQL OR bypass pattern",
        pattern=r"(?i)('|\%27)\s*(or|OR)\s*('|\%27|\d)",
        detection_type="sql_injection",
        severity="high",
        severity_weight=0.8,
        targets=["query_params", "body", "path"],
    ),
    DetectionRule(
        rule_id="SQL-002",
        name="SQL Comment Injection",
        description="Detects SQL comment-based injection (-- or #)",
        pattern=r"(?i)(--|#|\/\*|\*\/)\s*$",
        detection_type="sql_injection",
        severity="high",
        severity_weight=0.8,
        targets=["query_params", "body"],
    ),
    DetectionRule(
        rule_id="SQL-003",
        name="SQL UNION Attack",
        description="Detects UNION SELECT injection",
        pattern=r"(?i)\bUNION\b.{0,30}\bSELECT\b",
        detection_type="sql_injection",
        severity="critical",
        severity_weight=1.0,
        targets=["query_params", "body"],
    ),
    DetectionRule(
        rule_id="SQL-004",
        name="SQL ORDER BY Injection",
        description="Detects ORDER BY injection for column enumeration",
        pattern=r"(?i)\bORDER\s+BY\s+\d+",
        detection_type="sql_injection",
        severity="medium",
        severity_weight=0.5,
        targets=["query_params", "body"],
    ),
    # XSS
    DetectionRule(
        rule_id="XSS-001",
        name="Script Tag XSS",
        description="Detects <script> tag injection",
        pattern=r"(?i)<script[\s>]",
        detection_type="xss",
        severity="high",
        severity_weight=0.8,
        targets=["query_params", "body"],
    ),
    DetectionRule(
        rule_id="XSS-002",
        name="Event Handler XSS",
        description="Detects on* event handler injection",
        pattern=r"(?i)\bon(load|click|error|mouseover|focus|blur)\s*=",
        detection_type="xss",
        severity="high",
        severity_weight=0.8,
        targets=["query_params", "body"],
    ),
    DetectionRule(
        rule_id="XSS-003",
        name="JavaScript URI XSS",
        description="Detects javascript: URI scheme",
        pattern=r"(?i)javascript\s*:",
        detection_type="xss",
        severity="high",
        severity_weight=0.8,
        targets=["query_params", "body"],
    ),
    DetectionRule(
        rule_id="XSS-004",
        name="SVG XSS Vector",
        description="Detects SVG-based XSS",
        pattern=r"(?i)<svg[\s>].*on\w+\s*=",
        detection_type="xss",
        severity="high",
        severity_weight=0.8,
        targets=["query_params", "body"],
    ),
    # Path Traversal
    DetectionRule(
        rule_id="PATH-001",
        name="Directory Traversal",
        description="Detects ../ path traversal sequences",
        pattern=r"(\.\./|\.\.\\|%2e%2e%2f|%2e%2e/|\.\.%2f)",
        detection_type="path_traversal",
        severity="high",
        severity_weight=0.8,
        targets=["path", "query_params"],
    ),
    # Auth Probing
    DetectionRule(
        rule_id="AUTH-001",
        name="Admin Path Probe",
        description="Detects probing of admin endpoints without credentials",
        pattern=r"(?i)^/(admin|management|config|setup|install|phpMyAdmin)",
        detection_type="auth_probing",
        severity="medium",
        severity_weight=0.5,
        targets=["path"],
    ),
    DetectionRule(
        rule_id="AUTH-002",
        name="SQL in Auth Fields",
        description="Detects SQL injection in username/password fields",
        pattern=r"(?i)(username|password|user|pass|login)\s*=.*('|--|\bOR\b)",
        detection_type="auth_probing",
        severity="critical",
        severity_weight=1.0,
        targets=["body", "query_params"],
    ),
    # Suspicious Parameters
    DetectionRule(
        rule_id="PARAM-001",
        name="Null Byte Injection",
        description="Detects null byte injection attempts",
        pattern=r"%00|\\x00|\\0",
        detection_type="parameter_anomaly",
        severity="medium",
        severity_weight=0.5,
        targets=["query_params", "body", "path"],
    ),
    DetectionRule(
        rule_id="PARAM-002",
        name="CRLF Injection",
        description="Detects carriage return line feed injection",
        pattern=r"%0[aAdD]|\\r|\\n",
        detection_type="parameter_anomaly",
        severity="medium",
        severity_weight=0.5,
        targets=["query_params", "body"],
    ),
    # Cyber Deception (Honey Tokens)
    DetectionRule(
        rule_id="HONEY-001",
        name="Honey Token Triggered",
        description="Detects access to fake, deceptive endpoints indicating malicious scanning",
        pattern=r"(?i)^/(admin_backup\.zip|\.aws/credentials)",
        detection_type="cyber_deception",
        severity="critical",
        severity_weight=1.0,
        targets=["path"],
    ),
]

RULE_MAP: dict[str, DetectionRule] = {r.rule_id: r for r in DETECTION_RULES}
BLOCKED_HEALTH_PATHS = {"/health", "/healthz", "/ping", "/ready", "/live"}


# ---------------------------------------------------------------------------
# Detection Result
# ---------------------------------------------------------------------------

@dataclass
class DetectionResult:
    rule_id: str
    rule_name: str
    detection_type: str
    severity: str
    confidence: float
    evidence: str
    matched_patterns: list[str]
    anomaly_score: float
    risk_score: float


# ---------------------------------------------------------------------------
# Detection Engine
# ---------------------------------------------------------------------------

class DetectionEngine:
    """
    Hybrid security detection engine combining deterministic rule-based
    pattern matching with anomaly scoring.
    """

    def __init__(self) -> None:
        self._compiled_rules: dict[str, re.Pattern[str]] = {
            rule.rule_id: re.compile(rule.pattern)
            for rule in DETECTION_RULES
        }
        # Simple in-memory frequency tracker (IP -> request timestamps)
        self._request_frequency: dict[str, list[float]] = {}

    def _extract_target_text(
        self,
        request: dict[str, Any],
        targets: list[str],
    ) -> list[tuple[str, str]]:
        """Extract (location, text) pairs for the given target fields."""
        result: list[tuple[str, str]] = []

        if "path" in targets:
            path = request.get("request_path", "")
            if path:
                result.append(("path", path))

        if "query_params" in targets:
            qp = request.get("query_parameters")
            if isinstance(qp, dict):
                for key, val in qp.items():
                    result.append(("query_params", f"{key}={val}"))
            elif isinstance(qp, str) and qp:
                result.append(("query_params", qp))

        if "body" in targets:
            body = request.get("sanitized_body")
            if body:
                result.append(("body", str(body)))

        if "headers" in targets:
            headers = request.get("sanitized_headers")
            if isinstance(headers, dict):
                for key, val in headers.items():
                    # Never inspect authorization values; already masked
                    if key.lower() not in ("authorization", "cookie", "x-api-key"):
                        result.append(("headers", f"{key}: {val}"))

        return result

    def _calculate_risk_score(
        self,
        severity_weight: float,
        confidence: float,
        additional_rules: int,
        request_frequency: float,
    ) -> float:
        """
        Risk Score = severity_weight * confidence * rule_match_bonus * frequency_multiplier

        Clamped to [0.0, 10.0].
        """
        rule_match_bonus = 1.0 + (0.1 * additional_rules)
        frequency_multiplier = 1.0 + min(request_frequency / 10.0, 2.0)
        score = severity_weight * 10 * confidence * rule_match_bonus * frequency_multiplier
        return min(round(score, 2), 10.0)

    def _track_frequency(self, source_ip: str) -> float:
        """Returns requests-per-minute from this IP over the last 60 seconds."""
        import time
        now = time.time()
        window = 60.0
        history = self._request_frequency.get(source_ip, [])
        # Keep only events within window
        history = [t for t in history if now - t < window]
        history.append(now)
        self._request_frequency[source_ip] = history
        return len(history)

    def run_detection(self, request: dict[str, Any]) -> list[DetectionResult]:
        """
        Run all detection rules against a captured request.
        
        Returns a list of DetectionResult objects for every matched rule.
        """
        path = request.get("request_path", "")

        # Skip health check noise
        if path in BLOCKED_HEALTH_PATHS:
            return []

        source_ip = request.get("source_ip", "unknown")
        request_frequency = self._track_frequency(source_ip)

        findings: list[DetectionResult] = []

        for rule in DETECTION_RULES:
            compiled = self._compiled_rules[rule.rule_id]
            target_texts = self._extract_target_text(request, rule.targets)

            matched_in: list[str] = []
            evidence_parts: list[str] = []

            for location, text in target_texts:
                match = compiled.search(text)
                if match:
                    matched_in.append(location)
                    # Truncate evidence for safety – never store raw user input fully
                    snippet = text[max(0, match.start() - 10) : match.end() + 10]
                    evidence_parts.append(
                        f"[{location}] pattern matched near: {repr(snippet[:120])}"
                    )

            if matched_in:
                confidence = min(0.9, 0.6 + (0.1 * len(matched_in)))
                anomaly_score = confidence * rule.severity_weight
                risk_score = self._calculate_risk_score(
                    severity_weight=rule.severity_weight,
                    confidence=confidence,
                    additional_rules=len(findings),
                    request_frequency=request_frequency,
                )
                findings.append(
                    DetectionResult(
                        rule_id=rule.rule_id,
                        rule_name=rule.name,
                        detection_type=rule.detection_type,
                        severity=rule.severity,
                        confidence=round(confidence, 3),
                        evidence="; ".join(evidence_parts),
                        matched_patterns=matched_in,
                        anomaly_score=round(anomaly_score, 3),
                        risk_score=risk_score,
                    )
                )

        return findings


# Singleton instance
detection_engine = DetectionEngine()
