import time
import httpx
import logging
import asyncio
import os
import uuid

from app.agents.orchestrator import SOCOrchestrator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

API_URL = os.getenv("API_URL", "http://api:8000")
TOKEN = os.getenv("INTERNAL_SERVICE_TOKEN", "change-me")

class BlueAgent:
    def __init__(self):
        self.client = httpx.AsyncClient(headers={"Authorization": f"Bearer {TOKEN}"})
        self.is_running = False
        self.orchestrator = SOCOrchestrator()

    async def start(self):
        self.is_running = True
        logger.info("H-vision Multi-Agent Blue Team started.")
        
        import time
        alert_types = [
            {"category": "sql_injection",   "severity": "critical", "signature": "UNION SELECT user, password"},
            {"category": "xss",             "severity": "high",     "signature": "<script>alert(1)</script>"},
            {"category": "path_traversal",  "severity": "high",     "signature": "../../etc/passwd"},
            {"category": "auth_brute_force","severity": "medium",   "signature": "Multiple failed logins"},
        ]
        round_idx = 0

        while self.is_running:
            logger.info("Polling for new security alerts...")
            
            template = alert_types[round_idx % len(alert_types)]
            alert = {
                "id": str(uuid.uuid4()),
                "category": template["category"],
                "severity": template["severity"],
                # Unique signature per poll cycle so deduplication does not suppress it
                "signature": f"{template['signature']} [{int(time.time())}]",
                "source": "192.168.1.50"
            }
            
            self.orchestrator.process_alert(alert)
            round_idx += 1
            await asyncio.sleep(60)
            
    def stop(self):
        self.is_running = False
        logger.info("H-vision Multi-Agent Blue Team stopped.")

if __name__ == "__main__":
    agent = BlueAgent()
    try:
        asyncio.run(agent.start())
    except KeyboardInterrupt:
        agent.stop()
