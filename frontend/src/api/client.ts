import type {
  AuthResponse,
  LoginCredentials,
  User,
  Target,
  TargetType,
  RedTeamRun,
  AttackProfile,
  Finding,
  Detection,
  Incident,
  IncidentStatus,
  PatchProposal,
  KnowledgeStatistics,
  KnowledgeSearchResult,
  KnowledgeDocument,
  DashboardSummary,
  SystemHealth,
  Report,
  AuditEvent,
  PaginatedResponse,
} from '../types';

// ============================================================
// API Client — Typed fetch wrapper with auth injection
// ============================================================

const API_BASE = '/api/v1';
const TOKEN_KEY = 'janus_access_token';

class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
    public code?: string
  ) {
    super(detail);
    this.name = 'ApiError';
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...options,
  });

  if (response.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('janus_user');
    window.location.href = '/login';
    throw new ApiError(401, 'Unauthorized');
  }

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    let code: string | undefined;
    try {
      const errData = await response.json();
      detail = errData.detail ?? detail;
      code = errData.code;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(response.status, detail, code);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json() as Promise<T>;
}

async function downloadRequest(path: string): Promise<Blob> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, { headers });
  if (!response.ok) throw new ApiError(response.status, `Download failed`);
  return response.blob();
}

const get = <T>(path: string) => request<T>('GET', path);
const post = <T>(path: string, body?: unknown) => request<T>('POST', path, body);
const put = <T>(path: string, body?: unknown) => request<T>('PUT', path, body);
const patch = <T>(path: string, body?: unknown) => request<T>('PATCH', path, body);
const del = <T>(path: string) => request<T>('DELETE', path);

// ============================================================
// AUTH
// ============================================================
export const auth = {
  login: (creds: LoginCredentials): Promise<AuthResponse> =>
    post<AuthResponse>('/auth/login', creds),

  register: (data: {
    email: string;
    password: string;
    full_name: string;
    role?: string;
  }): Promise<User> => post<User>('/auth/register', data),

  me: (): Promise<User> => get<User>('/auth/me'),

  logout: (): Promise<void> => post<void>('/auth/logout'),
};

// ============================================================
// TARGETS
// ============================================================
export interface CreateTargetPayload {
  name: string;
  base_url: string;
  target_type: TargetType;
  owner_name: string;
  scope_description: string;
  allowed_hostnames: string[];
  authorization_confirmed: boolean;
}

export const targets = {
  list: (params?: { is_active?: boolean; skip?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.is_active !== undefined) q.set('is_active', String(params.is_active));
    if (params?.skip !== undefined) q.set('skip', String(params.skip));
    if (params?.limit !== undefined) q.set('limit', String(params.limit));
    return get<Target[]>(`/targets?${q}`);
  },

  create: (data: CreateTargetPayload): Promise<Target> =>
    post<Target>('/targets', data),

  get: (id: number): Promise<Target> => get<Target>(`/targets/${id}`),

  update: (id: number, data: Partial<CreateTargetPayload>): Promise<Target> =>
    put<Target>(`/targets/${id}`, data),

  authorize: (id: number): Promise<Target> =>
    post<Target>(`/targets/${id}/authorize`),

  deactivate: (id: number): Promise<Target> =>
    post<Target>(`/targets/${id}/deactivate`),
};

// ============================================================
// RED TEAM
// ============================================================
export interface StartRunPayload {
  target_id: number;
  profile: AttackProfile;
  max_requests?: number;
  timeout_seconds?: number;
}

export const redTeam = {
  startRun: (data: StartRunPayload): Promise<RedTeamRun> =>
    post<RedTeamRun>('/red-team/runs', data),

  listRuns: (params?: {
    target_id?: number;
    status?: string;
    skip?: number;
    limit?: number;
  }): Promise<RedTeamRun[]> => {
    const q = new URLSearchParams();
    if (params?.target_id) q.set('target_id', String(params.target_id));
    if (params?.status) q.set('status', params.status);
    if (params?.skip !== undefined) q.set('skip', String(params.skip));
    if (params?.limit !== undefined) q.set('limit', String(params.limit));
    return get<RedTeamRun[]>(`/red-team/runs?${q}`);
  },

  getRun: (id: number): Promise<RedTeamRun> =>
    get<RedTeamRun>(`/red-team/runs/${id}`),

  stopRun: (id: number): Promise<RedTeamRun> =>
    post<RedTeamRun>(`/red-team/runs/${id}/stop`),

  getFindings: (
    runId: number,
    params?: { severity?: string; skip?: number; limit?: number }
  ): Promise<Finding[]> => {
    const q = new URLSearchParams();
    if (params?.severity) q.set('severity', params.severity);
    if (params?.skip !== undefined) q.set('skip', String(params.skip));
    if (params?.limit !== undefined) q.set('limit', String(params.limit));
    return get<Finding[]>(`/red-team/runs/${runId}/findings?${q}`);
  },
};

// ============================================================
// EVENTS & DETECTIONS
// ============================================================
export const events = {
  listEvents: (params?: {
    target_id?: number;
    event_type?: string;
    skip?: number;
    limit?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.target_id) q.set('target_id', String(params.target_id));
    if (params?.event_type) q.set('event_type', params.event_type);
    if (params?.skip !== undefined) q.set('skip', String(params.skip));
    if (params?.limit !== undefined) q.set('limit', String(params.limit));
    return get<Detection[]>(`/events?${q}`);
  },

  listDetections: (params?: {
    severity?: string;
    detection_type?: string;
    target_id?: number;
    skip?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Detection>> => {
    const q = new URLSearchParams();
    if (params?.severity) q.set('severity', params.severity);
    if (params?.detection_type) q.set('detection_type', params.detection_type);
    if (params?.target_id) q.set('target_id', String(params.target_id));
    if (params?.skip !== undefined) q.set('skip', String(params.skip));
    if (params?.limit !== undefined) q.set('limit', String(params.limit));
    return get<PaginatedResponse<Detection>>(`/detections?${q}`);
  },

  getDetection: (id: number): Promise<Detection> =>
    get<Detection>(`/detections/${id}`),
};

// ============================================================
// INCIDENTS
// ============================================================
export const incidents = {
  listIncidents: (params?: {
    status?: IncidentStatus;
    severity?: string;
    category?: string;
    target_id?: number;
    assigned_to?: string;
    skip?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Incident>> => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.severity) q.set('severity', params.severity);
    if (params?.category) q.set('category', params.category);
    if (params?.target_id) q.set('target_id', String(params.target_id));
    if (params?.assigned_to) q.set('assigned_to', params.assigned_to);
    if (params?.skip !== undefined) q.set('skip', String(params.skip));
    if (params?.limit !== undefined) q.set('limit', String(params.limit));
    return get<PaginatedResponse<Incident>>(`/incidents?${q}`);
  },

  getIncident: (id: number): Promise<Incident> =>
    get<Incident>(`/incidents/${id}`),

  updateIncident: (
    id: number,
    data: { status?: IncidentStatus; resolution_notes?: string }
  ): Promise<Incident> => patch<Incident>(`/incidents/${id}`, data),

  assignIncident: (id: number, assignee_email: string): Promise<Incident> =>
    post<Incident>(`/incidents/${id}/assign`, { assignee_email }),

  reanalyze: (id: number): Promise<Incident> =>
    post<Incident>(`/incidents/${id}/reanalyze`),

  resolve: (id: number, notes: string): Promise<Incident> =>
    post<Incident>(`/incidents/${id}/resolve`, { resolution_notes: notes }),
};

// ============================================================
// PATCHES
// ============================================================
export const patches = {
  listPatches: (params?: {
    status?: string;
    risk_level?: string;
    target_id?: number;
    skip?: number;
    limit?: number;
  }): Promise<PaginatedResponse<PatchProposal>> => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.risk_level) q.set('risk_level', params.risk_level);
    if (params?.target_id) q.set('target_id', String(params.target_id));
    if (params?.skip !== undefined) q.set('skip', String(params.skip));
    if (params?.limit !== undefined) q.set('limit', String(params.limit));
    return get<PaginatedResponse<PatchProposal>>(`/patches?${q}`);
  },

  getPatch: (id: number): Promise<PatchProposal> =>
    get<PatchProposal>(`/patches/${id}`),

  approve: (id: number, notes?: string): Promise<PatchProposal> =>
    post<PatchProposal>(`/patches/${id}/approve`, { notes }),

  reject: (id: number, reason: string): Promise<PatchProposal> =>
    post<PatchProposal>(`/patches/${id}/reject`, { reason }),

  apply: (id: number): Promise<PatchProposal> =>
    post<PatchProposal>(`/patches/${id}/apply`),

  rollback: (id: number): Promise<PatchProposal> =>
    post<PatchProposal>(`/patches/${id}/rollback`),
};

// ============================================================
// KNOWLEDGE BASE
// ============================================================
export const knowledge = {
  statistics: (): Promise<KnowledgeStatistics> =>
    get<KnowledgeStatistics>('/knowledge/statistics'),

  ingest: (data: {
    content: string;
    source: string;
    collection: string;
    tags?: string[];
  }): Promise<KnowledgeDocument> =>
    post<KnowledgeDocument>('/knowledge/ingest', data),

  search: (data: {
    query: string;
    collection?: string;
    top_k?: number;
    min_score?: number;
  }): Promise<KnowledgeSearchResult[]> =>
    post<KnowledgeSearchResult[]>('/knowledge/search', data),
};

// ============================================================
// DASHBOARD
// ============================================================
export const dashboard = {
  summary: (): Promise<DashboardSummary> =>
    get<DashboardSummary>('/dashboard/summary'),

  timeline: (hours?: number): Promise<DashboardSummary['timeline']> => {
    const q = hours ? `?hours=${hours}` : '';
    return get(`/dashboard/timeline${q}`);
  },

  severityDistribution: (): Promise<DashboardSummary['severity_distribution']> =>
    get('/dashboard/severity-distribution'),

  topAttackTypes: (limit?: number): Promise<DashboardSummary['top_attack_categories']> => {
    const q = limit ? `?limit=${limit}` : '';
    return get(`/dashboard/top-attack-categories${q}`);
  },

  systemHealth: (): Promise<SystemHealth> =>
    get<SystemHealth>('/dashboard/health'),
};

// ============================================================
// REPORTS
// ============================================================
export interface CreateReportPayload {
  title: string;
  report_type: 'executive' | 'technical' | 'compliance';
  target_id?: number;
  date_from: string;
  date_to: string;
}

export const reports = {
  create: (data: CreateReportPayload): Promise<Report> =>
    post<Report>('/reports', data),

  list: (params?: { skip?: number; limit?: number }): Promise<PaginatedResponse<Report>> => {
    const q = new URLSearchParams();
    if (params?.skip !== undefined) q.set('skip', String(params.skip));
    if (params?.limit !== undefined) q.set('limit', String(params.limit));
    return get<PaginatedResponse<Report>>(`/reports?${q}`);
  },

  get: (id: number): Promise<Report> => get<Report>(`/reports/${id}`),

  download: (id: number): Promise<Blob> => downloadRequest(`/reports/${id}/download`),
};

// ============================================================
// AUDIT
// ============================================================
export const auditApi = {
  listEvents: (params?: {
    event_type?: string;
    actor_email?: string;
    skip?: number;
    limit?: number;
  }): Promise<PaginatedResponse<AuditEvent>> => {
    const q = new URLSearchParams();
    if (params?.event_type) q.set('event_type', params.event_type);
    if (params?.actor_email) q.set('actor_email', params.actor_email);
    if (params?.skip !== undefined) q.set('skip', String(params.skip));
    if (params?.limit !== undefined) q.set('limit', String(params.limit));
    return get<PaginatedResponse<AuditEvent>>(`/audit?${q}`);
  },

  verifyChain: (): Promise<{ valid: boolean; total_events: number; first_invalid_id?: number }> =>
    get('/audit/verify-chain'),
};

// ============================================================
// USER MANAGEMENT
// ============================================================
export const usersApi = {
  list: (params?: { skip?: number; limit?: number }): Promise<User[]> => {
    const q = new URLSearchParams();
    if (params?.skip !== undefined) q.set('skip', String(params.skip));
    if (params?.limit !== undefined) q.set('limit', String(params.limit));
    return get<User[]>(`/users?${q}`);
  },

  create: (data: {
    email: string;
    password: string;
    full_name: string;
    role: string;
  }): Promise<User> => post<User>('/users', data),

  update: (id: number, data: Partial<User>): Promise<User> =>
    put<User>(`/users/${id}`, data),

  deactivate: (id: number): Promise<User> =>
    post<User>(`/users/${id}/deactivate`),
};

// ============================================================
// SETTINGS
// ============================================================
export interface AppSettings {
  gemini_model: string;
  gemini_available: boolean;
  max_concurrent_runs: number;
  default_attack_profile: string;
  data_retention_days: number;
  version: string;
}

export const settingsApi = {
  get: (): Promise<AppSettings> => get<AppSettings>('/settings'),
};

export { ApiError };
