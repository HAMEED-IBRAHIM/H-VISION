from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, JSON, Text, Float
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func
from typing import Any
import uuid

Base = declarative_base()

def get_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=get_uuid)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="viewer")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Target(Base):
    __tablename__ = "targets"
    id = Column(String, primary_key=True, default=get_uuid)
    name = Column(String, nullable=False)
    target_type = Column(String, nullable=False, default="lab_web_application")
    owner_name = Column(String, nullable=True)
    is_authorized = Column(Boolean, default=False)
    base_url = Column(String, nullable=True)
    docker_hostname = Column(String, nullable=True)
    environment = Column(String, nullable=False, default="development")
    scope_description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class RedTeamRun(Base):
    __tablename__ = "red_team_runs"
    id = Column(String, primary_key=True, default=get_uuid)
    target_id = Column(String, ForeignKey("targets.id"))
    status = Column(String, nullable=False, default="pending")
    profile = Column(String, nullable=False, default="standard")
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    requests_sent = Column(Integer, default=0)
    findings_count = Column(Integer, default=0)
    stopped_reason = Column(String, nullable=True)
    created_by = Column(String, ForeignKey("users.id"))
    
    target = relationship("Target")
    creator = relationship("User")

class CapturedRequest(Base):
    __tablename__ = "captured_requests"
    id = Column(String, primary_key=True, default=get_uuid)
    target_id = Column(String, ForeignKey("targets.id"))
    red_team_run_id = Column(String, ForeignKey("red_team_runs.id"), nullable=True)
    request_method = Column(String, nullable=False)
    request_path = Column(String, nullable=False)
    query_parameters = Column(JSON, nullable=True)
    sanitized_headers = Column(JSON, nullable=True)
    sanitized_body = Column(Text, nullable=True)
    response_status = Column(Integer, nullable=True)
    response_time_ms = Column(Float, nullable=True)
    source_ip = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    request_hash = Column(String, nullable=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class Detection(Base):
    __tablename__ = "detections"
    id = Column(String, primary_key=True, default=get_uuid)
    captured_request_id = Column(String, ForeignKey("captured_requests.id"))
    detection_type = Column(String, nullable=False)
    rule_id = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    severity = Column(String, nullable=False)
    evidence = Column(Text, nullable=True)
    matched_patterns = Column(JSON, nullable=True)
    anomaly_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Incident(Base):
    __tablename__ = "incidents"
    id = Column(String, primary_key=True, default=get_uuid)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    status = Column(String, nullable=False, default="new")
    target_id = Column(String, ForeignKey("targets.id"))
    detection_id = Column(String, ForeignKey("detections.id"))
    assigned_to = Column(String, ForeignKey("users.id"), nullable=True)
    first_seen = Column(DateTime(timezone=True), server_default=func.now())
    last_seen = Column(DateTime(timezone=True), server_default=func.now())
    attack_count = Column(Integer, default=1)
    risk_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class RAGRetrieval(Base):
    __tablename__ = "rag_retrievals"
    id = Column(String, primary_key=True, default=get_uuid)
    incident_id = Column(String, ForeignKey("incidents.id"))
    query = Column(Text, nullable=False)
    retrieved_document_ids = Column(JSON, nullable=True)
    retrieved_metadata = Column(JSON, nullable=True)
    distances = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class GeminiAnalysis(Base):
    __tablename__ = "gemini_analyses"
    id = Column(String, primary_key=True, default=get_uuid)
    incident_id = Column(String, ForeignKey("incidents.id"))
    model = Column(String, nullable=False)
    prompt_version = Column(String, nullable=True)
    response = Column(JSON, nullable=True)
    classification = Column(String, nullable=True)
    confidence = Column(Float, nullable=True)
    recommended_actions = Column(Text, nullable=True)
    latency_ms = Column(Float, nullable=True)
    token_usage = Column(JSON, nullable=True)
    status = Column(String, nullable=False, default="pending")
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PatchProposal(Base):
    __tablename__ = "patch_proposals"
    id = Column(String, primary_key=True, default=get_uuid)
    incident_id = Column(String, ForeignKey("incidents.id"))
    patch_type = Column(String, nullable=False)
    target_file = Column(String, nullable=False)
    original_hash = Column(String, nullable=False)
    unified_diff = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)
    risk_level = Column(String, nullable=True)
    validation_plan = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="proposed")
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    approved_by = Column(String, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    applied_at = Column(DateTime(timezone=True), nullable=True)

class ValidationRun(Base):
    __tablename__ = "validation_runs"
    id = Column(String, primary_key=True, default=get_uuid)
    patch_proposal_id = Column(String, ForeignKey("patch_proposals.id"))
    test_results = Column(JSON, nullable=True)
    previous_attack_blocked = Column(Boolean, nullable=True)
    legitimate_requests_work = Column(Boolean, nullable=True)
    status = Column(String, nullable=False, default="pending")
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"
    id = Column(String, primary_key=True, default=get_uuid)
    chroma_document_id = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    source = Column(String, nullable=True)
    category = Column(String, nullable=True)
    checksum = Column(String, nullable=False, unique=True)
    version = Column(Integer, default=1)
    metadata_json = Column(JSON, nullable=True)
    ingested_at = Column(DateTime(timezone=True), server_default=func.now())

class AuditEvent(Base):
    __tablename__ = "audit_events"
    id = Column(String, primary_key=True, default=get_uuid)
    actor_type = Column(String, nullable=False)
    actor_id = Column(String, nullable=True)
    action = Column(String, nullable=False)
    object_type = Column(String, nullable=True)
    object_id = Column(String, nullable=True)
    details = Column(JSON, nullable=True)
    previous_event_hash = Column(String, nullable=True)
    event_hash = Column(String, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class Report(Base):
    __tablename__ = "reports"
    id = Column(String, primary_key=True, default=get_uuid)
    title = Column(String, nullable=False)
    target_id = Column(String, ForeignKey("targets.id"), nullable=True)
    generated_by = Column(String, ForeignKey("users.id"), nullable=True)
    format = Column(String, nullable=False, default="html")
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    target = relationship("Target")
    author = relationship("User")
