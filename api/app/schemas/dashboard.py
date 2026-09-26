"""Dashboard schemas for JANUS-Sentinel."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class DashboardSummary(BaseModel):
    active_incidents: int
    critical_incidents: int
    attacks_today: int
    total_runs: int
    active_runs: int
    patches_pending: int
    patches_validated: int
    mean_detection_time_seconds: Optional[float]
    mean_remediation_time_seconds: Optional[float]
    chroma_doc_count: int
    gemini_status: str  # "available" | "unavailable" | "degraded"
    generated_at: datetime


class TimelinePoint(BaseModel):
    hour: str  # ISO 8601 hour bucket
    incidents: int
    detections: int


class TimelineResponse(BaseModel):
    period_hours: int
    data: list[TimelinePoint]


class SeverityDistribution(BaseModel):
    severity: str
    count: int
    percentage: float


class SeverityDistributionResponse(BaseModel):
    total: int
    distribution: list[SeverityDistribution]


class AttackTypeCount(BaseModel):
    detection_type: str
    count: int
    percentage: float


class TopAttackTypesResponse(BaseModel):
    total_detections: int
    top_types: list[AttackTypeCount]


class ServiceHealth(BaseModel):
    service: str
    status: str  # "healthy" | "degraded" | "unavailable"
    latency_ms: Optional[float]
    detail: Optional[str]


class SystemHealth(BaseModel):
    overall: str  # "healthy" | "degraded" | "critical"
    services: list[ServiceHealth]
    checked_at: datetime
