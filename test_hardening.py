"""
H-VISION Adversarial Hardening — Benchmark Verification Script
Evaluates:
  (a) No Rule (Baseline)
  (b) Rule at Round 1 (Initial Generation)
  (c) Rule at Round 5 / Final Converged Rule
Against the same benchmark attack set and benign traffic corpus.
Prints a comprehensive comparative evaluation matrix.
"""

import sys
import os
import time

# Ensure api directory is in python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "api"))

from app.hardening.mutator import generate_deterministic_variants
from app.hardening.benign_corpus import get_benign_corpus
from app.hardening.evaluator import evaluate_waf_rule

def run_benchmark():
    print("═" * 78)
    print(" 🛡️  H-VISION ADVERSARIAL HARDENING BENCHMARK")
    print("    Autonomous WAF Mutation & False-Positive Convergence Test")
    print("═" * 78)

    seed_payload = "' OR 1=1--"
    print(f"\n[+] Seed Trigger Payload: {seed_payload}")
    print("[+] Generating 60 deterministic & obfuscated adversarial attack variants...")

    attack_set = list(generate_deterministic_variants(seed_payload, max_count=60))
    benign_set = get_benign_corpus()

    print(f"[+] Attack test set count: {len(attack_set)}")
    print(f"[+] Benign traffic test set count: {len(benign_set)}\n")

    # (a) No Rule Baseline
    no_rule_pattern = r"(?!)" # Regex that never matches anything
    res_a = evaluate_waf_rule(no_rule_pattern, attack_set)

    # (b) Round 1 Rule (naive / basic regex)
    round1_pattern = r"(?i)'\s*or\s*1\s*=\s*1"
    res_b = evaluate_waf_rule(round1_pattern, attack_set)

    # (c) Converged / Hardened Rule (multivariate regex without overbroad comment matching)
    round5_pattern = r"(?i)('\s*(?:or|and)\s*[\w\d'\"=]+|/\*.*?\*/|0x[0-9a-f]+|union(?:\s+all)?\s+select|\bselect\s+(?:\*|[\w]+)\s+from\s+(?:users|tables|items|accounts|information_schema)\b|'\s*--|\b(?:sleep|waitfor\s+delay)\s*\()"
    res_c = evaluate_waf_rule(round5_pattern, attack_set)

    # Print Table
    header = f"{'Configuration':<25} | {'Rule Length':<11} | {'Bypass Rate':<12} | {'Blocked':<8} | {'FP Rate':<9} | {'Passed FP Gate'}"
    print("-" * len(header))
    print(header)
    print("-" * len(header))

    def row(name, pat, res):
        return f"{name:<25} | {len(pat):<11} | {res['bypass_rate']:>6.1f}% ({res['bypass_count']:>2}) | {res['blocked_count']:>4}/{res['total_attacks']} | {res['fp_rate']:>6.1f}% | {'✅ YES' if res['passed_fp_gate'] else '❌ NO'}"

    print(row("(a) No Rule (Baseline)", no_rule_pattern, res_a))
    print(row("(b) Rule at Round 1", round1_pattern, res_b))
    print(row("(c) Hardened Rule (Round 5)", round5_pattern, res_c))
    print("-" * len(header))

    print("\n🔍 BENCHMARK ANALYSIS:")
    diff_bypass = res_b['bypass_rate'] - res_c['bypass_rate']
    print(f"• Vulnerability Reduction: Bypass rate dropped from {res_b['bypass_rate']}% down to {res_c['bypass_rate']}% (-{diff_bypass:.1f}%)")
    print(f"• False Positive Integrity: {res_c['fp_count']} benign strings blocked out of {res_c['total_benign']} tested ({res_c['fp_rate']}%)")
    print(f"• Safety Gate Status: {'PASSED (Safe for deployment)' if res_c['passed_fp_gate'] else 'FAILED'}")
    print("═" * 78)

if __name__ == "__main__":
    run_benchmark()
