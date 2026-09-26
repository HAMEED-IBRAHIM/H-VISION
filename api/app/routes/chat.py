from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.config import settings
from app.database.connection import get_db
from app.rag.chroma import chroma_service
from app.routes.red_team import _state as red_team_state
from groq import Groq
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["AI Chatbot"])

class ChatRequest(BaseModel):
    message: str
    incident_id: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    context_used: bool

@router.post("/", response_model=ChatResponse)
async def chat_with_hvision(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db)
):
    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="Groq API key is not configured.")

    # Retrieve context from ChromaDB (optional, won't crash if empty)
    context_docs = []
    try:
        query = f"Provide context for incident {request.incident_id}. {request.message}" if request.incident_id else request.message
        ti_results = chroma_service.query("threat_intelligence", [query], n_results=1)
        if ti_results and "documents" in ti_results and ti_results["documents"]:
            for doc_list in ti_results["documents"]:
                context_docs.extend(doc_list)
    except Exception as e:
        logger.warning(f"ChromaDB query skipped (empty or unavailable): {e}")

    context_str = "\n".join(context_docs) if context_docs else "No stored threat intelligence available yet."

    # ── Include persisted DB incidents in context ──
    from sqlalchemy.future import select
    from sqlalchemy import desc
    from app.database.models import Incident
    try:
        result = await db.execute(
            select(Incident).order_by(desc(Incident.created_at)).limit(30)
        )
        db_incidents = result.scalars().all()
        if db_incidents:
            db_summary = f"\n\nDATABASE INCIDENTS ({len(db_incidents)} total):\n"
            for inc in db_incidents[:20]:
                db_summary += f"- [{inc.severity}] {inc.title} | Category: {inc.category} | Status: {inc.status} | Risk: {inc.risk_score}\n"
                if inc.description:
                    # Include first 150 chars of description for context
                    db_summary += f"  Details: {inc.description[:150]}...\n"
            context_str += db_summary
    except Exception as e:
        logger.warning(f"DB incident query skipped: {e}")

    live_findings = red_team_state.get("findings", [])
    if live_findings:
        findings_summary = f"\n\nCURRENT LIVE SCAN FINDINGS ({len(live_findings)} total):\n"
        for idx, f in enumerate(live_findings[:15]): 
            findings_summary += f"- [{f['severity']}] {f['type'].upper()} at {f['endpoint']} (Payload: {f['payload']})\n"
        if len(live_findings) > 15:
            findings_summary += f"... and {len(live_findings) - 15} more.\n"
        context_str += findings_summary
    elif not db_incidents:
        context_str += "\n\nCurrently, there are no live vulnerabilities detected in the current session."

    # ── Multi-Agent Swarm Logic ──
    agent_personas = {
        "threathunter": (
            "You are @ThreatHunter, an elite cyber threat intelligence analyst. "
            "You specialize in MITRE ATT&CK, reverse engineering attacker motives, and finding hidden anomalies. "
            "Speak like a hardened cyber veteran."
        ),
        "responder": (
            "You are @Responder, the incident response and remediation expert. "
            "You specialize in writing WAF rules, patching vulnerable code, and containment strategies. "
            "Be highly technical and solution-oriented."
        ),
        "commander": (
            "You are @Commander, the SOC Director. "
            "You provide high-level executive summaries, risk assessments, and strategic direction. "
            "Keep answers concise, authoritative, and focused on business impact."
        )
    }

    # Determine which agent is being addressed
    target_agent = "hvision" # default
    msg_lower = request.message.lower()
    
    for agent_tag in agent_personas.keys():
        if f"@{agent_tag}" in msg_lower:
            target_agent = agent_tag
            break

    if target_agent in agent_personas:
        base_prompt = agent_personas[target_agent]
    else:
        base_prompt = (
            "You are H-vision, an advanced autonomous SOC AI assistant built for a university final-year project. "
            "You help security analysts understand incidents, review patch proposals, analyze attack patterns, "
            "and generate professional security reports. "
            "You know MITRE ATT&CK, OWASP Top 10, CVE analysis, and threat hunting methodologies. "
            "Never provide attack payloads or malicious code. "
            "Always be helpful, professional, and technically accurate."
        )

    system_prompt = f"{base_prompt}\n\nKnowledge Base Context:\n{context_str}"

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": request.message}
    ]

    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
        response = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=messages,
            temperature=0.4,
            max_tokens=1024,
        )
        reply = response.choices[0].message.content
        return ChatResponse(reply=reply, context_used=len(context_docs) > 0)

    except Exception as e:
        logger.error(f"Groq API error: {e}")
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")
