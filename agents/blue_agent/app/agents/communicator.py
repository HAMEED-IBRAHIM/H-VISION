import logging
import json
from typing import Dict, Any

logger = logging.getLogger(__name__)

class CommunicatorAgent:
    """
    The Reporter. Translates complex technical actions into executive summaries
    and handles final output to the API or logs.
    """
    def __init__(self):
        pass

    def report(self, final_alert: Dict[str, Any]) -> Dict[str, Any]:
        logger.info(f"[CommunicatorAgent] Generating final incident report for alert {final_alert.get('id')}")
        
        investigation = final_alert.get("investigation", {})
        remediation = final_alert.get("remediation", {})
        
        summary = (
            f"**H-vision Automated Incident Report**\n"
            f"Alert ID: {final_alert.get('id')}\n"
            f"Priority: {final_alert.get('priority')}\n"
            f"MITRE Technique: {investigation.get('mitre_technique')}\n"
            f"Root Cause: {investigation.get('root_cause')}\n\n"
            f"**Actions Taken:**\n"
            f"- Generated {len(remediation.get('waf_rules', []))} WAF Rules.\n"
            f"- Generated Patch for {remediation.get('patch', {}).get('file', 'N/A')}.\n\n"
            f"**AI Analysis Notes:**\n{investigation.get('analysis_notes', 'N/A')}"
        )
        
        final_alert["executive_summary"] = summary
        logger.info(f"[CommunicatorAgent] Report generated successfully:\n{summary}")
        
        # In a real system, this is where it would push to the API
        return final_alert
