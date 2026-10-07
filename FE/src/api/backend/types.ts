/**
 * Wire types for the Python (FastAPI) audit backend, transcribed from its
 * OpenAPI document. These describe the server contract exactly — the UI's own
 * domain model lives in `@/types/domain` and is bridged by `./mappers`.
 */

export type BackendRoleCode = 'ADMIN' | 'CONTENT_REVIEWER' | 'DEVELOPER';
export type BackendUserStatus = 'invited' | 'active' | 'suspended' | 'inactive';
export type BackendRunStatus = 'queued' | 'running' | 'completed' | 'partial' | 'failed' | 'cancelled';
export type AccessLogEventType = 'USER_CREATED' | 'USER_DEACTIVATED' | 'ROLE_GRANTED' | 'ROLE_REVOKED';

type Nullable<T> = T | null;
type Dict = Record<string, unknown>;

/* ------------------------------ Health / auth ------------------------------ */

export interface HealthResponse {
  status: string;
  service: string;
  environment: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/** Either tokens (success) or a challenge (first login with a temporary password). */
export interface LoginResponse {
  access_token?: Nullable<string>;
  id_token?: Nullable<string>;
  refresh_token?: Nullable<string>;
  expires_in?: Nullable<number>;
  challenge_name?: Nullable<string>;
  challenge_session?: Nullable<string>;
}

export interface NewPasswordChallengeRequest {
  email: string;
  new_password: string;
  session: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

/** The generic acknowledgement the backend returns whether or not an account exists. */
export interface ForgotPasswordResponse {
  detail: string;
}

export interface ConfirmForgotPasswordRequest {
  email: string;
  code: string;
  new_password: string;
}

export interface ChangePasswordRequest {
  previous_password: string;
  new_password: string;
}

/* --------------------------------- Users ---------------------------------- */

export interface UserResponse {
  user_id: number;
  email?: Nullable<string>;
  username?: Nullable<string>;
  display_name?: Nullable<string>;
  status: BackendUserStatus;
  roles?: string[];
  last_login_at?: Nullable<string>;
  created_at?: Nullable<string>;
  deactivated_at?: Nullable<string>;
}

export interface CurrentUserResponse extends UserResponse {
  permissions?: string[];
}

export interface UserListResponse {
  items: UserResponse[];
  has_more: boolean;
  limit: number;
  next_cursor?: Nullable<string>;
}

export interface CreateUserRequest {
  email: string;
  role_code: BackendRoleCode;
  display_name?: Nullable<string>;
}

export interface UpdateUserRequest {
  display_name?: Nullable<string>;
}

export interface SetUserRoleRequest {
  role_code: BackendRoleCode;
}

export interface RoleAssignmentResponse {
  role_code: string;
  assigned_at?: Nullable<string>;
  assigned_by?: Nullable<number>;
  revoked_at?: Nullable<string>;
  revoked_by?: Nullable<number>;
}

export interface RoleAssignmentHistoryResponse {
  user_id: number;
  assignments: RoleAssignmentResponse[];
}

export interface RoleResponse {
  role_id: number;
  code: string;
  name: string;
  cognito_group: string;
  description?: Nullable<string>;
  is_active: boolean;
}

export interface PermissionResponse {
  permission_id: number;
  code: string;
  permission_name: string;
  description?: Nullable<string>;
}

export interface AccessLogEntryResponse {
  event_type: AccessLogEventType;
  occurred_at?: Nullable<string>;
  subject_user_id: number;
  actor_user_id?: Nullable<number>;
  role_code?: Nullable<string>;
}

export interface AccessLogResponse {
  items: AccessLogEntryResponse[];
  has_more: boolean;
  limit: number;
  next_cursor?: Nullable<string>;
}

/* ----------------------------- Audit configuration ----------------------------- */

export interface AuditConfigResponse {
  config_id: string;
  name: string;
  description?: Nullable<string>;
  created_at?: Nullable<string>;
  version_count?: Nullable<number>;
  current_version_number?: Nullable<number>;
}

/** Tunable per-version settings, shared by "create config" and "create version". */
export interface AuditConfigVersionFields {
  model_id_phase1: string;
  model_id_phase2: string;
  prompt_version?: string;
  temperature?: number;
  max_tokens?: number;
  batch_size?: number;
  max_tool_iterations?: number;
  stage2_dispatch_mode?: string;
  lane_models?: Dict;
  lane_cost_estimates?: Dict;
  lane_max_tokens?: Dict;
  thresholds?: Dict;
  cost_caps?: Record<string, number | string>;
  price_table?: Dict;
}

export interface CreateAuditConfigRequest extends AuditConfigVersionFields {
  name: string;
  description?: Nullable<string>;
}

export type CreateAuditConfigVersionRequest = AuditConfigVersionFields;

export interface UpdateAuditConfigRequest {
  name: string;
  description?: Nullable<string>;
}

export interface AuditConfigVersionResponse {
  config_version_id: string;
  config_id: string;
  version_number: number;
  model_id_phase1: string;
  model_id_phase2: string;
  prompt_version: string;
  temperature: number;
  max_tokens: number;
  batch_size: number;
  max_tool_iterations: number;
  stage2_dispatch_mode: string;
  lane_models?: Dict;
  lane_cost_estimates?: Dict;
  lane_max_tokens?: Dict;
  thresholds: Dict;
  cost_caps: Dict;
  price_table: Dict;
}

export interface AuditConfigSetupResponse extends AuditConfigResponse {
  version: AuditConfigVersionResponse;
}

/* --------------------------------- Schedules --------------------------------- */

export interface AuditScheduleResponse {
  schedule_id: string;
  config_id: string;
  cron_expression: string;
  lookback_hours: number;
  library_id?: Nullable<string>;
  last_window_end?: Nullable<string>;
  is_enabled: boolean;
  tenant_schema: string;
  ingestion_lag_minutes: number;
  min_window_minutes: number;
}

export interface CreateAuditScheduleRequest {
  config_id: string;
  cron_expression: string;
  lookback_hours?: number;
  library_id?: Nullable<string>;
  is_enabled?: boolean;
  tenant_schema?: string;
  ingestion_lag_minutes?: number;
  min_window_minutes?: number;
}

export interface IngestionScheduleResponse {
  ingestion_schedule_id: string;
  tenant_schema: string;
  cron_expression: string;
  lookback_hours: number;
  library_id?: Nullable<string>;
  last_ingested_until?: Nullable<string>;
  is_enabled: boolean;
  source_lag_minutes: number;
  max_window_hours: number;
}

export interface CreateIngestionScheduleRequest {
  tenant_schema: string;
  cron_expression: string;
  lookback_hours?: number;
  library_id?: Nullable<string>;
  is_enabled?: boolean;
  source_lag_minutes?: number;
  max_window_hours?: number;
}

/* --------------------------------- Ingestion --------------------------------- */

export interface PullWindowRequest {
  tenant_schema: string;
  since: string;
  until: string;
  library_id?: Nullable<string>;
  force?: boolean;
}

export interface IngestionRunResponse {
  ingestion_run_id: string;
  tenant_schema: string;
  window_since: string;
  window_until: string;
  trigger_type: string;
  status: string;
  schedule_id?: Nullable<string>;
  library_id?: Nullable<string>;
  library_snapshot_id?: Nullable<string>;
  library_snapshot_created?: boolean;
  pages: number;
  stored: number;
  already_present: number;
  quarantined: number;
  started_at?: Nullable<string>;
  completed_at?: Nullable<string>;
  error_code?: Nullable<string>;
}

/* --------------------------------- Audit runs --------------------------------- */

export interface TriggerAuditRunRequest {
  schedule_id?: Nullable<string>;
  window_since?: Nullable<string>;
  window_until?: Nullable<string>;
  tenant_name?: Nullable<string>;
  config_id?: Nullable<string>;
  config_version_number?: Nullable<number>;
  library_id?: Nullable<string>;
  flows?: string[];
  finding_types?: string[];
  max_batches?: Nullable<number>;
  library_snapshot_id?: Nullable<string>;
  snapshot_policy?: string;
  note?: Nullable<string>;
}

export interface AuditRunResponse {
  run_id: string;
  run_key: string;
  status: BackendRunStatus;
  window_since: string;
  window_until: string;
  config_id: string;
  config_version_number: number;
  tenant_schema: string;
  library_id?: Nullable<string>;
  library_snapshot_id?: Nullable<string>;
  retry_of_run_id?: Nullable<string>;
  counts?: Record<string, number>;
}

export interface TriggerAuditRunResponse extends AuditRunResponse {
  turns_in_scope: number;
  safety_manifest_uri: string;
  standard_manifest_uri: string;
}

export interface ListAuditRunsResponse {
  runs: AuditRunResponse[];
}

export interface ScreenAuditRunRequest {
  schedule_id?: Nullable<string>;
}

export interface ScreenAuditRunResponse {
  run_id: string;
  status: BackendRunStatus;
  safety_screened: number;
  safety_failed: number;
  standard_screened: number;
  standard_failed: number;
}

/* ---------------------------------- Findings ---------------------------------- */

export interface AuditScoreResponse {
  accuracy_1_to_5?: Nullable<number>;
  answers_actual_question?: Nullable<boolean>;
  flow_correct?: Nullable<boolean>;
  response_matches_intent?: Nullable<boolean>;
  escalation_correct?: Nullable<boolean>;
}

export interface FindingResponse {
  finding_id: string;
  audit_run_id: string;
  audit_turn_id: string;
  evaluation_id: string;
  finding_type: string;
  severity: string;
  status: string;
  title: string;
  summary: string;
  content_snapshot_note: string;
  user_message?: Nullable<string>;
  bot_text?: Nullable<string>;
  owner_hint?: Nullable<string>;
  root_cause?: Nullable<string>;
  recommended_action?: Nullable<string>;
  confidence?: Nullable<number>;
  safety_related: boolean;
  is_false_positive: boolean;
  scores?: Nullable<AuditScoreResponse>;
  assigned_to_user_id?: Nullable<number>;
  resolved_at?: Nullable<string>;
  /** Optimistic-concurrency token — echo it back as `expected_version` on writes. */
  version: number;
}

export interface FindingReviewResponse {
  reviewer_user_id: number;
  agree: boolean;
  is_false_positive: boolean;
  original_finding_type?: Nullable<string>;
  original_severity?: Nullable<string>;
  corrected_finding_type?: Nullable<string>;
  corrected_severity?: Nullable<string>;
  corrected_owner_hint?: Nullable<string>;
  comment?: Nullable<string>;
  created_at?: Nullable<string>;
}

export interface FindingWithReviewsResponse {
  finding: FindingResponse;
  reviews: FindingReviewResponse[];
}

export interface ListFindingsResponse {
  findings: FindingResponse[];
}

export interface ListFindingsParams {
  run_id?: string;
  status?: string;
  severity?: string;
}

export interface UpdateFindingRequest {
  expected_version: number;
  recommended_action?: Nullable<string>;
  root_cause?: Nullable<string>;
}

export interface AssignFindingRequest {
  assignee_user_id: number;
  expected_version: number;
}

export interface ReviewFindingRequest {
  agree: boolean;
  expected_version: number;
  is_false_positive?: boolean;
  corrected_finding_type?: Nullable<string>;
  corrected_severity?: Nullable<string>;
  corrected_owner_hint?: Nullable<string>;
  comment?: Nullable<string>;
}

export interface LaneOutcomeResponse {
  lane: string;
  reason: string;
}

export interface LaneExecutionResponse {
  lane: string;
  model_id: string;
  prompt_version: string;
  tokens_in: number;
  tokens_out: number;
  cost_usd: string;
  latency_ms: number;
}

export interface TurnDiagnosisResponse {
  status: string;
  proposed_finding_type?: Nullable<string>;
  proposed_severity?: Nullable<string>;
  proposed_owner_hint?: Nullable<string>;
  proposed_recommendation?: Nullable<string>;
  rationale?: Nullable<string>;
  deciding_lane?: Nullable<string>;
  lanes_run?: string[];
  lanes_shed?: LaneOutcomeResponse[];
  lanes_failed?: LaneOutcomeResponse[];
  lane_executions?: LaneExecutionResponse[];
  total_cost_usd: string;
  per_message_cap_breached: boolean;
  is_degraded: boolean;
  error?: Nullable<string>;
}

export interface ReduceRunFindingsResponse {
  run_id: string;
  turns_audited: number;
  turns_flagged: number;
  counts_by_type: Record<string, number>;
  finding_ids: string[];
  findings_output_uri: string;
}

/** Audit-vs-human agreement. The OpenAPI document declares this as a bare `object`. */
export type ParityResponse = Record<string, unknown>;

/* --------------------------------- Dashboard --------------------------------- */

export interface TrendResponse {
  tenant_schema: string;
  finding_type: string;
  pattern: string;
  count: number;
  example_turn_ids: string[];
  first_seen_run_id?: Nullable<string>;
  last_seen_run_id?: Nullable<string>;
  updated_at?: Nullable<string>;
}

export interface DashboardSummaryResponse {
  open_findings_total: number;
  open_by_status: Record<string, number>;
  open_by_severity: Record<string, number>;
  trends: TrendResponse[];
}

export interface RunDashboardResponse {
  run_id: string;
  status: string;
  /** Decimal string, e.g. "12.3400". */
  spent_usd: string;
  findings_total: number;
  findings_by_type: Record<string, number>;
  findings_by_severity: Record<string, number>;
  turns_total: number;
  turns_by_status: Record<string, number>;
}
