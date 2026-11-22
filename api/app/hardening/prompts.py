"""
H-VISION Adversarial Hardening — LLM Prompts
Structured prompts for Groq LLM to generate initial WAF rules
and iteratively generalize rules when bypassed.
"""

INITIAL_RULE_PROMPT = """You are @Responder, an elite WAF (Web Application Firewall) engineer.
A critical vulnerability attack was detected on the target application:
- Attack Type: {attack_type}
- Target Endpoint: {endpoint}
- Trigger Payload: {payload}

Task:
Generate a precise, battle-tested Python regular expression (regex) to block this attack and its immediate variations.

Rules for your regex:
1. It MUST block the trigger payload.
2. It MUST be written in standard Python `re` syntax.
3. It must use case-insensitive matching `(?i)`.
4. It MUST NOT block standard English words (e.g., words like 'select an option', names like \"O'Brien\").
5. Return ONLY a single line of regex without quotes or explanations.

Example regex output:
(?i)(\\b(union\\s+all\\s+select|select\\s+.*\\s+from|drop\\s+table)\\b|'\\s*or\\s+['\"\\d]+=['\"\\d]+)
"""

IMPROVE_RULE_PROMPT = """You are @Responder, improving a WAF rule that failed adversarial mutation testing.

Current WAF Regex:
`{current_rule}`

Problem:
The Red Team mutation engine generated adversarial variants, and {bypass_count} variants successfully BYPASSED your rule.
Here are representative samples of the bypassed attacks:
{bypassed_samples}

False Positive Check Requirement:
Your improved regex MUST NOT block benign traffic such as:
- Names with apostrophes: O'Brien, D'Angelo
- Everyday sentences: "select an option", "labor union", "drop off badge"
- Standard HTML: <b>Hello</b>, <span class="badge">

Task:
Generalize and strengthen your regex to block these bypassed patterns while maintaining a 0% false-positive rate.
Return ONLY the updated Python regex pattern on a single line. Do not include markdown blocks, descriptions, or quotes.
"""
