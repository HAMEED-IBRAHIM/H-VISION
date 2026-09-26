"""
H-vision Reporting Engine
=========================
Generates comprehensive security reports by querying the PostgreSQL database
for persisted Incident records created by the Red Team scanner.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc, func
from pydantic import BaseModel
from typing import List, Optional
import uuid
import json

from app.database.connection import get_db
from app.database.models import Incident, Report

router = APIRouter(prefix="/reports", tags=["Reporting Engine"])

class ReportCreate(BaseModel):
    title: str
    target_id: Optional[str] = None

class ReportResponse(BaseModel):
    id: str
    title: str
    format: str
    content: str
    
    class Config:
        from_attributes = True

@router.post("/", response_model=ReportResponse)
async def generate_report(
    request: ReportCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Generates a comprehensive security report aggregating ALL incidents
    from the database, including live findings persisted by the Red Team scanner.
    """
    # ── Fetch all incidents from PostgreSQL ──────────────────────────────
    query = select(Incident).order_by(desc(Incident.created_at)).limit(200)
    if request.target_id:
        query = query.where(Incident.target_id == request.target_id)
        
    result = await db.execute(query)
    incidents = result.scalars().all()
    
    total = len(incidents)
    critical_count = sum(1 for inc in incidents if inc.severity.lower() == "critical")
    high_count = sum(1 for inc in incidents if inc.severity.lower() == "high")
    medium_count = sum(1 for inc in incidents if inc.severity.lower() == "medium")
    low_count = sum(1 for inc in incidents if inc.severity.lower() == "low")
    
    # ── Categorize by attack type ────────────────────────────────────────
    categories = {}
    for inc in incidents:
        cat = inc.category or "unknown"
        categories[cat] = categories.get(cat, 0) + 1
    
    # ── Build rich HTML report ───────────────────────────────────────────
    html = []
    html.append(f"<h1>H-vision Security Report: {request.title}</h1>")
    
    # Executive Summary
    html.append("<h2>Executive Summary</h2>")
    html.append(f"<p><strong>Total incidents analyzed: {total}</strong></p>")
    html.append("<ul>")
    html.append(f"<li>🔴 <strong>Critical:</strong> {critical_count}</li>")
    html.append(f"<li>🟠 <strong>High:</strong> {high_count}</li>")
    html.append(f"<li>🟡 <strong>Medium:</strong> {medium_count}</li>")
    html.append(f"<li>🟢 <strong>Low:</strong> {low_count}</li>")
    html.append("</ul>")
    
    if critical_count > 0:
        html.append(f'<p style="color:#ef4444;font-weight:bold;">⚠️ {critical_count} CRITICAL threats require immediate attention!</p>')
    
    # Attack Type Distribution
    if categories:
        html.append("<h2>Attack Type Distribution</h2>")
        html.append("<table border='1' cellpadding='6' cellspacing='0'>")
        html.append("<tr><th>Attack Type</th><th>Count</th></tr>")
        for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
            label = cat.replace("_", " ").title()
            html.append(f"<tr><td>{label}</td><td><strong>{count}</strong></td></tr>")
        html.append("</table>")
    
    # Incident Details Table
    html.append("<h2>Incident Details</h2>")
    if total == 0:
        html.append("<p><em>No incidents found in the database. Run a security scan first.</em></p>")
    else:
        html.append("<table border='1' cellpadding='6' cellspacing='0'>")
        html.append("<tr><th>#</th><th>Title</th><th>Severity</th><th>Category</th><th>Status</th><th>Risk Score</th></tr>")
        for idx, inc in enumerate(incidents, 1):
            sev_color = {"critical": "#ef4444", "high": "#f97316", "medium": "#eab308", "low": "#22c55e"}.get(inc.severity.lower(), "#94a3b8")
            html.append(
                f'<tr>'
                f'<td>{idx}</td>'
                f'<td>{inc.title}</td>'
                f'<td style="color:{sev_color};font-weight:bold;">{inc.severity}</td>'
                f'<td>{(inc.category or "N/A").replace("_", " ").title()}</td>'
                f'<td>{inc.status}</td>'
                f'<td>{inc.risk_score or "N/A"}</td>'
                f'</tr>'
            )
        html.append("</table>")

    # Remediation Summary
    html.append("<h2>Remediation Summary</h2>")
    seen_categories = set()
    for inc in incidents:
        cat = inc.category or "unknown"
        if cat not in seen_categories and inc.description:
            seen_categories.add(cat)
            # Extract remediation from description (it's after "Remediation: ")
            desc_text = inc.description or ""
            if "Remediation:" in desc_text:
                remediation = desc_text.split("Remediation:")[-1].strip()
                html.append(f"<p><strong>{cat.replace('_', ' ').title()}:</strong> {remediation}</p>")

    html.append(f"<h3>Critical Threats Detected: {critical_count}</h3>")
    html.append("<p><em>Report generated automatically by H-vision Blue Team Engine.</em></p>")
    
    html_content = "\n".join(html)
    
    # ── Save report to database ──────────────────────────────────────────
    report = Report(
        id=str(uuid.uuid4()),
        title=request.title,
        target_id=request.target_id,
        generated_by=None,
        format="html",
        content=html_content
    )
    
    db.add(report)
    await db.commit()
    await db.refresh(report)
    
    return report

@router.get("/", response_model=List[ReportResponse])
async def list_reports(
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Report).order_by(desc(Report.created_at)))
    return result.scalars().all()

@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report
