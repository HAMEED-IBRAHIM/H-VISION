"""
Alembic migration script: create all tables

Revision ID: 0001_initial
Revises: 
Create Date: 2026-07-17
"""
from alembic import op
import sqlalchemy as sa

revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Users
    op.create_table(
        'users',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=False, server_default='viewer'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
    )
    op.create_index('ix_users_email', 'users', ['email'])

    # Targets
    op.create_table(
        'targets',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('target_type', sa.String(), nullable=False, server_default='lab_web_application'),
        sa.Column('owner_name', sa.String(), nullable=True),
        sa.Column('is_authorized', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('base_url', sa.String(), nullable=True),
        sa.Column('docker_hostname', sa.String(), nullable=True),
        sa.Column('environment', sa.String(), nullable=False, server_default='development'),
        sa.Column('scope_description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )

    # Red Team Runs
    op.create_table(
        'red_team_runs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('target_id', sa.String(), sa.ForeignKey('targets.id')),
        sa.Column('status', sa.String(), nullable=False, server_default='pending'),
        sa.Column('profile', sa.String(), nullable=False, server_default='standard'),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('requests_sent', sa.Integer(), server_default='0'),
        sa.Column('findings_count', sa.Integer(), server_default='0'),
        sa.Column('stopped_reason', sa.String(), nullable=True),
        sa.Column('created_by', sa.String(), sa.ForeignKey('users.id')),
        sa.PrimaryKeyConstraint('id'),
    )

    # Captured Requests
    op.create_table(
        'captured_requests',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('target_id', sa.String(), sa.ForeignKey('targets.id')),
        sa.Column('red_team_run_id', sa.String(), sa.ForeignKey('red_team_runs.id'), nullable=True),
        sa.Column('request_method', sa.String(), nullable=False),
        sa.Column('request_path', sa.String(), nullable=False),
        sa.Column('query_parameters', sa.JSON(), nullable=True),
        sa.Column('sanitized_headers', sa.JSON(), nullable=True),
        sa.Column('sanitized_body', sa.Text(), nullable=True),
        sa.Column('response_status', sa.Integer(), nullable=True),
        sa.Column('response_time_ms', sa.Float(), nullable=True),
        sa.Column('source_ip', sa.String(), nullable=True),
        sa.Column('user_agent', sa.String(), nullable=True),
        sa.Column('request_hash', sa.String(), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_captured_requests_hash', 'captured_requests', ['request_hash'])

    # Detections
    op.create_table(
        'detections',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('captured_request_id', sa.String(), sa.ForeignKey('captured_requests.id')),
        sa.Column('detection_type', sa.String(), nullable=False),
        sa.Column('rule_id', sa.String(), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=False),
        sa.Column('severity', sa.String(), nullable=False),
        sa.Column('evidence', sa.Text(), nullable=True),
        sa.Column('matched_patterns', sa.JSON(), nullable=True),
        sa.Column('anomaly_score', sa.Float(), nullable=True),
        sa.Column('is_analyzed', sa.Boolean(), server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )

    # Incidents
    op.create_table(
        'incidents',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('severity', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='new'),
        sa.Column('target_id', sa.String(), sa.ForeignKey('targets.id')),
        sa.Column('detection_id', sa.String(), sa.ForeignKey('detections.id')),
        sa.Column('assigned_to', sa.String(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('first_seen', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('last_seen', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('attack_count', sa.Integer(), server_default='1'),
        sa.Column('risk_score', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )

    # RAG Retrievals
    op.create_table(
        'rag_retrievals',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('incident_id', sa.String(), sa.ForeignKey('incidents.id')),
        sa.Column('query', sa.Text(), nullable=False),
        sa.Column('retrieved_document_ids', sa.JSON(), nullable=True),
        sa.Column('retrieved_metadata', sa.JSON(), nullable=True),
        sa.Column('distances', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )

    # Gemini Analyses
    op.create_table(
        'gemini_analyses',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('incident_id', sa.String(), sa.ForeignKey('incidents.id')),
        sa.Column('model', sa.String(), nullable=False),
        sa.Column('prompt_version', sa.String(), nullable=True),
        sa.Column('response', sa.JSON(), nullable=True),
        sa.Column('classification', sa.String(), nullable=True),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('recommended_actions', sa.Text(), nullable=True),
        sa.Column('latency_ms', sa.Float(), nullable=True),
        sa.Column('token_usage', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='pending'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )

    # Patch Proposals
    op.create_table(
        'patch_proposals',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('incident_id', sa.String(), sa.ForeignKey('incidents.id')),
        sa.Column('patch_type', sa.String(), nullable=False),
        sa.Column('target_file', sa.String(), nullable=False),
        sa.Column('original_hash', sa.String(), nullable=False),
        sa.Column('unified_diff', sa.Text(), nullable=False),
        sa.Column('explanation', sa.Text(), nullable=True),
        sa.Column('risk_level', sa.String(), nullable=True),
        sa.Column('validation_plan', sa.Text(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='proposed'),
        sa.Column('generated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('approved_by', sa.String(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('applied_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )

    # Validation Runs
    op.create_table(
        'validation_runs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('patch_proposal_id', sa.String(), sa.ForeignKey('patch_proposals.id')),
        sa.Column('test_results', sa.JSON(), nullable=True),
        sa.Column('previous_attack_blocked', sa.Boolean(), nullable=True),
        sa.Column('legitimate_requests_work', sa.Boolean(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='pending'),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )

    # Knowledge Documents
    op.create_table(
        'knowledge_documents',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('chroma_document_id', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('source', sa.String(), nullable=True),
        sa.Column('category', sa.String(), nullable=True),
        sa.Column('checksum', sa.String(), nullable=False),
        sa.Column('version', sa.Integer(), server_default='1'),
        sa.Column('metadata_json', sa.JSON(), nullable=True),
        sa.Column('ingested_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('checksum'),
    )
    op.create_index('ix_knowledge_chroma_id', 'knowledge_documents', ['chroma_document_id'])

    # Audit Events
    op.create_table(
        'audit_events',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('actor_type', sa.String(), nullable=False),
        sa.Column('actor_id', sa.String(), nullable=True),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('object_type', sa.String(), nullable=True),
        sa.Column('object_id', sa.String(), nullable=True),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('previous_event_hash', sa.String(), nullable=True),
        sa.Column('event_hash', sa.String(), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )

    # Reports
    op.create_table(
        'reports',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('target_id', sa.String(), sa.ForeignKey('targets.id'), nullable=True),
        sa.Column('red_team_run_id', sa.String(), sa.ForeignKey('red_team_runs.id'), nullable=True),
        sa.Column('generated_by', sa.String(), sa.ForeignKey('users.id')),
        sa.Column('format', sa.String(), nullable=False, server_default='html'),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('reports')
    op.drop_table('audit_events')
    op.drop_table('knowledge_documents')
    op.drop_table('validation_runs')
    op.drop_table('patch_proposals')
    op.drop_table('gemini_analyses')
    op.drop_table('rag_retrievals')
    op.drop_table('incidents')
    op.drop_table('detections')
    op.drop_table('captured_requests')
    op.drop_table('red_team_runs')
    op.drop_table('targets')
    op.drop_table('users')
