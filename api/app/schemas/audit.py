"""Audit event schemas for JANUS-Sentinel."""

from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel


class AuditEventResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    actor_type: str
    actor_id: Optional[str]
    action: str
    object_type: Optional[str]
    object_id: Optional[str]
    details: Optional[dict[str, Any]]
    previous_event_hash: Optional[str]
    event_hash: str
    timestamp: datetime


class AuditEventListResponse(BaseModel):
    items: list[AuditEventResponse]
    total: int
    page: int
    page_size: int


class AuditVerifyResponse(BaseModel):
    chain_valid: bool
    total_events: int
    first_event_id: Optional[str]
    last_event_id: Optional[str]
    broken_at_event_id: Optional[str]
    message: str
