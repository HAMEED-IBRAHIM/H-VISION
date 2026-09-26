"""Patch Proposal schemas for JANUS-Sentinel."""

from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field


class PatchProposalResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    incident_id: str
    patch_type: str
    target_file: str
    original_hash: str
    unified_diff: str
    explanation: Optional[str]
    risk_level: Optional[str]
    validation_plan: Optional[str]
    status: str
    generated_at: datetime
    approved_by: Optional[str]
    approved_at: Optional[datetime]
    applied_at: Optional[datetime]


class PatchProposalListResponse(BaseModel):
    items: list[PatchProposalResponse]
    total: int
    page: int
    page_size: int


class PatchRejectRequest(BaseModel):
    reason: str = Field(..., description="Reason for rejecting the patch")


class ValidationRunResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    patch_proposal_id: str
    test_results: Optional[dict[str, Any]]
    previous_attack_blocked: Optional[bool]
    legitimate_requests_work: Optional[bool]
    status: str
    started_at: datetime
    completed_at: Optional[datetime]


class PatchApplyRequest(BaseModel):
    confirm: bool = Field(..., description="Must be true to confirm irreversible apply operation")
    backup_note: Optional[str] = None


class PatchRollbackRequest(BaseModel):
    confirm: bool = Field(..., description="Must be true to confirm rollback operation")
    reason: str = Field(..., description="Reason for rollback")
