"""Knowledge document schemas for JANUS-Sentinel."""

from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field, field_validator


VALID_COLLECTIONS = {
    "threat_intelligence",
    "secure_coding_guidance",
    "attack_observations",
    "patch_knowledge",
    "incident_memory",
}


class KnowledgeDocumentIngest(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    content: str = Field(..., min_length=10)
    collection: str = Field(..., description="Target Chroma collection")
    source: Optional[str] = None
    category: Optional[str] = None
    extra_metadata: Optional[dict[str, Any]] = None

    @field_validator("collection")
    @classmethod
    def validate_collection(cls, v: str) -> str:
        if v not in VALID_COLLECTIONS:
            raise ValueError(f"collection must be one of {VALID_COLLECTIONS}")
        return v


class KnowledgeDocumentResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    chroma_document_id: str
    title: str
    source: Optional[str]
    category: Optional[str]
    checksum: str
    version: int
    metadata_json: Optional[dict[str, Any]]
    ingested_at: datetime


class KnowledgeSearchRequest(BaseModel):
    query: str = Field(..., min_length=3, description="Semantic search query")
    collections: list[str] = Field(
        default_factory=lambda: list(VALID_COLLECTIONS),
        description="Collections to search",
    )
    n_results: int = Field(default=5, ge=1, le=20)

    @field_validator("collections", mode="before")
    @classmethod
    def validate_collections(cls, v: list[str]) -> list[str]:
        for col in v:
            if col not in VALID_COLLECTIONS:
                raise ValueError(f"Invalid collection: {col}")
        return v


class KnowledgeSearchHit(BaseModel):
    collection: str
    document_id: str
    content: str
    metadata: Optional[dict[str, Any]]
    distance: float


class KnowledgeSearchResult(BaseModel):
    query: str
    hits: list[KnowledgeSearchHit]
    total_hits: int


class CollectionStat(BaseModel):
    collection: str
    document_count: int
    is_available: bool


class KnowledgeStatistics(BaseModel):
    collections: list[CollectionStat]
    total_documents: int
    chroma_available: bool
