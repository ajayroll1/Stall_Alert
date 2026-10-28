// Stall Alerter Frontend Controller
// Connects to live FastAPI backend at http://127.0.0.1:8000

const API_BASE = "http://127.0.0.1:8000";
const API_KEY = "dev-stall-alerter-secret-key-32chars-min";

const headers = {
  "X-API-Key": API_KEY,
};

let currentActionIdForReview = null;

// Helper: Show non-intrusive Toast Notification
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span>●</span> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 200);
  }, 3500);
}

// -----------------------------------------------------------------------------
// Data Fetching & Rendering
// -----------------------------------------------------------------------------

async function loadMetrics() {
  try {
    const res = await fetch(`${API_BASE}/api/metrics`, { headers });
    if (!res.ok) return;
    const data = await res.json();
    document.getElementById("statCandidates").innerText = data.candidates_tracked;
    document.getElementById("statOpenAlerts").innerText = data.open_alerts;
    document.getElementById("statCriticalAlerts").innerText = data.critical_alerts;
    document.getElementById("statPendingDrafts").innerText = data.pending_drafts;
  } catch (err) {
    console.error("Failed to load metrics:", err);
  }
}

async function loadAlerts() {
  const severity = document.getElementById("filterSeverity").value;
  const statusFilter = document.getElementById("filterStatus").value;
  let url = `${API_BASE}/api/alerts?status_filter=${statusFilter}`;
  if (severity) url += `&severity=${severity}`;

  try {
    const res = await fetch(url, { headers });
    const alerts = await res.json();
    const tbody = document.getElementById("alertsTableBody");
    document.getElementById("alertsCountLabel").innerText = `${alerts.length} alerts loaded`;

    if (alerts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">No alerts match the selected criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = alerts.map(a => {
      let badgeClass = "badge-neutral";
      if (a.severity === "critical") badgeClass = "badge-critical";
      else if (a.severity === "high") badgeClass = "badge-high";
      else if (a.severity === "medium") badgeClass = "badge-medium";

      return `
        <tr>
          <td><span class="badge ${badgeClass}">${a.severity}</span></td>
          <td>
            <strong>${a.candidate_name || "Unknown"}</strong><br>
            <span style="font-size:0.75rem; color: var(--text-muted);">${a.candidate_email || ""}</span>
          </td>
          <td>${a.job_title || "-"}</td>
          <td>${a.stage}</td>
          <td><strong>${a.days_in_stage.toFixed(1)}</strong> days</td>
          <td>${a.recruiter || "Unassigned"}</td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="createDraftForAlert('${a.id}')">
              Draft Follow-up
            </button>
          </td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    console.error("Failed to load alerts:", err);
  }
}

async function loadCandidates(search = "") {
  let url = `${API_BASE}/api/candidates`;
  if (search) url += `?search=${encodeURIComponent(search)}`;

  try {
    const res = await fetch(url, { headers });
    const candidates = await res.json();
    const tbody = document.getElementById("candidatesTableBody");

    if (candidates.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem; color: var(--text-muted);">No candidates recorded.</td></tr>`;
      return;
    }

    tbody.innerHTML = candidates.map(c => `
      <tr>
        <td><code style="font-size:0.75rem;">${c.external_id}</code></td>
        <td><strong>${c.name}</strong></td>
        <td>${c.email}</td>
        <td>${c.job_title}</td>
        <td>${c.stage}</td>
        <td>${new Date(c.stage_entered_at).toLocaleDateString()}</td>
        <td>${c.recruiter || "-"}</td>
      </tr>
    `).join("");
  } catch (err) {
    console.error("Failed to load candidates:", err);
  }
}

async function loadDrafts() {
  try {
    const res = await fetch(`${API_BASE}/api/actions`, { headers });
    const actions = await res.json();
    const tbody = document.getElementById("draftsTableBody");

    if (actions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: var(--text-muted);">No drafts generated yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = actions.map(act => {
      let badge = `<span class="badge badge-neutral">${act.status}</span>`;
      if (act.status === "approved") badge = `<span class="badge badge-medium">Approved</span>`;
      if (act.status === "rejected") badge = `<span class="badge badge-critical">Rejected</span>`;

      return `
        <tr>
          <td><code style="font-size:0.75rem;">${act.id.slice(0, 8)}...</code></td>
          <td>${act.action_type}</td>
          <td>
            <div style="max-width: 380px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.8rem; color: var(--text-secondary);">
              ${act.draft.split("\n")[0]}
            </div>
          </td>
          <td>${badge}</td>
          <td>${new Date(act.created_at).toLocaleString()}</td>
          <td>
            ${act.status === "draft" ? `
              <button class="btn btn-primary btn-sm" onclick="openReviewModal('${act.id}', \`${escape(act.draft)}\`)">
                Review & Approve
              </button>
            ` : `<span style="font-size:0.8rem; color: var(--text-muted);">Decided</span>`}
          </td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    console.error("Failed to load drafts:", err);
  }
}

async function loadRules() {
  try {
    const res = await fetch(`${API_BASE}/api/rules`, { headers });
    const rules = await res.json();
    const tbody = document.getElementById("rulesTableBody");

    tbody.innerHTML = rules.map(r => `
      <tr>
        <td><strong>${r.stage}</strong></td>
        <td>
          <input type="number" id="ruleInput_${r.stage}" class="form-input" value="${r.max_days}" min="1" max="90" style="width: 80px;"> days
        </td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="saveRule('${r.stage}')">Update SLA</button>
        </td>
      </tr>
    `).join("");
  } catch (err) {
    console.error("Failed to load rules:", err);
  }
}

async function saveRule(stage) {
  const input = document.getElementById(`ruleInput_${stage}`);
  const max_days = parseInt(input.value, 10);
  if (!max_days || max_days < 1) {
    showToast("Please enter a valid positive number of days", "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/rules`, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ stage, max_days }),
    });
    if (res.ok) {
      showToast(`SLA for '${stage}' updated to ${max_days} days`);
      loadRules();
    }
  } catch (err) {
    showToast("Failed to update rule", "error");
  }
}

async function loadAuditEvents() {
  try {
    const res = await fetch(`${API_BASE}/api/audit-events`, { headers });
    const events = await res.json();
    const tbody = document.getElementById("auditTableBody");

    if (events.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem; color: var(--text-muted);">No audit events recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = events.map(e => `
      <tr>
        <td><small style="font-family:var(--font-mono);">${new Date(e.timestamp).toLocaleString()}</small></td>
        <td><strong>${e.actor}</strong></td>
        <td><span class="badge badge-neutral">${e.action}</span></td>
        <td>${e.entity_type} / <code>${e.entity_id}</code></td>
        <td><small style="color:var(--text-secondary);">${e.details || "-"}</small></td>
      </tr>
    `).join("");
  } catch (err) {
    console.error("Failed to load audit events:", err);
  }
}

// -----------------------------------------------------------------------------
// Interactive Operations (Scan, Draft, Approve, Import)
// -----------------------------------------------------------------------------

async function triggerStallScan() {
  const btn = document.getElementById("btnScanNow");
  btn.disabled = true;
  btn.innerText = "Scanning...";

  try {
    const res = await fetch(`${API_BASE}/api/alerts/scan`, {
      method: "POST",
      headers,
    });
    const data = await res.json();
    showToast(`Scan complete: ${data.new_alerts} new alerts, ${data.resolved_alerts} resolved.`);
    await loadMetrics();
    await loadAlerts();
  } catch (err) {
    showToast("Scan failed to connect to backend", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg> Run Stall Scan`;
  }
}

async function createDraftForAlert(alertId) {
  try {
    const res = await fetch(`${API_BASE}/api/alerts/${alertId}/draft`, {
      method: "POST",
      headers,
    });
    if (res.ok) {
      showToast("Follow-up draft created for review");
      loadMetrics();
      loadDrafts();
      // Switch tab to drafts
      document.getElementById("tabBtnDrafts").click();
    }
  } catch (err) {
    showToast("Failed to create draft", "error");
  }
}

function openReviewModal(actionId, escapedDraft) {
  currentActionIdForReview = actionId;
  const dialog = document.getElementById("draftReviewDialog");
  document.getElementById("draftTextarea").value = unescape(escapedDraft);
  dialog.showModal();
}

async function submitApproval(decision) {
  if (!currentActionIdForReview) return;
  const dialog = document.getElementById("draftReviewDialog");

  try {
    const res = await fetch(`${API_BASE}/api/actions/${currentActionIdForReview}/approval`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ decision, reviewer: "talent_lead" }),
    });

    if (res.ok) {
      showToast(`Draft action was ${decision}`);
      dialog.close();
      currentActionIdForReview = null;
      loadMetrics();
      loadDrafts();
    }
  } catch (err) {
    showToast("Failed to submit approval decision", "error");
  }
}

// -----------------------------------------------------------------------------
// CSV Import Handler
// -----------------------------------------------------------------------------

async function submitCsvImport() {
  const fileInput = document.getElementById("csvFileInput");
  if (!fileInput.files || fileInput.files.length === 0) {
    showToast("Please select a .csv file to import", "error");
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  const submitBtn = document.getElementById("btnSubmitImport");
  submitBtn.disabled = true;
  submitBtn.innerText = "Processing...";

  try {
    const res = await fetch(`${API_BASE}/api/candidates/import`, {
      method: "POST",
      headers,
      body: formData,
    });

    const resultBox = document.getElementById("importResultBox");
    resultBox.style.display = "block";

    if (res.ok) {
      const data = await res.json();
      resultBox.innerHTML = `
        <strong style="color:var(--medium-text);">Import Successful!</strong><br>
        Rows Imported: <strong>${data.imported_rows}</strong><br>
        Errors: <strong>${data.error_count}</strong>
      `;
      showToast(`Successfully imported ${data.imported_rows} candidates`);
      loadMetrics();
      loadCandidates();
      // Auto run scan to detect new stalls
      triggerStallScan();
    } else {
      const err = await res.json();
      resultBox.innerHTML = `<strong style="color:var(--critical-text);">Import Failed:</strong> ${err.detail || "Validation Error"}`;
    }
  } catch (err) {
    showToast("Network error uploading CSV", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "Upload & Process";
  }
}

// -----------------------------------------------------------------------------
// Event Listeners & Tab Switching
// -----------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  // Initial Loads
  loadMetrics();
  loadAlerts();
  loadCandidates();
  loadDrafts();
  loadRules();
  loadAuditEvents();

  // Tab switching
  document.querySelectorAll(".nav-tab").forEach(tabBtn => {
    tabBtn.addEventListener("click", () => {
      document.querySelectorAll(".nav-tab").forEach(b => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      document.querySelectorAll(".tab-pane").forEach(p => p.style.display = "none");

      tabBtn.classList.add("active");
      tabBtn.setAttribute("aria-selected", "true");
      const targetId = tabBtn.getAttribute("data-tab");
      document.getElementById(targetId).style.display = "block";

      // Refresh corresponding data
      if (targetId === "tabAlerts") loadAlerts();
      if (targetId === "tabCandidates") loadCandidates();
      if (targetId === "tabDrafts") loadDrafts();
      if (targetId === "tabRules") loadRules();
      if (targetId === "tabAudit") loadAuditEvents();
    });
  });

  // Buttons
  document.getElementById("btnScanNow").addEventListener("click", triggerStallScan);
  document.getElementById("filterSeverity").addEventListener("change", loadAlerts);
  document.getElementById("filterStatus").addEventListener("change", loadAlerts);

  document.getElementById("btnSearchCand").addEventListener("click", () => {
    loadCandidates(document.getElementById("candSearchInput").value);
  });

  // Modal Dialogs
  const importDialog = document.getElementById("importDialog");
  document.getElementById("btnOpenImport").addEventListener("click", () => importDialog.showModal());
  document.getElementById("btnCloseImport").addEventListener("click", () => importDialog.close());
  document.getElementById("btnCancelImport").addEventListener("click", () => importDialog.close());
  document.getElementById("btnSubmitImport").addEventListener("click", submitCsvImport);

  const draftDialog = document.getElementById("draftReviewDialog");
  document.getElementById("btnCloseDraftDialog").addEventListener("click", () => draftDialog.close());
  document.getElementById("btnApproveDraft").addEventListener("click", () => submitApproval("approved"));
  document.getElementById("btnRejectDraft").addEventListener("click", () => submitApproval("rejected"));
});
