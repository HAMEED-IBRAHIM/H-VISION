"""Incident schemas for JANUS-Sentinel."""

from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field, field_validator

from app.schemas.events import CapturedRequestResponse, DetectionResponse


class RAGRetrievalResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    incident_id: str
    query: str
    retrieved_document_ids: Optional[list[Any]]
    retrieved_metadata: Optional[dict[str, Any]]
    distances: Optional[list[Any]]
    created_at: datetime


class GeminiAnalysisResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    incident_id: str
    model: str
    prompt_version: Optional[str]
    response: Optional[dict[str, Any]]
    classification: Optional[str]
    confidence: Optional[float]
    recommended_actions: Optional[str]
    latency_ms: Optional[float]
    token_usage: Optional[dict[str, Any]]
    status: str
    error_message: Optional[str]
    created_at: datetime


class PatchSummary(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    patch_type: str
    target_file: str
    risk_level: Optional[str]
    status: str
    generated_at: datetime


class IncidentResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    title: str
    description: Optional[str]
    category: str
    severity: str
    status: str
    target_id: str
    detection_id: str
    assigned_to: Optional[str]
    first_seen: datetime
    last_seen: datetime
    attack_count: int
    risk_score: Optional[float]
    created_at: datetime
    updated_at: Optional[datetime]


class IncidentDetail(BaseModel):
    """Full incident with all related entities."""
    incident: IncidentResponse
    detection: Optional[DetectionResponse]
    captured_request: Optional[CapturedRequestResponse]
    rag_retrievals: list[RAGRetrievalResponse]
    gemini_analyses: list[GeminiAnalysisResponse]
    patches: list[PatchSummary]


class IncidentListResponse(BaseModel):
    items: list[IncidentResponse]
    total: int
    page: int
    page_size: int


class IncidentUpdate(BaseModel):
    status: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            allowed = {"new", "investigating", "contained", "remediated", "resolved", "false_positive"}
            if v not in allowed:
                raise ValueError(f"status must be one of {allowed}")
        return v

    @field_validator("severity")
    @classmethod
    def validate_severity(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            allowed = {"critical", "high", "medium", "low", "informational"}
            if v not in allowed:
                raise ValueError(f"severity must be one of {allowed}")
        return v


class IncidentAssign(BaseModel):
    user_id: str = Field(..., description="ID of the user to assign the incident to")
    notes: Optional[str] = None
