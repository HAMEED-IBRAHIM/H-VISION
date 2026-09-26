import logging
import json
import os
from typing import Dict, Any
from groq import Groq

logger = logging.getLogger(__name__)

class ThreatHunterAgent:
    """
    The Investigator. Deeply analyzes high-priority alerts, maps to MITRE ATT&CK,
    and determines root cause using Groq's Llama3-70b AI model.
    """
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY", "")
        self.model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        self.client = Groq(api_key=self.api_key) if self.api_key else None

    def analyze(self, triaged_alert: Dict[str, Any]) -> Dict[str, Any]:
        logger.info(f"[ThreatHunterAgent] Starting deep investigation for alert {triaged_alert.get('id')}")

        investigation_result = {
            "root_cause": "Unknown",
            "mitre_technique": "T0000",
            "confidence": "Low",
            "analysis_notes": ""
        }

        # Deterministic fallback mapping when AI is unavailable
        category = triaged_alert.get("category", "").lower()
        if "sql" in category:
            investigation_result["mitre_technique"] = "T1190 - Exploit Public-Facing Application"
            investigation_result["root_cause"] = "Improper Neutralization of Special Elements in SQL Command (CWE-89)"
            investigation_result["confidence"] = "High"
        elif "xss" in category:
            investigation_result["mitre_technique"] = "T1189 - Drive-by Compromise"
            investigation_result["root_cause"] = "Improper Neutralization of Input During Web Page Generation (CWE-79)"
            investigation_result["confidence"] = "High"
        elif "path" in category or "traversal" in category:
            investigation_result["mitre_technique"] = "T1083 - File and Directory Discovery"
            investigation_result["root_cause"] = "Improper Limitation of Pathname to Restricted Directory (CWE-22)"
            investigation_result["confidence"] = "High"
        elif "auth" in category or "brute" in category:
            investigation_result["mitre_technique"] = "T1110 - Brute Force"
            investigation_result["root_cause"] = "Missing Account Lockout Mechanism (CWE-307)"
            investigation_result["confidence"] = "High"

        # Use Groq (Llama3) for deep AI reasoning if configured
        if self.client:
            try:
                logger.info("[ThreatHunterAgent] Consulting Groq Llama3-70b for deep analysis...")
                prompt = (
                    f"You are the Threat Hunter Agent in an autonomous SOC platform (H-vision). "
                    f"Analyze the following security alert and provide your expert assessment.\n\n"
                    f"Alert Data: {json.dumps(triaged_alert, default=str)}\n\n"
                    "Respond ONLY with a valid JSON object matching EXACTLY this schema (no markdown, no extra text):\n"
                    "{\"root_cause\": \"string\", \"mitre_technique\": \"string\", \"confidence\": \"High|Medium|Low\", \"analysis_notes\": \"string\"}"
                )

                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are a cybersecurity expert. Always respond with valid JSON only."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.2,
                    max_tokens=512,
                )

                raw_text = response.choices[0].message.content.strip()

                try:
                    cleaned = raw_text.replace("```json", "").replace("```", "").strip()
                    ai_result = json.loads(cleaned)
                    investigation_result.update(ai_result)
                    logger.info("[ThreatHunterAgent] Groq AI analysis complete.")
                except json.JSONDecodeError:
                    logger.warning("[ThreatHunterAgent] Failed to parse AI output as JSON. Using fallback.")
                    investigation_result["analysis_notes"] = raw_text

            except Exception as e:
                logger.error(f"[ThreatHunterAgent] Groq API error: {e}. Using deterministic fallback.")

        triaged_alert["investigation"] = investigation_result
        return triaged_alert
