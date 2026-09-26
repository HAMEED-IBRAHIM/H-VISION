"""Events and Detection schemas for JANUS-Sentinel."""

from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field


class CapturedRequestIngest(BaseModel):
    """Schema for incoming captured HTTP requests from target middleware."""
    target_id: str
    red_team_run_id: Optional[str] = None
    request_method: str = Field(..., description="HTTP method: GET, POST, PUT, DELETE, etc.")
    request_path: str
    query_parameters: Optional[dict[str, Any]] = None
    sanitized_headers: Optional[dict[str, str]] = None
    sanitized_body: Optional[str] = None
    response_status: Optional[int] = None
    response_time_ms: Optional[float] = None
    source_ip: Optional[str] = None
    user_agent: Optional[str] = None
    request_hash: Optional[str] = None


class CapturedRequestResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    target_id: str
    red_team_run_id: Optional[str]
    request_method: str
    request_path: str
    query_parameters: Optional[dict[str, Any]]
    sanitized_headers: Optional[dict[str, str]]
    sanitized_body: Optional[str]
    response_status: Optional[int]
    response_time_ms: Optional[float]
    source_ip: Optional[str]
    user_agent: Optional[str]
    request_hash: Optional[str]
    timestamp: datetime


class DetectionResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    captured_request_id: str
    detection_type: str
    rule_id: str
    confidence: float
    severity: str
    evidence: Optional[str]
    matched_patterns: Optional[list[str]]
    anomaly_score: Optional[float]
    created_at: datetime


class DetectionListResponse(BaseModel):
    items: list[DetectionResponse]
    total: int
    page: int
    page_size: int


class EventIngestResponse(BaseModel):
    captured_request_id: str
    detections_created: int
    incidents_created: int
    message: str
