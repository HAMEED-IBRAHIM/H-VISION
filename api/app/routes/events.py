import logging
from fastapi import APIRouter, Request, BackgroundTasks
from typing import Dict, Any

from app.detection.engine import detection_engine

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Events"])

# In-memory store for events and detections
EVENTS_DB = []
DETECTIONS_DB = []

@router.post("/internal/events")
async def receive_event(event_data: dict, request: Request, background_tasks: BackgroundTasks):
    """Target App's CaptureMiddleware sends all requests here."""
    EVENTS_DB.append(event_data)
    
    # Run the detection engine!
    findings = detection_engine.run_detection(event_data)
    if findings:
        for finding in findings:
            detection_record = {
                "id": f"det_{len(DETECTIONS_DB) + 1}",
                "event_path": event_data.get("path"),
                "rule_name": finding.rule_name,
                "severity": finding.severity,
                "evidence": finding.evidence,
            }
            DETECTIONS_DB.append(detection_record)
            logger.warning(f"🚨 BLUE TEAM DETECTION: {finding.rule_name} at {event_data.get('path')}")
            
            # Active Defense: Auto-generate WAF regex rule and inject into Proxy
            if finding.evidence and isinstance(finding.evidence, str):
                import re
                from app.routes.proxy import ACTIVE_WAF_RULES
                # Escape the evidence for regex, but allow basic variations
                escaped_evidence = re.escape(finding.evidence)
                # Create a simple robust regex pattern
                rule_pattern = f".*{escaped_evidence}.*"
                
                new_rule = {
                    "id": f"WAF-AUTO-{finding.rule_name.upper().replace(' ', '-')}-{len(ACTIVE_WAF_RULES)+1}",
                    "pattern": rule_pattern,
                    "description": f"Auto-generated block for {finding.rule_name}"
                }
                
                # Check if already blocked to prevent duplicates
                if not any(r["pattern"] == rule_pattern for r in ACTIVE_WAF_RULES):
                    ACTIVE_WAF_RULES.append(new_rule)
                    logger.info(f"✅ ACTIVE DEFENSE: Injected new WAF rule into Gateway: {new_rule['id']}")
            
            # Dark Web Intelligence — analyze real payloads for credential exposure
            try:
                from app.routes.darkweb import analyze_payload_for_credentials, analyze_breach_from_detection
                analyze_payload_for_credentials({"payload": finding.evidence, "endpoint": event_data.get("path"), "type": finding.rule_name})
                analyze_breach_from_detection(detection_record)
            except Exception:
                pass

            # Vulnerability Lifecycle — auto-ingest real detections
            try:
                from app.routes.lifecycle import ingest_vulnerability_from_detection
                ingest_vulnerability_from_detection(detection_record)
            except Exception:
                pass

    return {"status": "received"}

@router.get("/events")
async def list_events():
    return {"items": EVENTS_DB}

@router.get("/detections")
async def list_detections():
    return {"items": DETECTIONS_DB}
