import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class TriageAgent:
    """
    The Gatekeeper. Ingests raw alerts, deduplicates them, and determines base severity.
    """
    def __init__(self):
        self.seen_signatures = set()

    def process(self, raw_alert: Dict[str, Any]) -> Dict[str, Any]:
        logger.info(f"[TriageAgent] Processing new alert: {raw_alert.get('id', 'unknown')}")
        
        # 1. Deduplication based on signature/pattern
        signature = raw_alert.get("signature")
        if signature and signature in self.seen_signatures:
            logger.info(f"[TriageAgent] Alert {raw_alert.get('id')} is a duplicate. Dropping priority.")
            raw_alert["priority"] = "Low"
            raw_alert["triaged"] = True
            raw_alert["action"] = "ignore"
            return raw_alert

        if signature:
            self.seen_signatures.add(signature)

        # 2. Priority Assignment
        severity = raw_alert.get("severity", "medium").lower()
        if severity == "critical" or severity == "high":
            raw_alert["priority"] = "High"
            raw_alert["action"] = "investigate"
        else:
            raw_alert["priority"] = "Medium"
            raw_alert["action"] = "log"

        raw_alert["triaged"] = True
        logger.info(f"[TriageAgent] Alert triaged with priority: {raw_alert['priority']} -> Action: {raw_alert['action']}")
        return raw_alert
