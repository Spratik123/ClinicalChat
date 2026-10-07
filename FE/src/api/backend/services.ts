import { api } from '@/api/client';
import type {
  AccessLogResponse,
  AssignFindingRequest,
  AuditConfigResponse,
  AuditConfigSetupResponse,
  AuditConfigVersionResponse,
  AuditRunResponse,
  AuditScheduleResponse,
  BackendRoleCode,
  BackendRunStatus,
  BackendUserStatus,
  ChangePasswordRequest,
  ConfirmForgotPasswordRequest,
  CreateAuditConfigRequest,
  CreateAuditConfigVersionRequest,
  CreateAuditScheduleRequest,
  CreateIngestionScheduleRequest,
  CreateUserRequest,
  CurrentUserResponse,
  DashboardSummaryResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  FindingResponse,
  FindingWithReviewsResponse,
  HealthResponse,
  IngestionRunResponse,
  IngestionScheduleResponse,
  ListAuditRunsResponse,
  ListFindingsParams,
  ListFindingsResponse,
  LoginRequest,
  LoginResponse,
  NewPasswordChallengeRequest,
  ParityResponse,
  PermissionResponse,
  PullWindowRequest,
  ReduceRunFindingsResponse,
  ReviewFindingRequest,
  RoleAssignmentHistoryResponse,
  RoleResponse,
  RunDashboardResponse,
  ScreenAuditRunRequest,
  ScreenAuditRunResponse,
  SetUserRoleRequest,
  TriggerAuditRunRequest,
  TriggerAuditRunResponse,
  TurnDiagnosisResponse,
  UpdateAuditConfigRequest,
  UpdateFindingRequest,
  UpdateUserRequest,
  UserListResponse,
  UserResponse,
} from './types';

/**
 * One function per backend operation, grouped like the API's own modules.
 * Paths are relative to the `/python` prefix, which the client's base URL
 * (or the dev proxy) supplies.
 */

const enc = (value: string | number) => encodeURIComponent(String(value));

export const healthApi = {
  check: () => api.get<HealthResponse>('/health'),
};

export const authApi = {
  login: (body: LoginRequest) => api.post<LoginResponse>('/auth/login', body),
  completeNewPassword: (body: NewPasswordChallengeRequest) =>
    api.post<LoginResponse>('/auth/challenge/new-password', body),
  logout: () => api.post<void>('/auth/logout'),
  /** Always 202 with the same body, so it cannot be used to probe which emails have accounts. */
  forgotPassword: (body: ForgotPasswordRequest) => api.post<ForgotPasswordResponse>('/auth/forgot-password', body),
  /** 204 on success (no tokens — the user then signs in); every failure is the same 400. */
  confirmForgotPassword: (body: ConfirmForgotPasswordRequest) =>
    api.post<void>('/auth/forgot-password/confirm', body),
};

export const meApi = {
  get: () => api.get<CurrentUserResponse>('/me'),
  update: (body: UpdateUserRequest) => api.patch<CurrentUserResponse>('/me', body),
  changePassword: (body: ChangePasswordRequest) => api.post<void>('/me/change-password', body),
};

export const adminUsersApi = {
  list: (params: { status?: BackendUserStatus; role_code?: BackendRoleCode; limit?: number; cursor?: string } = {}) =>
    api.get<UserListResponse>('/admin/users', { query: params }),
  create: (body: CreateUserRequest) => api.post<UserResponse>('/admin/users', body),
  get: (userId: number | string) => api.get<UserResponse>(`/admin/users/${enc(userId)}`),
  update: (userId: number | string, body: UpdateUserRequest) =>
    api.patch<UserResponse>(`/admin/users/${enc(userId)}`, body),
  deactivate: (userId: number | string) => api.post<UserResponse>(`/admin/users/${enc(userId)}/deactivate`),
  reactivate: (userId: number | string) => api.post<UserResponse>(`/admin/users/${enc(userId)}/reactivate`),
  resendInvite: (userId: number | string) => api.post<UserResponse>(`/admin/users/${enc(userId)}/resend-invite`),
  setRole: (userId: number | string, body: SetUserRoleRequest) =>
    api.put<UserResponse>(`/admin/users/${enc(userId)}/role`, body),
  roleHistory: (userId: number | string) =>
    api.get<RoleAssignmentHistoryResponse>(`/admin/users/${enc(userId)}/roles/history`),
  roles: (includeInactive = false) =>
    api.get<RoleResponse[]>('/admin/roles', { query: { include_inactive: includeInactive } }),
  permissions: () => api.get<PermissionResponse[]>('/admin/permissions'),
  accessLog: (params: { limit?: number; cursor?: string } = {}) =>
    api.get<AccessLogResponse>('/admin/access-log', { query: params }),
};

export const auditConfigApi = {
  list: () => api.get<AuditConfigResponse[]>('/audit-config'),
  create: (body: CreateAuditConfigRequest) => api.post<AuditConfigSetupResponse>('/audit-config', body),
  get: (configId: string) => api.get<AuditConfigResponse>(`/audit-config/${enc(configId)}`),
  update: (configId: string, body: UpdateAuditConfigRequest) =>
    api.patch<AuditConfigResponse>(`/audit-config/${enc(configId)}`, body),
  current: (configId: string) => api.get<AuditConfigVersionResponse>(`/audit-config/${enc(configId)}/current`),
  versions: (configId: string) => api.get<AuditConfigVersionResponse[]>(`/audit-config/${enc(configId)}/versions`),
  createVersion: (configId: string, body: CreateAuditConfigVersionRequest) =>
    api.post<AuditConfigVersionResponse>(`/audit-config/${enc(configId)}/versions`, body),
  version: (configId: string, versionNumber: number) =>
    api.get<AuditConfigVersionResponse>(`/audit-config/${enc(configId)}/versions/${enc(versionNumber)}`),
};

export const schedulesApi = {
  /** Audit schedules. NOTE: the backend's create route is `POST /admin/schedules/{schedule_id}`. */
  listAudit: () => api.get<AuditScheduleResponse[]>('/admin/schedules'),
  getAudit: (scheduleId: string) => api.get<AuditScheduleResponse>(`/admin/schedules/${enc(scheduleId)}`),
  createAudit: (scheduleId: string, body: CreateAuditScheduleRequest) =>
    api.post<AuditScheduleResponse>(`/admin/schedules/${enc(scheduleId)}`, body),

  listIngestion: () => api.get<IngestionScheduleResponse[]>('/admin/ingestion-schedules'),
  getIngestion: (id: string) => api.get<IngestionScheduleResponse>(`/admin/ingestion-schedules/${enc(id)}`),
  createIngestion: (id: string, body: CreateIngestionScheduleRequest) =>
    api.post<IngestionScheduleResponse>(`/admin/ingestion-schedules/${enc(id)}`, body),
};

export const ingestionApi = {
  pull: (body: PullWindowRequest) => api.post<IngestionRunResponse>('/ingestion/pull', body),
  runs: (params: { tenant_schema?: string; schedule_id?: string; limit?: number } = {}) =>
    api.get<IngestionRunResponse[]>('/ingestion/runs', { query: params }),
  run: (ingestionRunId: string) => api.get<IngestionRunResponse>(`/ingestion/runs/${enc(ingestionRunId)}`),
};

export const auditRunsApi = {
  trigger: (body: TriggerAuditRunRequest = {}) => api.post<TriggerAuditRunResponse>('/audit-runs', body),
  list: (params: { status?: BackendRunStatus; limit?: number } = {}) =>
    api.get<ListAuditRunsResponse>('/audit-runs', { query: params }),
  get: (runId: string) => api.get<AuditRunResponse>(`/audit-runs/${enc(runId)}`),
  retry: (runId: string) => api.post<TriggerAuditRunResponse>(`/audit-runs/${enc(runId)}/retry`),
  screen: (runId: string, body: ScreenAuditRunRequest = {}) =>
    api.post<ScreenAuditRunResponse>(`/audit-runs/${enc(runId)}/screen`, body),
};

export const findingsApi = {
  list: (params: ListFindingsParams = {}) => api.get<ListFindingsResponse>('/findings', { query: { ...params } }),
  get: (findingId: string) => api.get<FindingWithReviewsResponse>(`/findings/${enc(findingId)}`),
  update: (findingId: string, body: UpdateFindingRequest) =>
    api.patch<FindingResponse>(`/findings/${enc(findingId)}`, body),
  assign: (findingId: string, body: AssignFindingRequest) =>
    api.post<FindingResponse>(`/findings/${enc(findingId)}/assign`, body),
  review: (findingId: string, body: ReviewFindingRequest) =>
    api.post<FindingResponse>(`/findings/${enc(findingId)}/review`, body),
  parity: (runId: string, alsoRunId?: string) =>
    api.get<ParityResponse>(`/findings/${enc(runId)}/parity`, { query: { also_run_id: alsoRunId } }),
  diagnose: (runId: string, turnId: string) =>
    api.post<TurnDiagnosisResponse>(`/findings/${enc(runId)}/${enc(turnId)}/diagnose`),
  emit: (runId: string) => api.post<ReduceRunFindingsResponse>(`/findings/${enc(runId)}/emit`),
};

export const dashboardApi = {
  summary: () => api.get<DashboardSummaryResponse>('/dashboard/summary'),
  run: (runId: string) => api.get<RunDashboardResponse>(`/dashboard/runs/${enc(runId)}`),
};
