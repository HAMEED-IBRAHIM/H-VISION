import logging
from typing import Dict, Any, List
import hashlib
import json

logger = logging.getLogger(__name__)

class WAFRule:
    def __init__(self, rule_id: str, action: str, conditions: List[Dict[str, str]], explanation: str):
        self.rule_id = rule_id
        self.action = action  # e.g., "BLOCK", "RATE_LIMIT"
        self.conditions = conditions
        self.explanation = explanation
        
    def to_dict(self) -> Dict[str, Any]:
        return {
            "rule_id": self.rule_id,
            "action": self.action,
            "conditions": self.conditions,
            "explanation": self.explanation
        }

class WAFGenerator:
    """
    Blue Team Engine for dynamically generating Web Application Firewall (WAF) 
    blocking rules based on analyzed incident data. This provides the 'massive protection'
    layer by blocking threats before they hit the application logic.
    """
    
    @staticmethod
    def _generate_rule_id(incident_id: str, pattern: str) -> str:
        raw = f"{incident_id}-{pattern}"
        return f"WAF-AUTO-{hashlib.md5(raw.encode()).hexdigest()[:8].upper()}"

    @staticmethod
    def generate_protection_rules(incident: Dict[str, Any], detections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Analyzes the incident and associated detections to generate targeted WAF blocking rules.
        """
        rules = []
        logger.info(f"Studying incident {incident.get('id')} to generate WAF protections...")
        
        # Extract common attacker patterns from the incident data
        suspicious_ips = set()
        suspicious_paths = set()
        attack_signatures = set()
        
        for detection in detections:
            # In a real scenario, these would be extracted from the raw captured request
            # tied to the detection.
            if detection.get("source_ip"):
                suspicious_ips.add(detection.get("source_ip"))
            
            matched_patterns = detection.get("matched_patterns", [])
            for pattern_location in matched_patterns:
                if pattern_location == "path":
                     # We need the actual path from the request, simplified here
                     suspicious_paths.add("/vulnerable_endpoint")
                     
            evidence = detection.get("evidence", "")
            if "pattern matched near:" in evidence:
                # Extract the signature that triggered the detection
                attack_signatures.add(evidence.split("pattern matched near:")[-1].strip().strip("'\"[]"))
                
        # 1. IP Blocking Rule (Immediate Remediation)
        if suspicious_ips:
            for ip in suspicious_ips:
                if ip and ip != "unknown":
                    rule = WAFRule(
                        rule_id=WAFGenerator._generate_rule_id(incident.get('id', ''), ip),
                        action="BLOCK",
                        conditions=[{"field": "source_ip", "operator": "equals", "value": ip}],
                        explanation=f"Automatically blocking malicious IP address {ip} associated with incident {incident.get('category')}."
                    )
                    rules.append(rule.to_dict())

        # 2. Signature Blocking Rule (Deeper Protection against the specific payload)
        if attack_signatures:
             for sig in attack_signatures:
                 if sig:
                     rule = WAFRule(
                        rule_id=WAFGenerator._generate_rule_id(incident.get('id', ''), sig),
                        action="BLOCK",
                        conditions=[{"field": "request_body", "operator": "contains", "value": sig}],
                        explanation=f"Blocking requests containing the malicious payload signature: {sig}"
                     )
                     rules.append(rule.to_dict())
                     
        # 3. Rate Limiting on Targeted Paths
        if suspicious_paths:
             for path in suspicious_paths:
                 rule = WAFRule(
                    rule_id=WAFGenerator._generate_rule_id(incident.get('id', ''), f"ratelimit-{path}"),
                    action="RATE_LIMIT",
                    conditions=[{"field": "request_path", "operator": "starts_with", "value": path}],
                    explanation=f"Applying strict rate limiting to heavily targeted path {path} to mitigate automated probing."
                 )
                 rules.append(rule.to_dict())
                 
        logger.info(f"Generated {len(rules)} WAF protection rules for incident {incident.get('id')}.")
        return rules
