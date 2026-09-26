// ============================================================
// JANUS-Sentinel TypeScript Type Definitions
// ============================================================

export type UserRole = 'admin' | 'analyst' | 'viewer';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export type TargetType =
  | 'lab_vulnerable_app'
  | 'lab_ctf'
  | 'lab_custom'
  | 'production_api'
  | 'production_web'
  | 'staging';

export interface Target {
  id: number;
  name: string;
  base_url: string;
  target_type: TargetType;
  owner_name: string;
  scope_description: string;
  allowed_hostnames: string[];
  is_authorized: boolean;
  is_active: boolean;
  environment: 'lab' | 'staging' | 'production';
  authorization_date?: string;
  authorized_by?: string;
  created_at: string;
}

export type RunStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'stopped'
  | 'error';

export type AttackProfile =
  | 'web_owasp_top10'
  | 'api_fuzzing'
  | 'auth_bypass'
  | 'injection'
  | 'recon'
  | 'full_spectrum';

export interface RedTeamRun {
  id: number;
  target_id: number;
  target_name: string;
  profile: AttackProfile;
  status: RunStatus;
  started_at: string;
  completed_at?: string;
  requests_sent: number;
  findings_count: number;
  critical_count: number;
  high_count: number;
  initiated_by: string;
  error_message?: string;
}

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface Finding {
  id: number;
  run_id: number;
  severity: Severity;
  category: string;
  title: string;
  description: string;
  endpoint: string;
  method: string;
  evidence?: string;
  cve?: string;
  cwe?: string;
  discovered_at: string;
}

export interface CapturedRequest {
  id: number;
  incident_id: number;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  response_status?: number;
  response_headers?: Record<string, string>;
  response_body?: string;
  captured_at: string;
  is_masked: boolean;
}

export interface DetectionRule {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: Severity;
  confidence: number;
  matched_pattern?: string;
  matched_value?: string;
}

export interface Detection {
  id: number;
  incident_id?: number;
  run_id?: number;
  detection_type: string;
  rule_id: string;
  rule_name: string;
  severity: Severity;
  confidence: number;
  description: string;
  target_id: number;
  target_name: string;
  source_ip?: string;
  endpoint?: string;
  timestamp: string;
  raw_evidence?: Record<string, unknown>;
}

export type IncidentStatus =
  | 'open'
  | 'investigating'
  | 'pending_patch'
  | 'patch_approved'
  | 'patch_applied'
  | 'resolved'
  | 'false_positive'
  | 'closed';

export interface RAGDocument {
  id: string;
  source: string;
  collection: string;
  relevance_score: number;
  excerpt: string;
}

export interface GeminiAnalysis {
  summary: string;
  attack_classification: string;
  false_positive_considerations: string;
  recommended_actions: string[];
  confidence_level: 'high' | 'medium' | 'low';
  analysis_timestamp: string;
  model_used: string;
}

export interface Incident {
  id: number;
  title: string;
  description: string;
  severity: Severity;
  status: IncidentStatus;
  category: string;
  risk_score: number;
  target_id: number;
  target_name: string;
  run_id?: number;
  detection_id?: number;
  assigned_to?: string;
  assigned_to_email?: string;
  gemini_analysis?: GeminiAnalysis;
  rag_sources?: RAGDocument[];
  captured_request?: CapturedRequest;
  detections?: Detection[];
  patch_proposal?: PatchProposal;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  resolution_notes?: string;
}

export type PatchStatus =
  | 'proposed'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'applied'
  | 'rolled_back'
  | 'validation_failed';

export interface ValidationRun {
  id: number;
  patch_id: number;
  status: 'pending' | 'running' | 'passed' | 'failed';
  steps_total: number;
  steps_passed: number;
  steps_failed: number;
  started_at: string;
  completed_at?: string;
  output?: string;
}

export interface PatchProposal {
  id: number;
  incident_id: number;
  incident_title: string;
  target_id: number;
  target_name: string;
  target_file: string;
  patch_diff: string;
  explanation: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  status: PatchStatus;
  approved_by?: string;
  approval_notes?: string;
  applied_at?: string;
  rollback_at?: string;
  validation_plan?: string;
  validation_runs?: ValidationRun[];
  created_at: string;
  updated_at: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  source: string;
  collection: string;
  tags: string[];
  chunk_count: number;
  ingested_at: string;
  ingested_by: string;
}

export interface KnowledgeSearchResult {
  document_id: string;
  source: string;
  collection: string;
  excerpt: string;
  relevance_score: number;
  metadata: Record<string, unknown>;
}

export interface CollectionStats {
  name: string;
  document_count: number;
  chunk_count: number;
  last_updated?: string;
}

export interface KnowledgeStatistics {
  total_documents: number;
  total_chunks: number;
  collections: CollectionStats[];
}

export type AuditEventType =
  | 'user_login'
  | 'user_logout'
  | 'user_created'
  | 'user_updated'
  | 'target_created'
  | 'target_authorized'
  | 'run_started'
  | 'run_stopped'
  | 'incident_created'
  | 'incident_updated'
  | 'incident_assigned'
  | 'patch_proposed'
  | 'patch_approved'
  | 'patch_rejected'
  | 'patch_applied'
  | 'patch_rolled_back'
  | 'report_generated'
  | 'knowledge_ingested';

export interface AuditEvent {
  id: number;
  event_type: AuditEventType;
  actor_email: string;
  actor_id: number;
  target_resource: string;
  target_resource_id?: string;
  description: string;
  ip_address?: string;
  event_hash: string;
  previous_hash?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface TimelineDataPoint {
  timestamp: string;
  hour: string;
  incidents: number;
  detections: number;
  critical: number;
}

export interface SeverityDistribution {
  severity: Severity;
  count: number;
  percentage: number;
}

export interface AttackCategory {
  category: string;
  count: number;
}

export interface DashboardSummary {
  active_incidents: number;
  critical_incidents: number;
  attacks_today: number;
  red_team_runs_active: number;
  red_team_runs_total: number;
  patches_pending: number;
  patches_validated: number;
  mean_detection_time_minutes: number;
  mean_remediation_time_hours: number;
  chromadb_doc_count: number;
  gemini_status: 'available' | 'degraded' | 'unavailable';
  gemini_model: string;
  timeline: TimelineDataPoint[];
  severity_distribution: SeverityDistribution[];
  top_attack_categories: AttackCategory[];
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  response_time_ms?: number;
  last_event?: string;
  version?: string;
  details?: string;
}

export interface SystemHealth {
  overall_status: 'healthy' | 'degraded' | 'critical';
  services: ServiceHealth[];
  checked_at: string;
}

export type WSEventType =
  | 'incident_created'
  | 'incident_updated'
  | 'detection_fired'
  | 'run_started'
  | 'run_completed'
  | 'run_stopped'
  | 'finding_discovered'
  | 'patch_proposed'
  | 'patch_applied'
  | 'system_alert'
  | 'heartbeat';

export interface WSEvent<T = unknown> {
  event_type: WSEventType;
  timestamp: string;
  data: T;
  severity?: Severity;
}

export interface Report {
  id: number;
  title: string;
  report_type: 'executive' | 'technical' | 'compliance';
  target_id?: number;
  target_name?: string;
  date_from: string;
  date_to: string;
  status: 'generating' | 'ready' | 'failed';
  file_url?: string;
  generated_by: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface ApiError {
  detail: string;
  code?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
