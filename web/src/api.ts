import { AlertItem, AuditRecord, Candidate, FollowupAction, ImportResponse, MetricSummary, SLARule } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "dev-stall-alerter-secret-key-32chars-min";

const defaultHeaders = {
  "X-API-Key": API_KEY,
};

export async function fetchMetrics(): Promise<MetricSummary> {
  const res = await fetch(`${API_BASE}/api/metrics`, { headers: defaultHeaders, cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch operational metrics");
  return res.json();
}

export async function fetchAlerts(statusFilter = "open", severity = ""): Promise<AlertItem[]> {
  let url = `${API_BASE}/api/alerts?status_filter=${statusFilter}`;
  if (severity) url += `&severity=${encodeURIComponent(severity)}`;
  const res = await fetch(url, { headers: defaultHeaders, cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch pipeline alerts");
  return res.json();
}

export async function triggerScan(): Promise<{ status: string; new_alerts: number; resolved_alerts: number }> {
  const res = await fetch(`${API_BASE}/api/alerts/scan`, {
    method: "POST",
    headers: defaultHeaders,
  });
  if (!res.ok) throw new Error("Failed to execute stall scan");
  return res.json();
}

export async function fetchCandidates(search = ""): Promise<Candidate[]> {
  let url = `${API_BASE}/api/candidates`;
  if (search) url += `?search=${encodeURIComponent(search)}`;
  const res = await fetch(url, { headers: defaultHeaders, cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch candidates");
  return res.json();
}

export async function createDraft(alertId: string): Promise<FollowupAction> {
  const res = await fetch(`${API_BASE}/api/alerts/${alertId}/draft`, {
    method: "POST",
    headers: defaultHeaders,
  });
  if (!res.ok) throw new Error("Failed to generate follow-up draft");
  return res.json();
}

export async function fetchActions(): Promise<FollowupAction[]> {
  const res = await fetch(`${API_BASE}/api/actions`, { headers: defaultHeaders, cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch action drafts");
  return res.json();
}

export async function submitApprovalDecision(
  actionId: string,
  decision: "approved" | "rejected",
  reviewer = "talent_lead",
  editedDraft?: string,
  nextStage?: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/actions/${actionId}/approval`, {
    method: "POST",
    headers: { ...defaultHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      decision,
      reviewer,
      edited_draft: editedDraft,
      next_stage: nextStage || null
    }),
  });
  if (!res.ok) throw new Error("Failed to submit approval decision");
}

export async function updateCandidateStage(
  candidateId: string,
  stage: string,
  reviewer = "talent_lead"
): Promise<{ candidate_id: string; message: string }> {
  const res = await fetch(`${API_BASE}/api/candidates/${candidateId}/stage`, {
    method: "PATCH",
    headers: { ...defaultHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ stage, reviewer }),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({ detail: "Failed to update stage" }));
    throw new Error(errorJson.detail || "Failed to update candidate stage");
  }
  return res.json();
}

export async function deleteCandidate(candidateId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/candidates/${candidateId}`, {
    method: "DELETE",
    headers: defaultHeaders,
  });
  if (!res.ok) throw new Error("Failed to delete candidate");
}

export async function bulkDeleteCandidates(ids: string[]): Promise<void> {
  const res = await fetch(`${API_BASE}/api/candidates/bulk-delete`, {
    method: "POST",
    headers: { ...defaultHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error("Failed to bulk delete candidates");
}

export async function deleteAlert(alertId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/alerts/${alertId}`, {
    method: "DELETE",
    headers: defaultHeaders,
  });
  if (!res.ok) throw new Error("Failed to delete alert");
}

export async function bulkDeleteAlerts(ids: string[]): Promise<void> {
  const res = await fetch(`${API_BASE}/api/alerts/bulk-delete`, {
    method: "POST",
    headers: { ...defaultHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error("Failed to bulk delete alerts");
}

export async function deleteRule(stage: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/rules/${encodeURIComponent(stage)}`, {
    method: "DELETE",
    headers: defaultHeaders,
  });
  if (!res.ok) throw new Error("Failed to delete stage SLA rule");
}

export async function clearAuditLogs(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/audit-events/clear`, {
    method: "DELETE",
    headers: defaultHeaders,
  });
  if (!res.ok) throw new Error("Failed to clear audit logs");
}

export async function fetchRules(): Promise<SLARule[]> {
  const res = await fetch(`${API_BASE}/api/rules`, { headers: defaultHeaders, cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch stage SLA rules");
  return res.json();
}

export async function updateRule(stage: string, max_days: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/rules`, {
    method: "PUT",
    headers: { ...defaultHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ stage, max_days }),
  });
  if (!res.ok) throw new Error("Failed to update SLA threshold");
}

export async function fetchAuditLogs(): Promise<AuditRecord[]> {
  const res = await fetch(`${API_BASE}/api/audit-events`, { headers: defaultHeaders, cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch audit records");
  return res.json();
}

export async function uploadCandidatesCsv(file: File): Promise<ImportResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/api/candidates/import`, {
    method: "POST",
    headers: defaultHeaders,
    body: formData,
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(errorJson.detail || "Failed to import CSV");
  }
  return res.json();
}
