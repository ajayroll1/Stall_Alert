"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import FluidFooter from "../../components/FluidFooter";
import ProductTourModal from "../../components/ProductTourModal";
import {
  fetchMetrics,
  fetchAlerts,
  triggerScan,
  fetchCandidates,
  createDraft,
  fetchActions,
  submitApprovalDecision,
  fetchRules,
  updateRule,
  fetchAuditLogs,
  uploadCandidatesCsv,
  deleteCandidate,
  bulkDeleteCandidates,
  deleteAlert,
  bulkDeleteAlerts,
  deleteRule,
  clearAuditLogs,
} from "../../api";
import { AlertItem, AuditRecord, Candidate, FollowupAction, MetricSummary, SLARule } from "../../types";

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"alerts" | "candidates" | "drafts" | "rules" | "audit">("alerts");
  const [showTour, setShowTour] = useState<boolean>(false);

  // Metrics
  const [metrics, setMetrics] = useState<MetricSummary>({
    candidates_tracked: 0,
    open_alerts: 0,
    critical_alerts: 0,
    high_alerts: 0,
    pending_drafts: 0,
    approved_drafts: 0,
  });

  // Alerts
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Candidates
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Selection states for Bulk actions
  const [selectedAlertIds, setSelectedAlertIds] = useState<Set<string>>(new Set());
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set());

  // New Rule inputs
  const [newRuleStage, setNewRuleStage] = useState<string>("");
  const [newRuleDays, setNewRuleDays] = useState<number>(7);
  const [showAddRuleModal, setShowAddRuleModal] = useState<boolean>(false);

  // Drafts & Approval
  const [drafts, setDrafts] = useState<FollowupAction[]>([]);
  const [reviewModalAction, setReviewModalAction] = useState<FollowupAction | null>(null);
  const [editedDraftText, setEditedDraftText] = useState<string>("");

  // Rules
  const [rules, setRules] = useState<SLARule[]>([]);
  const [ruleEdits, setRuleEdits] = useState<{ [key: string]: number }>({});

  // Audit
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);

  // Pagination States (Clean 5 items per page with page index)
  const [alertsPage, setAlertsPage] = useState<number>(1);
  const [candidatesPage, setCandidatesPage] = useState<number>(1);
  const [draftsPage, setDraftsPage] = useState<number>(1);
  const [auditPage, setAuditPage] = useState<number>(1);
  const PAGE_SIZE = 5;

  // Additional Role/Stage Filters
  const [stageFilter, setStageFilter] = useState<string>("");
  const [candidateStageFilter, setCandidateStageFilter] = useState<string>("");
  const [draftStatusFilter, setDraftStatusFilter] = useState<string>("");
  const [auditActionFilter, setAuditActionFilter] = useState<string>("");

  // CSV Import Modal
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // Toasts
  const [toasts, setToasts] = useState<Array<{ id: number; message: string }>>([]);

  const showToast = (message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const refreshAll = async () => {
    try {
      const [m, a, c, d, r, log] = await Promise.all([
        fetchMetrics(),
        fetchAlerts(statusFilter, severityFilter),
        fetchCandidates(searchQuery),
        fetchActions(),
        fetchRules(),
        fetchAuditLogs(),
      ]);
      setMetrics(m);
      setAlerts(a);
      setCandidates(c);
      setDrafts(d);
      setRules(r);
      setAuditLogs(log);
    } catch (err) {
      console.error("Failed to load pipeline state:", err);
    }
  };

  useEffect(() => {
    setMounted(true);
    refreshAll();
  }, [statusFilter, severityFilter]);

  if (!mounted) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-app, #faf9f6)" }} suppressHydrationWarning />
    );
  }

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const res = await triggerScan();
      showToast(`Scan complete: ${res.new_alerts} new alerts, ${res.resolved_alerts} resolved`);
      await refreshAll();
    } catch {
      showToast("Failed to run stall detection scan");
    } finally {
      setIsScanning(false);
    }
  };

  const handleCreateDraft = async (alertId: string) => {
    try {
      const draft = await createDraft(alertId);
      showToast("Neutral follow-up draft created for review");
      await refreshAll();
      setActiveTab("drafts");
    } catch {
      showToast("Error creating draft");
    }
  };

  const handleApproveReject = async (decision: "approved" | "rejected") => {
    if (!reviewModalAction) return;
    try {
      await submitApprovalDecision(reviewModalAction.id, decision, "TalentLead", editedDraftText);
      showToast(
        decision === "approved"
          ? "Draft approved & email successfully dispatched to candidate!"
          : "Candidate status updated to rejected & courtesy email dispatched."
      );
      setReviewModalAction(null);
      await refreshAll();
    } catch (err: any) {
      showToast(`Action failed: ${err.message || "Unknown error"}`);
    }
  };

  // --- Deletion & SLA Handlers ---
  const handleDeleteAlert = async (alertId: string) => {
    if (!window.confirm("Are you sure you want to dismiss/delete this overdue alert?")) return;
    try {
      await deleteAlert(alertId);
      setSelectedAlertIds((prev) => {
        const next = new Set(prev);
        next.delete(alertId);
        return next;
      });
      showToast("Alert deleted successfully");
      await refreshAll();
    } catch {
      showToast("Failed to delete alert");
    }
  };

  const handleBulkDeleteAlerts = async () => {
    if (selectedAlertIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedAlertIds.size} selected alert(s)?`)) return;
    try {
      await bulkDeleteAlerts(Array.from(selectedAlertIds));
      setSelectedAlertIds(new Set());
      showToast("Selected alerts deleted successfully");
      await refreshAll();
    } catch {
      showToast("Failed to delete selected alerts");
    }
  };

  const handleDeleteCandidate = async (candidateId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete candidate '${name}' and all associated alerts/records?`)) return;
    try {
      await deleteCandidate(candidateId);
      setSelectedCandidateIds((prev) => {
        const next = new Set(prev);
        next.delete(candidateId);
        return next;
      });
      showToast(`Candidate '${name}' deleted successfully`);
      await refreshAll();
    } catch {
      showToast("Failed to delete candidate");
    }
  };

  const handleBulkDeleteCandidates = async () => {
    if (selectedCandidateIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedCandidateIds.size} selected candidate(s) and their associated records?`)) return;
    try {
      await bulkDeleteCandidates(Array.from(selectedCandidateIds));
      setSelectedCandidateIds(new Set());
      showToast("Selected candidates deleted successfully");
      await refreshAll();
    } catch {
      showToast("Failed to bulk delete candidates");
    }
  };

  const handleDeleteRule = async (stage: string) => {
    if (!window.confirm(`Delete SLA rule for stage '${stage}'?`)) return;
    try {
      await deleteRule(stage);
      showToast(`SLA rule for '${stage}' removed`);
      await refreshAll();
    } catch {
      showToast("Failed to delete SLA rule");
    }
  };

  const handleAddRule = async () => {
    if (!newRuleStage.trim()) {
      showToast("Please enter a stage name");
      return;
    }
    if (newRuleDays < 1) {
      showToast("Please enter a positive SLA threshold");
      return;
    }
    try {
      await updateRule(newRuleStage.trim(), newRuleDays);
      showToast(`Added SLA rule for '${newRuleStage.trim()}' (${newRuleDays} days)`);
      setNewRuleStage("");
      setNewRuleDays(7);
      setShowAddRuleModal(false);
      await refreshAll();
    } catch {
      showToast("Failed to add SLA rule");
    }
  };

  const handleClearAuditLogs = async () => {
    if (!window.confirm("Are you sure you want to clear all audit events? This cannot be undone.")) return;
    try {
      await clearAuditLogs();
      showToast("Audit logs cleared successfully");
      await refreshAll();
    } catch {
      showToast("Failed to clear audit logs");
    }
  };

  const handleUpdateRule = async (stage: string) => {
    const max_days = ruleEdits[stage];
    if (!max_days || max_days < 1) {
      showToast("Please enter a valid positive day threshold");
      return;
    }
    try {
      await updateRule(stage, max_days);
      showToast(`SLA for '${stage}' updated to ${max_days} days`);
      await refreshAll();
    } catch {
      showToast("Failed to update rule");
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      showToast("Please select a .csv file");
      return;
    }
    setIsImporting(true);
    try {
      const res = await uploadCandidatesCsv(selectedFile);
      setImportStatus(`Success! Imported ${res.imported_rows} rows (${res.error_count} errors)`);
      showToast(`Imported ${res.imported_rows} candidates`);
      await refreshAll();
      await handleScan();
    } catch (err: any) {
      setImportStatus(`Failed: ${err.message}`);
      showToast("Upload failed");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div>
      {/* Top Header */}
      <header className="app-header">
        <Link href="/" className="brand-container" style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}>
          <img
            src="/stall-logo.svg"
            alt="Stall Alerter Logo"
            width={34}
            height={34}
            className="header-logo-img"
          />
          <div>
            <span className="brand-title">Stall Alerter</span>
            <span className="brand-subtitle">Pipeline Operations Console</span>
          </div>
        </Link>

        <div className="header-actions">
          <button
            id="tour-step-explore-btn"
            className="tour-expand-pill-btn"
            onClick={() => setShowTour(true)}
            aria-label="Product Tour"
            title="Product Tour"
          >
            <svg
              className="tour-compass-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
            <span className="tour-expand-text">Tour</span>
          </button>

          {/* Import CSV - Icon with Expand on Hover */}
          <button
            id="tour-step-import-btn"
            className="btn btn-secondary btn-icon-expand"
            onClick={() => setShowImportModal(true)}
            title="Import CSV Export"
            aria-label="Import CSV"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <span className="expand-text">Import CSV</span>
          </button>

          {/* Run Stall Scan - Icon with Expand on Hover */}
          <button
            id="tour-step-scan-btn"
            className="btn btn-primary btn-icon-expand"
            onClick={handleScan}
            disabled={isScanning}
            title="Run Stall Scan"
            aria-label="Run Stall Scan"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            <span className="expand-text">{isScanning ? "Scanning..." : "Run Stall Scan"}</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="app-container">
        {/* Metrics Grid */}
        <section id="tour-target-metrics" className="metrics-grid">
          <div className="stat-card">
            <div className="stat-label">Tracked Candidates</div>
            <div className="stat-value">{metrics.candidates_tracked}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Open Overdue Alerts</div>
            <div className="stat-value stat-accent">{metrics.open_alerts}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Critical SLA Breaches</div>
            <div className="stat-value stat-critical">{metrics.critical_alerts}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending Follow-up Drafts</div>
            <div className="stat-value stat-high">{metrics.pending_drafts}</div>
          </div>
        </section>

        {/* Tab Navigation */}
        <nav id="tour-target-tabs" className="tab-navigation">
          <button
            id="tab-btn-alerts"
            className={`nav-tab ${activeTab === "alerts" ? "active" : ""}`}
            onClick={() => setActiveTab("alerts")}
          >
            Overdue Alerts
          </button>
          <button
            id="tab-btn-candidates"
            className={`nav-tab ${activeTab === "candidates" ? "active" : ""}`}
            onClick={() => setActiveTab("candidates")}
          >
            All Candidates
          </button>
          <button
            id="tab-btn-drafts"
            className={`nav-tab ${activeTab === "drafts" ? "active" : ""}`}
            onClick={() => setActiveTab("drafts")}
          >
            Follow-up Drafts
          </button>
          <button
            id="tab-btn-rules"
            className={`nav-tab ${activeTab === "rules" ? "active" : ""}`}
            onClick={() => setActiveTab("rules")}
          >
            Stage SLA Rules
          </button>
          <button
            id="tab-btn-audit"
            className={`nav-tab ${activeTab === "audit" ? "active" : ""}`}
            onClick={() => setActiveTab("audit")}
          >
            Audit Events
          </button>
        </nav>

        {/* TAB 1: ALERTS */}
        {activeTab === "alerts" && (
          <section id="tour-target-alerts-section" className="tab-pane-content">
            <div id="tour-target-alerts-toolbar" className="action-toolbar">
              <div id="tour-alerts-filter-group" className="toolbar-left">
                <label className="stat-label" style={{ margin: 0 }}>Severity:</label>
                <select
                  id="tour-alerts-severity-select"
                  className="form-select"
                  value={severityFilter}
                  onChange={(e) => {
                    setSeverityFilter(e.target.value);
                    setAlertsPage(1);
                  }}
                >
                  <option value="">All Severities</option>
                  <option value="critical">Critical (&ge; 2x SLA)</option>
                  <option value="high">High (&ge; 1.5x SLA)</option>
                  <option value="medium">Medium (&ge; 1x SLA)</option>
                </select>

                <label className="stat-label" style={{ margin: 0, marginLeft: "0.5rem" }}>Status:</label>
                <select
                  id="tour-alerts-status-select"
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setAlertsPage(1);
                  }}
                >
                  <option value="open">Open Alerts</option>
                  <option value="resolved">Resolved Alerts</option>
                  <option value="all">All Alerts</option>
                </select>

                <label className="stat-label" style={{ margin: 0, marginLeft: "0.5rem" }}>Stage:</label>
                <select
                  id="tour-alerts-stage-select"
                  className="form-select"
                  value={stageFilter}
                  onChange={(e) => {
                    setStageFilter(e.target.value);
                    setAlertsPage(1);
                  }}
                >
                  <option value="">All Stages</option>
                  {rules.map((r) => (
                    <option key={r.stage} value={r.stage}>{r.stage}</option>
                  ))}
                </select>
              </div>
              <div className="toolbar-right" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {selectedAlertIds.size > 0 && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={handleBulkDeleteAlerts}
                  >
                    Delete Selected ({selectedAlertIds.size})
                  </button>
                )}
                <span id="tour-alerts-counter" className="stat-label" style={{ margin: 0 }}>
                  {alerts.filter(a => !stageFilter || a.stage === stageFilter).length} alerts found
                </span>
              </div>
            </div>

            <div id="tour-alerts-table-card" className="table-card">
              <div className="table-responsive">
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40, textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={
                            (() => {
                              const filtered = alerts.filter(a => !stageFilter || a.stage === stageFilter);
                              return filtered.length > 0 && filtered.every(a => selectedAlertIds.has(a.id));
                            })()
                          }
                          onChange={(e) => {
                            const filtered = alerts.filter(a => !stageFilter || a.stage === stageFilter);
                            if (e.target.checked) {
                              setSelectedAlertIds(new Set(filtered.map(a => a.id)));
                            } else {
                              setSelectedAlertIds(new Set());
                            }
                          }}
                          aria-label="Select all alerts"
                        />
                      </th>
                      <th>Urgency</th>
                      <th>Candidate Name</th>
                      <th>Target Role</th>
                      <th>Stage</th>
                      <th>Idle Days</th>
                      <th>Assigned Recruiter</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const filtered = alerts.filter(a => !stageFilter || a.stage === stageFilter);
                      const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
                      const paginated = filtered.slice((alertsPage - 1) * PAGE_SIZE, alertsPage * PAGE_SIZE);

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={8} style={{ padding: 0 }}>
                              <div className="empty-state-box">
                                <div className="empty-state-icon">
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 6L9 17l-5-5"/>
                                  </svg>
                                </div>
                                <div className="empty-state-title">Pipeline Operating Within SLA Thresholds</div>
                                <div className="empty-state-desc">
                                  All tracked candidate applications are progressing on schedule. No overdue bottlenecks detected.
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return paginated.map((a, index) => (
                        <tr key={a.id} id={index === 0 ? "tour-alerts-first-row" : undefined}>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={selectedAlertIds.has(a.id)}
                              onChange={(e) => {
                                setSelectedAlertIds(prev => {
                                  const next = new Set(prev);
                                  if (e.target.checked) next.add(a.id);
                                  else next.delete(a.id);
                                  return next;
                                });
                              }}
                              aria-label={`Select alert ${a.id}`}
                            />
                          </td>
                          <td>
                            <span className={`badge badge-${a.severity}`}>{a.severity}</span>
                          </td>
                          <td>
                            <strong>{a.candidate_name || "Unknown"}</strong>
                            <br />
                            <small style={{ color: "var(--text-muted)" }}>{a.candidate_email}</small>
                          </td>
                          <td>{a.job_title}</td>
                          <td>{a.stage}</td>
                          <td><strong>{a.days_in_stage.toFixed(1)}</strong> days</td>
                          <td>{a.recruiter || "Unassigned"}</td>
                          <td>
                            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                              <button
                                id={index === 0 ? "tour-alerts-draft-btn" : undefined}
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleCreateDraft(a.id)}
                              >
                                Draft Follow-up
                              </button>
                              <button
                                className="btn btn-sm"
                                style={{
                                  background: "transparent",
                                  border: "1px solid var(--border-subtle, #e2e8f0)",
                                  color: "var(--text-muted, #94a3b8)",
                                  padding: "0.25rem 0.5rem",
                                  cursor: "pointer",
                                  borderRadius: "4px"
                                }}
                                title="Dismiss/Delete Alert"
                                onClick={() => handleDeleteAlert(a.id)}
                              >
                                ✕
                              </button>
                            </div>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Responsive Pagination Bar for Alerts */}
              {(() => {
                const filtered = alerts.filter(a => !stageFilter || a.stage === stageFilter);
                const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
                if (totalPages <= 1) return null;

                return (
                  <div id="tour-alerts-pagination" className="pagination-bar">
                    <div className="pagination-info">
                      Showing Page <strong>{alertsPage}</strong> of <strong>{totalPages}</strong> ({filtered.length} total alerts)
                    </div>
                    <div className="pagination-controls">
                      <button
                        className="page-btn"
                        disabled={alertsPage === 1}
                        onClick={() => setAlertsPage((p) => Math.max(1, p - 1))}
                      >
                        &larr; Prev
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                        <button
                          key={num}
                          className={`page-btn ${alertsPage === num ? "active" : ""}`}
                          onClick={() => setAlertsPage(num)}
                        >
                          {num}
                        </button>
                      ))}
                      <button
                        className="page-btn"
                        disabled={alertsPage === totalPages}
                        onClick={() => setAlertsPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Next &rarr;
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </section>
        )}

        {/* TAB 2: CANDIDATES */}
        {activeTab === "candidates" && (
          <section id="tour-target-candidates-section" className="tab-pane-content">
            <div id="tour-target-candidates-toolbar" className="action-toolbar">
              <div id="tour-candidates-search-group" className="toolbar-left">
                <input
                  id="tour-candidates-search-input"
                  type="text"
                  className="form-input"
                  placeholder="Search by name, role or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: 260 }}
                />
                <button
                  id="tour-candidates-search-btn"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setCandidatesPage(1);
                    fetchCandidates(searchQuery).then(setCandidates);
                  }}
                >
                  Search
                </button>

                <label className="stat-label" style={{ margin: 0, marginLeft: "0.5rem" }}>Stage:</label>
                <select
                  id="tour-candidates-stage-select"
                  className="form-select"
                  value={candidateStageFilter}
                  onChange={(e) => {
                    setCandidateStageFilter(e.target.value);
                    setCandidatesPage(1);
                  }}
                >
                  <option value="">All Stages</option>
                  {rules.map((r) => (
                    <option key={r.stage} value={r.stage}>{r.stage}</option>
                  ))}
                </select>
              </div>
              <div className="toolbar-right" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {selectedCandidateIds.size > 0 && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={handleBulkDeleteCandidates}
                  >
                    Delete Selected ({selectedCandidateIds.size})
                  </button>
                )}
                <span id="tour-candidates-counter" className="stat-label" style={{ margin: 0 }}>
                  {candidates.filter(c => !candidateStageFilter || c.stage === candidateStageFilter).length} candidates found
                </span>
              </div>
            </div>

            <div id="tour-candidates-table-card" className="table-card">
              <div className="table-responsive">
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40, textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={
                            (() => {
                              const filteredCandidates = candidates.filter(c => !candidateStageFilter || c.stage === candidateStageFilter);
                              return filteredCandidates.length > 0 && filteredCandidates.every(c => selectedCandidateIds.has(c.id));
                            })()
                          }
                          onChange={(e) => {
                            const filteredCandidates = candidates.filter(c => !candidateStageFilter || c.stage === candidateStageFilter);
                            if (e.target.checked) {
                              setSelectedCandidateIds(new Set(filteredCandidates.map(c => c.id)));
                            } else {
                              setSelectedCandidateIds(new Set());
                            }
                          }}
                          aria-label="Select all candidates"
                        />
                      </th>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Stage</th>
                      <th>Stage Entered</th>
                      <th>Recruiter</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const filteredCandidates = candidates.filter(
                        (c) => !candidateStageFilter || c.stage === candidateStageFilter
                      );
                      const paginatedCandidates = filteredCandidates.slice(
                        (candidatesPage - 1) * PAGE_SIZE,
                        candidatesPage * PAGE_SIZE
                      );

                      if (filteredCandidates.length === 0) {
                        return (
                          <tr>
                            <td colSpan={9} style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-muted)" }}>
                              No candidates found matching criteria.
                            </td>
                          </tr>
                        );
                      }

                      return paginatedCandidates.map((c, index) => (
                        <tr key={c.id} id={index === 0 ? "tour-candidates-first-row" : undefined}>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={selectedCandidateIds.has(c.id)}
                              onChange={(e) => {
                                setSelectedCandidateIds(prev => {
                                  const next = new Set(prev);
                                  if (e.target.checked) next.add(c.id);
                                  else next.delete(c.id);
                                  return next;
                                });
                              }}
                              aria-label={`Select candidate ${c.name}`}
                            />
                          </td>
                          <td><code>{c.external_id || c.id.slice(0, 8)}</code></td>
                          <td><strong>{c.name}</strong></td>
                          <td>{c.email}</td>
                          <td>{c.job_title}</td>
                          <td><span className="badge badge-neutral">{c.stage}</span></td>
                          <td>{new Date(c.stage_entered_at).toLocaleDateString()}</td>
                          <td>{c.recruiter || "-"}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-danger"
                              style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                              onClick={() => handleDeleteCandidate(c.id, c.name)}
                              title="Delete candidate"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Responsive Pagination Bar for Candidates */}
              {(() => {
                const filteredCandidates = candidates.filter(
                  (c) => !candidateStageFilter || c.stage === candidateStageFilter
                );
                const totalPages = Math.ceil(filteredCandidates.length / PAGE_SIZE);
                if (totalPages <= 1) return null;

                return (
                  <div id="tour-candidates-pagination" className="pagination-bar">
                    <div className="pagination-info">
                      Showing Page <strong>{candidatesPage}</strong> of <strong>{totalPages}</strong> ({filteredCandidates.length} total candidates)
                    </div>
                    <div className="pagination-controls">
                      <button
                        className="page-btn"
                        disabled={candidatesPage === 1}
                        onClick={() => setCandidatesPage((p) => Math.max(1, p - 1))}
                      >
                        &larr; Prev
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                        <button
                          key={num}
                          className={`page-btn ${candidatesPage === num ? "active" : ""}`}
                          onClick={() => setCandidatesPage(num)}
                        >
                          {num}
                        </button>
                      ))}
                      <button
                        className="page-btn"
                        disabled={candidatesPage === totalPages}
                        onClick={() => setCandidatesPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Next &rarr;
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </section>
        )}

        {/* TAB 3: DRAFTS & APPROVAL */}
        {activeTab === "drafts" && (
          <section id="tour-target-drafts-section" className="tab-pane-content">
            <div id="tour-target-drafts-toolbar" className="action-toolbar">
              <div id="tour-drafts-filter-group" className="toolbar-left">
                <label className="stat-label" style={{ margin: 0 }}>Draft Status:</label>
                <select
                  id="tour-drafts-status-select"
                  className="form-select"
                  value={draftStatusFilter}
                  onChange={(e) => {
                    setDraftStatusFilter(e.target.value);
                    setDraftsPage(1);
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Pending Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="toolbar-right">
                <span id="tour-drafts-counter" className="stat-label" style={{ margin: 0 }}>
                  {drafts.filter((d) => !draftStatusFilter || d.status === draftStatusFilter).length} actions in queue
                </span>
              </div>
            </div>

            <div id="tour-drafts-table-card" className="table-card">
              <div className="table-responsive">
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th>Action ID</th>
                      <th>Type</th>
                      <th>Draft Preview</th>
                      <th>Status</th>
                      <th>Created At</th>
                      <th>Governance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const filteredDrafts = drafts.filter(
                        (d) => !draftStatusFilter || d.status === draftStatusFilter
                      );
                      const paginatedDrafts = filteredDrafts.slice(
                        (draftsPage - 1) * PAGE_SIZE,
                        draftsPage * PAGE_SIZE
                      );

                      if (filteredDrafts.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-muted)" }}>
                              No drafts matching selected filter.
                            </td>
                          </tr>
                        );
                      }

                      return paginatedDrafts.map((d, index) => (
                        <tr key={d.id} id={index === 0 ? "tour-drafts-first-row" : undefined}>
                          <td><code>{d.id.slice(0, 8)}...</code></td>
                          <td>{d.action_type}</td>
                          <td>
                            <div style={{ maxWidth: 350, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {d.draft.split("\n")[0]}
                            </div>
                          </td>
                          <td>
                            <span className={`badge badge-${d.status === "approved" ? "medium" : d.status === "rejected" ? "critical" : "neutral"}`}>
                              {d.status}
                            </span>
                          </td>
                          <td>{new Date(d.created_at).toLocaleString()}</td>
                          <td>
                            {d.status === "draft" ? (
                              <button
                                id={index === 0 ? "tour-drafts-review-btn" : undefined}
                                className="btn btn-primary btn-sm"
                                onClick={() => {
                                  setReviewModalAction(d);
                                  setEditedDraftText(d.draft);
                                }}
                              >
                                Review & Approve
                              </button>
                            ) : (
                              <small style={{ color: "var(--text-muted)" }}>Decided</small>
                            )}
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Responsive Pagination Bar for Drafts */}
              {(() => {
                const filteredDrafts = drafts.filter(
                  (d) => !draftStatusFilter || d.status === draftStatusFilter
                );
                const totalPages = Math.ceil(filteredDrafts.length / PAGE_SIZE);
                if (totalPages <= 1) return null;

                return (
                  <div id="tour-drafts-pagination" className="pagination-bar">
                    <div className="pagination-info">
                      Showing Page <strong>{draftsPage}</strong> of <strong>{totalPages}</strong> ({filteredDrafts.length} total drafts)
                    </div>
                    <div className="pagination-controls">
                      <button
                        className="page-btn"
                        disabled={draftsPage === 1}
                        onClick={() => setDraftsPage((p) => Math.max(1, p - 1))}
                      >
                        &larr; Prev
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                        <button
                          key={num}
                          className={`page-btn ${draftsPage === num ? "active" : ""}`}
                          onClick={() => setDraftsPage(num)}
                        >
                          {num}
                        </button>
                      ))}
                      <button
                        className="page-btn"
                        disabled={draftsPage === totalPages}
                        onClick={() => setDraftsPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Next &rarr;
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </section>
        )}

        {/* TAB 4: RULES */}
        {activeTab === "rules" && (
          <section id="tour-target-rules-section" className="tab-pane-content">
            <div id="tour-target-rules-toolbar" className="action-toolbar">
              <span className="stat-label">Configurable Service Level Agreements (SLA Thresholds in Days)</span>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowAddRuleModal(true)}
              >
                + Add Stage SLA Rule
              </button>
            </div>

            <div id="tour-rules-table-card" className="table-card">
              <div className="table-responsive">
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th>Hiring Pipeline Stage</th>
                      <th>Max Allowable Days (SLA)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((r, index) => (
                      <tr key={r.stage} id={index === 0 ? "tour-rules-first-row" : undefined}>
                        <td><strong>{r.stage}</strong></td>
                        <td>
                          <input
                            id={index === 0 ? "tour-rules-input-field" : undefined}
                            type="number"
                            className="form-input"
                            defaultValue={r.max_days}
                            min={1}
                            max={90}
                            style={{ width: 80 }}
                            onChange={(e) =>
                              setRuleEdits({
                                ...ruleEdits,
                                [r.stage]: parseInt(e.target.value, 10),
                              })
                            }
                          />{" "}
                          days
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              id={index === 0 ? "tour-rules-update-btn" : undefined}
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleUpdateRule(r.stage)}
                            >
                              Update SLA
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteRule(r.stage)}
                              title="Delete SLA Rule"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* TAB 5: AUDIT LOGS */}
        {activeTab === "audit" && (
          <section id="tour-target-audit-section" className="tab-pane-content">
            <div id="tour-target-audit-toolbar" className="action-toolbar">
              <div id="tour-audit-filter-group" className="toolbar-left">
                <label className="stat-label" style={{ margin: 0 }}>Action Type:</label>
                <select
                  id="tour-audit-action-select"
                  className="form-select"
                  value={auditActionFilter}
                  onChange={(e) => {
                    setAuditActionFilter(e.target.value);
                    setAuditPage(1);
                  }}
                >
                  <option value="">All Actions</option>
                  {Array.from(new Set(auditLogs.map((l) => l.action))).map((act) => (
                    <option key={act} value={act}>{act}</option>
                  ))}
                </select>
              </div>
              <div className="toolbar-right" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleClearAuditLogs}
                  title="Clear all audit log entries"
                >
                  Clear Audit Logs
                </button>
                <span id="tour-audit-counter" className="stat-label" style={{ margin: 0 }}>
                  {auditLogs.filter((l) => !auditActionFilter || l.action === auditActionFilter).length} events recorded
                </span>
              </div>
            </div>

            <div id="tour-audit-table-card" className="table-card">
              <div className="table-responsive">
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th>Timestamp (UTC)</th>
                      <th>Actor</th>
                      <th>Action</th>
                      <th>Target Entity</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const filteredAudit = auditLogs.filter(
                        (l) => !auditActionFilter || l.action === auditActionFilter
                      );
                      const paginatedAudit = filteredAudit.slice(
                        (auditPage - 1) * PAGE_SIZE,
                        auditPage * PAGE_SIZE
                      );

                      if (filteredAudit.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-muted)" }}>
                              No audit events matching criteria.
                            </td>
                          </tr>
                        );
                      }

                      return paginatedAudit.map((log, index) => (
                        <tr key={log.id} id={index === 0 ? "tour-audit-first-row" : undefined}>
                          <td><small style={{ fontFamily: "var(--font-mono)" }}>{new Date(log.timestamp).toLocaleString()}</small></td>
                          <td><strong>{log.actor}</strong></td>
                          <td><span className="badge badge-neutral">{log.action}</span></td>
                          <td>{log.entity_type} / <code>{log.entity_id}</code></td>
                          <td><small style={{ color: "var(--text-secondary)" }}>{log.details || "-"}</small></td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Responsive Pagination Bar for Audit Logs */}
              {(() => {
                const filteredAudit = auditLogs.filter(
                  (l) => !auditActionFilter || l.action === auditActionFilter
                );
                const totalPages = Math.ceil(filteredAudit.length / PAGE_SIZE);
                if (totalPages <= 1) return null;

                return (
                  <div id="tour-audit-pagination" className="pagination-bar">
                    <div className="pagination-info">
                      Showing Page <strong>{auditPage}</strong> of <strong>{totalPages}</strong> ({filteredAudit.length} total audit records)
                    </div>
                    <div className="pagination-controls">
                      <button
                        className="page-btn"
                        disabled={auditPage === 1}
                        onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                      >
                        &larr; Prev
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                        <button
                          key={num}
                          className={`page-btn ${auditPage === num ? "active" : ""}`}
                          onClick={() => setAuditPage(num)}
                        >
                          {num}
                        </button>
                      ))}
                      <button
                        className="page-btn"
                        disabled={auditPage === totalPages}
                        onClick={() => setAuditPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Next &rarr;
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </section>
        )}
      </main>

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="modal-backdrop">
          <div className="modal-window">
            <div className="modal-header">
              <h2>Import Candidate Applications (CSV)</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowImportModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                Upload a candidate CSV export with headers: <code>external_id</code>, <code>name</code>, <code>email</code>, <code>job_title</code>, <code>stage</code>, <code>stage_entered_at</code>.
              </p>
              <div style={{ border: "2px dashed var(--border-strong)", padding: "2rem", textAlign: "center", borderRadius: "var(--radius-sm)", marginBottom: "1rem" }}>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                />
              </div>
              {importStatus && (
                <div style={{ padding: "0.75rem", background: "var(--bg-surface-subtle)", borderRadius: "var(--radius-sm)", fontSize: "0.85rem" }}>
                  {importStatus}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowImportModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleFileUpload} disabled={isImporting}>
                {isImporting ? "Uploading..." : "Upload & Process"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Stage SLA Rule Modal */}
      {showAddRuleModal && (
        <div className="modal-backdrop">
          <div className="modal-window">
            <div className="modal-header">
              <h2>Add New Stage SLA Rule</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAddRuleModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>
                  Pipeline Stage Name
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: "100%" }}
                  placeholder="e.g. Leadership Interview, Reference Check"
                  value={newRuleStage}
                  onChange={(e) => setNewRuleStage(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>
                  Max Allowable Days (SLA Threshold)
                </label>
                <input
                  type="number"
                  className="form-input"
                  style={{ width: "100%" }}
                  min={1}
                  max={90}
                  value={newRuleDays}
                  onChange={(e) => setNewRuleDays(parseInt(e.target.value, 10) || 1)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddRuleModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddRule}>Save Rule</button>
            </div>
          </div>
        </div>
      )}

      {/* Review & Approve Modal */}
      {reviewModalAction && (
        <div className="modal-backdrop">
          <div className="modal-window">
            <div className="modal-header">
              <h2>Review & Approve Follow-up Outreach</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setReviewModalAction(null)}>✕</button>
            </div>
            <div className="modal-body">
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.4rem" }}>
                Editable Outreach Message:
              </label>
              <textarea
                className="form-input"
                style={{ width: "100%", height: 180, lineHeight: 1.4 }}
                value={editedDraftText}
                onChange={(e) => setEditedDraftText(e.target.value)}
              />
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                Policy Notice: External delivery is gated by human approval. The server records your decision in the audit log.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={() => handleApproveReject("rejected")}>Reject Draft</button>
              <button className="btn btn-primary" onClick={() => handleApproveReject("approved")}>Approve Message</button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Product Tour Modal */}
      <ProductTourModal
        isOpen={showTour}
        onClose={() => setShowTour(false)}
        onSwitchTab={(t) => setActiveTab(t)}
      />

      {/* Fluid Antigravity Dynamic Footer */}
      <FluidFooter appName="Stall Alerter" tagline="Production Hiring Pipeline Monitoring & Recruiter Decision Support" />

      {/* Toast Notification Container */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <span>●</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
