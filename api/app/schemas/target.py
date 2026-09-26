"""Target schemas for JANUS-Sentinel."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, HttpUrl, field_validator


class TargetCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    target_type: str = Field(default="lab_web_application")
    owner_name: Optional[str] = None
    base_url: Optional[str] = None
    docker_hostname: Optional[str] = None
    environment: str = Field(default="development")
    scope_description: Optional[str] = None

    @field_validator("environment")
    @classmethod
    def validate_environment(cls, v: str) -> str:
        allowed = {"development", "staging", "lab", "production"}
        if v not in allowed:
            raise ValueError(f"environment must be one of {allowed}")
        return v

    @field_validator("target_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        allowed = {
            "lab_web_application", "api_service", "microservice",
            "legacy_application", "external_target"
        }
        if v not in allowed:
            raise ValueError(f"target_type must be one of {allowed}")
        return v


class TargetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    owner_name: Optional[str] = None
    base_url: Optional[str] = None
    docker_hostname: Optional[str] = None
    scope_description: Optional[str] = None
    environment: Optional[str] = None


class AuthorizeTargetRequest(BaseModel):
    authorized_by: str = Field(..., description="Name/reason for authorization")
    scope_notes: Optional[str] = None
    rules_of_engagement: Optional[str] = None


class TargetResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    name: str
    target_type: str
    owner_name: Optional[str]
    is_authorized: bool
    base_url: Optional[str]
    docker_hostname: Optional[str]
    environment: str
    scope_description: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]


class TargetListResponse(BaseModel):
    items: list[TargetResponse]
    total: int
    page: int
    page_size: int
