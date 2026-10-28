export interface MetricSummary {
  candidates_tracked: number;
  open_alerts: number;
  critical_alerts: number;
  high_alerts: number;
  pending_drafts: number;
  approved_drafts: number;
}

export interface Candidate {
  id: string;
  external_id: string;
  name: string;
  email: string;
  job_title: string;
  stage: string;
  stage_entered_at: string;
  last_activity_at?: string;
  recruiter?: string;
  created_at: string;
}

export interface AlertItem {
  id: string;
  candidate_id: string;
  candidate_name?: string;
  candidate_email?: string;
  job_title?: string;
  stage: string;
  days_in_stage: number;
  severity: "critical" | "high" | "medium" | "low";
  reason: string;
  status: "open" | "resolved";
  recruiter?: string;
  created_at: string;
}

export interface FollowupAction {
  id: string;
  candidate_id: string;
  alert_id?: string;
  action_type: string;
  draft: string;
  status: "draft" | "approved" | "rejected";
  created_at: string;
  approved_at?: string;
}

export interface SLARule {
  stage: string;
  max_days: number;
}

export interface AuditRecord {
  id: string;
  actor: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: string;
  timestamp: string;
}

export interface ImportResponse {
  filename: string;
  imported_rows: number;
  error_count: number;
  errors: Array<{ row: number; error: string }>;
}
