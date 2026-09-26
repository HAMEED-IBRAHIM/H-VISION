import re
from typing import List, Dict

# Global in-memory storage for WAF rules
# Example: [{"id": "rule_1", "pattern": "UNION SELECT", "description": "Block SQLi"}]
active_rules: List[Dict[str, str]] = []

def add_rule(rule_id: str, pattern: str, description: str):
    # Avoid duplicates
    for r in active_rules:
        if r["pattern"] == pattern:
            return
    active_rules.append({"id": rule_id, "pattern": pattern, "description": description})

def remove_rule(rule_id: str):
    global active_rules
    active_rules = [r for r in active_rules if r["id"] != rule_id]

def clear_rules():
    global active_rules
    active_rules = []

def check_request(path: str, query_params: str, body: str) -> bool:
    """Returns True if the request is BLOCKED by a WAF rule."""
    payload = f"{path} {query_params} {body}".lower()
    
    for rule in active_rules:
        try:
            # Case insensitive regex match
            if re.search(rule["pattern"].lower(), payload):
                return True
        except Exception:
            # Fallback to string match if regex fails
            if rule["pattern"].lower() in payload:
                return True
    return False
