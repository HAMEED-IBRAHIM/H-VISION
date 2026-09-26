"""Report schemas for JANUS-Sentinel."""

from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field, field_validator


class ReportCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    report_type: str = Field(default="run_report", description="run_report|incident_report|period_report")
    red_team_run_id: Optional[str] = Field(None, description="For run_report")
    incident_id: Optional[str] = Field(None, description="For incident_report")
    period_start: Optional[datetime] = Field(None, description="For period_report")
    period_end: Optional[datetime] = Field(None, description="For period_report")
    include_evidence: bool = Field(default=True)
    include_raw_requests: bool = Field(default=False, description="Include sanitized request bodies")
    format: str = Field(default="html", description="html|pdf")

    @field_validator("report_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        allowed = {"run_report", "incident_report", "period_report"}
        if v not in allowed:
            raise ValueError(f"report_type must be one of {allowed}")
        return v

    @field_validator("format")
    @classmethod
    def validate_format(cls, v: str) -> str:
        allowed = {"html", "pdf"}
        if v not in allowed:
            raise ValueError(f"format must be one of {allowed}")
        return v


class ReportResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    title: str
    report_type: str
    red_team_run_id: Optional[str]
    incident_id: Optional[str]
    period_start: Optional[datetime]
    period_end: Optional[datetime]
    format: str
    status: str  # generating|ready|failed
    generated_at: Optional[datetime]
    created_by: str
    created_at: datetime
    content_summary: Optional[str]  # Executive summary snippet
    finding_count: int
    patch_count: int


class ReportListResponse(BaseModel):
    items: list[ReportResponse]
    total: int
    page: int
    page_size: int
