"""
H-VISION Adversarial Hardening — Rule Evaluator
Tests a candidate regex pattern against:
1. Attack variants (counts bypasses)
2. Benign corpus (checks false positives)
"""

import re
from typing import List, Dict, Any, Tuple
from app.hardening.benign_corpus import get_benign_corpus

def test_pattern(pattern: str, test_str: str) -> bool:
    """Returns True if the pattern matches (blocks) the test string."""
    try:
        # If pattern doesn't specify (?i), compile case-insensitively
        compiled = re.compile(pattern, re.IGNORECASE)
        return bool(compiled.search(test_str))
    except re.error:
        # Fallback to substring matching if regex is invalid
        clean_pat = pattern.replace("(?i)", "").strip()
        return clean_pat.lower() in test_str.lower()

def evaluate_waf_rule(pattern: str, attack_variants: List[str]) -> Dict[str, Any]:
    """
    Evaluates a candidate WAF rule against attacks and benign traffic.
    Returns bypass count, bypass rate, false positive count, and samples.
    """
    bypassed_attacks: List[str] = []
    blocked_attacks: List[str] = []

    # 1. Test against attack variants
    for variant in attack_variants:
        if test_pattern(pattern, variant):
            blocked_attacks.append(variant)
        else:
            bypassed_attacks.append(variant)

    total_attacks = len(attack_variants)
    bypass_count = len(bypassed_attacks)
    bypass_rate = round((bypass_count / total_attacks) * 100, 2) if total_attacks > 0 else 0.0

    # 2. Test against benign corpus (False-Positive Gate)
    benign_samples = get_benign_corpus()
    false_positives: List[str] = []
    for benign in benign_samples:
        if test_pattern(pattern, benign):
            false_positives.append(benign)

    total_benign = len(benign_samples)
    fp_count = len(false_positives)
    fp_rate = round((fp_count / total_benign) * 100, 2) if total_benign > 0 else 0.0

    return {
        "pattern": pattern,
        "total_attacks": total_attacks,
        "blocked_count": len(blocked_attacks),
        "bypass_count": bypass_count,
        "bypass_rate": bypass_rate,
        "bypassed_samples": bypassed_attacks[:8],
        "total_benign": total_benign,
        "fp_count": fp_count,
        "fp_rate": fp_rate,
        "fp_samples": false_positives[:5],
        "passed_fp_gate": fp_count == 0,
    }
