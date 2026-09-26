import httpx
import logging
from typing import Dict, Any, Optional, List

from app.patch_generator import PatchGenerator
from app.waf_generator import WAFGenerator

logger = logging.getLogger(__name__)

class BlueTeamAnalyzer:
    def __init__(self, api_client: httpx.AsyncClient):
        self.api_client = api_client

    async def generate_protections(self, incident: Dict[str, Any], detections: List[Dict[str, Any]], target_file_path: str, original_content: str) -> Optional[Dict[str, Any]]:
        """
        Generates comprehensive protections (Code Patches + WAF Rules) based on incident analysis.
        This provides the 'massive protection' requested by blocking the threats and proposing permanent fixes.
        """
        logger.info(f"Studying incident {incident['id']} to generate massive protections...")
        
        try:
            # 1. Generate dynamic WAF blocking rules based on attack analysis
            waf_rules = WAFGenerator.generate_protection_rules(incident, detections)
            
            # Actively push to Target App WAF
            for rule in waf_rules:
                try:
                    # Actually enforce it on the target app
                    await self.api_client.post(
                        "http://target_app:8001/waf/rules", 
                        json={"id": rule["rule_id"], "pattern": rule["conditions"][0]["value"], "description": rule["explanation"]}
                    )
                    logger.info(f"Pushed ACTIVE DEFENSE rule to WAF: {rule['rule_id']}")
                except Exception as e:
                    logger.error(f"Failed to push WAF rule: {e}")
            
            # 2. Generate permanent code patch proposal
            patch_proposal = PatchGenerator.generate(
                vulnerability_type=incident['category'],
                target_file=target_file_path,
                original_content=original_content
            )
            
            payload = {
                "incident_id": incident['id'],
                "patch_type": patch_proposal.patch_type,
                "target_file": patch_proposal.target_file,
                "original_hash": patch_proposal.original_hash,
                "unified_diff": patch_proposal.unified_diff,
                "explanation": patch_proposal.explanation,
                "generated_waf_rules": waf_rules  # New field sent to backend
            }

            response = await self.api_client.post("/api/v1/patches", json=payload)
            response.raise_for_status()
            logger.info(f"Successfully deployed protections (WAF rules + Patch) for incident {incident['id']}")
            return response.json()

        except Exception as e:
            logger.error(f"Failed to generate or deploy protections: {e}")
            return None
