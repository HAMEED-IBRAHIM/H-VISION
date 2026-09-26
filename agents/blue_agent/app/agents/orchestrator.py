import logging
from typing import Dict, Any

from app.agents.triage import TriageAgent
from app.agents.hunter import ThreatHunterAgent
from app.agents.responder import ResponderAgent
from app.agents.communicator import CommunicatorAgent

logger = logging.getLogger(__name__)

class SOCOrchestrator:
    """
    The central intelligence hub that orchestrates the workflow between 
    the specialized autonomous SOC agents.
    """
    def __init__(self):
        self.triage_agent = TriageAgent()
        self.hunter_agent = ThreatHunterAgent()
        self.responder_agent = ResponderAgent()
        self.communicator_agent = CommunicatorAgent()

    def process_alert(self, raw_alert: Dict[str, Any]) -> Dict[str, Any]:
        logger.info(f"=== [SOCOrchestrator] Initiating Multi-Agent Workflow for Alert {raw_alert.get('id')} ===")
        
        # 1. Triage
        triaged_alert = self.triage_agent.process(raw_alert)
        
        if triaged_alert.get("action") == "ignore":
            logger.info("=== [SOCOrchestrator] Workflow terminated at Triage (Duplicate/Ignore). ===")
            return triaged_alert
            
        if triaged_alert.get("priority") != "High":
            logger.info("=== [SOCOrchestrator] Workflow terminated at Triage (Low Priority). Logged. ===")
            # The communicator could still log it here, but we'll skip deep analysis
            return self.communicator_agent.report(triaged_alert)

        # 2. Deep Investigation
        investigated_alert = self.hunter_agent.analyze(triaged_alert)
        
        # 3. Remediation Strategy (WAF + Patches)
        remediated_alert = self.responder_agent.remediate(investigated_alert)
        
        # 4. Final Reporting
        final_alert = self.communicator_agent.report(remediated_alert)
        
        logger.info("=== [SOCOrchestrator] Multi-Agent Workflow Completed Successfully. ===")
        return final_alert
