"""Red Team Run schemas for JANUS-Sentinel."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class RedTeamRunCreate(BaseModel):
    target_id: str = Field(..., description="ID of the authorized target")
    profile: str = Field(default="standard", description="Attack profile: recon|standard|aggressive")
    notes: Optional[str] = None

    @field_validator("profile")
    @classmethod
    def validate_profile(cls, v: str) -> str:
        allowed = {"recon", "standard", "aggressive"}
        if v not in allowed:
            raise ValueError(f"profile must be one of {allowed}")
        return v


class RedTeamRunStopRequest(BaseModel):
    reason: str = Field(..., description="Reason for stopping the run")


class RedTeamRunResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    target_id: str
    status: str
    profile: str
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    requests_sent: int
    findings_count: int
    stopped_reason: Optional[str]
    created_by: str
    created_at: Optional[datetime] = None

    @classmethod
    def from_orm_with_created(cls, run) -> "RedTeamRunResponse":
        """Build from ORM, deriving created_at from started_at if needed."""
        return cls.model_validate(run)


class RedTeamRunListResponse(BaseModel):
    items: list[RedTeamRunResponse]
    total: int
    page: int
    page_size: int


class RunFinding(BaseModel):
    detection_id: str
    detection_type: str
    severity: str
    confidence: float
    evidence: Optional[str]
    created_at: datetime


class RunFindingsResponse(BaseModel):
    run_id: str
    findings: list[RunFinding]
    total: int
