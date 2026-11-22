"""
H-VISION Adversarial Hardening — Mutation Engine
Generates 30 to 100 deterministic and LLM-assisted payload variants
to probe and stress-test candidate WAF rules.
"""

import urllib.parse
import random
import re
from typing import List, Set
from groq import Groq
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Unicode full-width and obfuscated character maps
UNICODE_MAP = {
    "'": "\uff07",
    '"': "\uff02",
    "/": "\uff0f",
    "<": "\uff1c",
    ">": "\uff1e",
    "=": "\uff1d",
    " ": "\u3000",
}

def mutate_case(payload: str) -> str:
    """Randomize upper and lower case letters."""
    return "".join(c.upper() if random.random() > 0.5 else c.lower() for c in payload)

def mutate_sql_inline_comments(payload: str) -> List[str]:
    """Replace spaces with SQL inline comment variations."""
    variants = []
    variants.append(payload.replace(" ", "/**/"))
    variants.append(payload.replace(" ", "/*x*/"))
    variants.append(payload.replace(" ", "/*!50000*/"))
    variants.append(payload.replace(" ", "/*!32302*/"))
    variants.append(re.sub(r"\s+", "/**/", payload))
    return variants

def mutate_whitespace(payload: str) -> List[str]:
    """Use alternative whitespace characters (tabs, newlines, formfeeds)."""
    return [
        payload.replace(" ", "\t"),
        payload.replace(" ", "\n"),
        payload.replace(" ", "\r\n"),
        payload.replace(" ", "\x0b"), # vertical tab
        payload.replace(" ", "\x0c"), # formfeed
        payload.replace(" ", "%09"),
        payload.replace(" ", "%0a"),
        payload.replace(" ", "%0d"),
    ]

def mutate_url_encoding(payload: str) -> List[str]:
    """Standard, double, and mixed URL encoding."""
    single_enc = urllib.parse.quote(payload)
    double_enc = urllib.parse.quote(single_enc)
    
    # Partial encoding (encode only quotes and spaces)
    partial_enc = payload.replace("'", "%27").replace(" ", "%20").replace('"', "%22")
    
    return [single_enc, double_enc, partial_enc]

def mutate_unicode(payload: str) -> str:
    """Substitute ASCII attack characters with Unicode homoglyphs."""
    out = payload
    for k, v in UNICODE_MAP.items():
        out = out.replace(k, v)
    return out

def mutate_sql_concatenation(payload: str) -> List[str]:
    """Split keywords using SQL string concatenation or nested functions."""
    variants = []
    if "select" in payload.lower():
        variants.append(re.sub(r"(?i)select", "CONCAT('s','elect')", payload))
        variants.append(re.sub(r"(?i)select", "CHAR(115,101,108,101,99,116)", payload))
    if "union" in payload.lower():
        variants.append(re.sub(r"(?i)union", "UN/**/ION", payload))
        variants.append(re.sub(r"(?i)union", "u%6eion", payload))
    return variants

def mutate_xss_obfuscation(payload: str) -> List[str]:
    """Obfuscate script tags, event handlers, and javascript pseudo-protocol."""
    variants = []
    if "<script>" in payload.lower():
        variants.append(payload.replace("<script>", "<script/x>"))
        variants.append(payload.replace("<script>", "<SCRIPT SRC=data:text/javascript;base64,YWxlcnQoMSk+"))
        variants.append(payload.replace("<script>", "<svg/onload="))
    if "alert" in payload.lower():
        variants.append(payload.replace("alert(1)", "top['al'+'ert'](1)"))
        variants.append(payload.replace("alert(1)", "confirm(1)"))
        variants.append(payload.replace("alert(1)", "prompt(1)"))
        variants.append(payload.replace("alert(1)", "eval(atob('YWxlcnQoMSk='))"))
    return variants

def generate_deterministic_variants(seed_payload: str, max_count: int = 70) -> Set[str]:
    """Generate 40-70 deterministic variants of an attack payload."""
    results: Set[str] = {seed_payload}

    # 1. URL encodings
    for var in mutate_url_encoding(seed_payload):
        results.add(var)

    # 2. Case mutations
    for _ in range(5):
        results.add(mutate_case(seed_payload))

    # 3. Inline comments
    for var in mutate_sql_inline_comments(seed_payload):
        results.add(var)
        results.add(mutate_case(var))

    # 4. Whitespaces
    for var in mutate_whitespace(seed_payload):
        results.add(var)

    # 5. Unicode
    results.add(mutate_unicode(seed_payload))

    # 6. SQL Concatenations
    for var in mutate_sql_concatenation(seed_payload):
        results.add(var)

    # 7. XSS obfuscations
    for var in mutate_xss_obfuscation(seed_payload):
        results.add(var)

    # 8. Null-byte injections
    results.add(seed_payload + "%00")
    results.add(seed_payload + "\x00")

    # Trim to max_count
    return set(list(results)[:max_count])

async def generate_llm_variants(seed_payload: str, attack_type: str, count: int = 10) -> List[str]:
    """Query Groq LLM for creative, novel obfuscation variants."""
    if not settings.GROQ_API_KEY:
        return []

    prompt = f"""You are a specialized red-team payload mutation engine testing WAF resilience.
Original {attack_type} payload: `{seed_payload}`

Generate exactly {count} distinct, highly creative bypass mutations for this payload.
Techniques to use:
- Obfuscated function calls
- Alternative SQL dialect syntax or JavaScript event handlers
- Nested quotes or hexadecimal representations
- Chunked or broken token representations

Respond with ONLY the raw payloads, one per line. Do not include numbering, explanations, or markdown fences.
"""
    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
        resp = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=600,
        )
        raw_text = resp.choices[0].message.content or ""
        lines = [line.strip() for line in raw_text.splitlines() if line.strip() and not line.startswith("```")]
        return lines[:count]
    except Exception as e:
        logger.warning(f"LLM mutation generation failed: {e}")
        return []

async def generate_all_variants(seed_payload: str, attack_type: str = "sql_injection", target_count: int = 60) -> List[str]:
    """Combines deterministic mutations and LLM mutations to produce 30-100 variants."""
    deterministic = generate_deterministic_variants(seed_payload, max_count=target_count - 10)
    llm_variants = await generate_llm_variants(seed_payload, attack_type, count=10)
    
    combined = set(deterministic).union(set(llm_variants))
    # Guarantee seed payload is included
    combined.add(seed_payload)
    return list(combined)
