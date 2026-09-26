import asyncio
import uuid
from app.database.connection import AsyncSessionLocal
from app.database.models import Incident

async def seed_incidents():
    incidents = [
        {
            "title": "SQL Injection on /api/login",
            "category": "sql_injection",
            "severity": "Critical",
            "description": "Detected a time-based SQL injection vulnerability on the /api/login endpoint. Payload: ' OR SLEEP(5)--",
            "risk_score": 9.5
        },
        {
            "title": "Cross-Site Scripting (XSS) on /search",
            "category": "xss",
            "severity": "High",
            "description": "Reflected XSS detected on the 'q' parameter. Payload: <script>alert(1)</script>",
            "risk_score": 7.5
        },
        {
            "title": "Path Traversal on /download",
            "category": "path_traversal",
            "severity": "Critical",
            "description": "Arbitrary file read vulnerability detected via the 'file' parameter. Payload: ../../../../etc/passwd",
            "risk_score": 9.0
        },
        {
            "title": "Authentication Brute Force",
            "category": "brute_force",
            "severity": "Medium",
            "description": "Multiple failed login attempts detected from a single IP address in a short timeframe.",
            "risk_score": 5.0
        },
        {
            "title": "JWT Signature Bypass",
            "category": "jwt_attack",
            "severity": "Critical",
            "description": "The application accepted a JWT token with the algorithm changed to 'None'.",
            "risk_score": 9.8
        }
    ]

    async with AsyncSessionLocal() as session:
        for inc_data in incidents:
            incident = Incident(
                id=str(uuid.uuid4()),
                title=inc_data["title"],
                description=inc_data["description"] + "\n\nRemediation: Apply the recommended patch to sanitize inputs and implement proper validation.",
                category=inc_data["category"],
                severity=inc_data["severity"],
                status="new",
                risk_score=inc_data["risk_score"]
            )
            session.add(incident)
        
        await session.commit()
        print(f"Successfully seeded {len(incidents)} incidents into the database.")

if __name__ == "__main__":
    asyncio.run(seed_incidents())
