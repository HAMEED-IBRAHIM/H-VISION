import logging
from typing import Dict, Any, List
from app.waf_generator import WAFGenerator
from app.patch_generator import PatchGenerator

logger = logging.getLogger(__name__)

class ResponderAgent:
    """
    The Defender. Generates multi-layered remediation strategies (WAF + Patch).
    """
    def __init__(self):
        pass

    def remediate(self, investigated_alert: Dict[str, Any]) -> Dict[str, Any]:
        logger.info(f"[ResponderAgent] Designing remediation for alert {investigated_alert.get('id')}")
        
        # 1. Generate WAF Rules (Immediate Protection)
        # We simulate the detections list for the WAF generator
        simulated_detections = [{"source_ip": "192.168.1.100", "matched_patterns": ["path"], "evidence": "SQL syntax error"}]
        waf_rules = WAFGenerator.generate_protection_rules(investigated_alert, simulated_detections)
        
        # 2. Generate Code Patch (Permanent Protection)
        # In a real scenario, the target file and original content would be pulled from a repository/DB
        target_file = "src/api/users.py"
        original_content = "def get_user(name):\n    query = f\"SELECT id, name, secret FROM users WHERE name = '{name}'\"\n    cursor.execute(query)\n    return cursor.fetchone()"
        
        patch_proposal = PatchGenerator.generate(
            vulnerability_type=investigated_alert.get("category", "sql_injection"),
            target_file=target_file,
            original_content=original_content
        )
        
        investigated_alert["remediation"] = {
            "waf_rules": waf_rules,
            "patch": {
                "type": patch_proposal.patch_type,
                "file": patch_proposal.target_file,
                "diff": patch_proposal.unified_diff
            }
        }
        
        logger.info(f"[ResponderAgent] Remediation strategy generated with {len(waf_rules)} WAF rules and 1 patch proposal.")
        return investigated_alert
