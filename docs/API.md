# STALL ALERTER — Comprehensive API Reference & REST Contracts

**Base URL (Local):** `http://127.0.0.1:8000`  
**Base URL (Production Cloud):** `https://stall-alert.onrender.com`  
**Interactive OpenAPI UI (Swagger):** `/docs`  
**Alternative Docs (ReDoc):** `/redoc`  
**Live Frontend Console:** `https://stall-alert.vercel.app` (or `http://localhost:3000`)

---

## 1. Authentication & Security Headers

All state-mutating endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) and internal queries require the `X-API-Key` HTTP header when API key enforcement is active.

```http
X-API-Key: <YOUR_SECURE_API_KEY>
```
*Local Default:* `dev-stall-alerter-secret-key-32chars-min`  
*Production:* Managed via Cloud Environment Variable (`API_KEY`).

---

## 2. API Endpoints Matrix

| Domain | Method | Endpoint | Description |
|---|---|---|---|
| **Health & Meta** | `GET` | `/health` | Liveness check & service version. |
| **Metrics** | `GET` | `/api/metrics` | Real-time counts (candidates, open alerts, drafts, critical breaches). |
| **Candidates** | `GET` | `/api/candidates` | Paginated/filtered candidate list (`?search=`, `?stage=`). |
| | `POST` | `/api/candidates/import` | Upload CSV and batch ingest candidate records. |
| | `PATCH` | `/api/candidates/{id}/stage` | Advance candidate stage, reset dwell timer to 0.0 days, and auto-resolve alerts. |
| | `DELETE` | `/api/candidates/{id}` | Single candidate deletion with associated alerts cleanup. |
| | `POST` | `/api/candidates/bulk-delete` | Bulk delete candidates by list of candidate IDs. |
| **SLA Rules** | `GET` | `/api/rules` | Fetch all configured SLA stage dwell limits (days). |
| | `PUT` | `/api/rules` | Update or create an SLA rule threshold for a stage. |
| **Alerts Engine** | `POST` | `/api/alerts/scan` | Trigger deterministic scan across all candidates. |
| | `GET` | `/api/alerts` | Query active/resolved alerts (`?status_filter=`, `?severity=`). |
| | `POST` | `/api/alerts/{id}/draft` | Generate template/AI neutral follow-up communication. |
| | `DELETE` | `/api/alerts/{id}` | Single alert dismissal/deletion. |
| | `POST` | `/api/alerts/bulk-delete` | Bulk delete alerts by array of alert IDs. |
| **Actions & Approvals** | `GET` | `/api/actions` | List all follow-up action drafts (`?status=`). |
| | `POST` | `/api/actions/{id}/approval` | Approve/Reject draft with optional candidate stage advance & real email dispatch. |
| | `POST` | `/api/actions/{id}/regenerate` | 1-click re-synthesis of follow-up outreach draft. |
| **Files & Batches** | `GET` | `/api/files` | Audit log of all historical CSV uploads. |
| | `GET` | `/api/files/{id}/download` | Re-download stored raw CSV file. |
| | `DELETE` | `/api/files/{id}` | Delete uploaded file audit record. |
| **Audit Log** | `GET` | `/api/audit-events` | Chronological immutable event stream (`?limit=50`). |

---

## 3. Detailed Request / Response Contracts

### 3.1. Health Check
- **`GET /health`**
- **Response `200 OK`:**
```json
{
  "status": "healthy",
  "service": "Stall Alerter API",
  "version": "2.5.0",
  "timestamp": "2026-11-02T01:30:00.000000+00:00"
}
```

---

### 3.2. Candidate Stage Advancement (Lifecycle Reset)
- **`PATCH /api/candidates/{candidate_id}/stage`**
- **Headers:** `X-API-Key: ...`, `Content-Type: application/json`
- **Request Body:**
```json
{
  "new_stage": "Technical Interview",
  "notes": "Candidate passed recruiter phone screen successfully."
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "candidate_id": "cnd_01H9Z...",
  "previous_stage": "Recruiter Screen",
  "new_stage": "Technical Interview",
  "stage_entered_at": "2026-11-02T01:30:00+00:00",
  "resolved_alerts_count": 1,
  "message": "Candidate transitioned to Technical Interview. Dwell timer reset to 0.0 days."
}
```
> [!IMPORTANT]
> Advancing a stage automatically updates `stage_entered_at = now()`, which recalculates elapsed days to `0.0`. Any open overdue alerts for this candidate are marked `resolved` in the same atomic transaction.

---

### 3.3. Draft Regeneration (1-Click Re-Synthesis)
- **`POST /api/actions/{action_id}/regenerate`**
- **Headers:** `X-API-Key: ...`
- **Response `200 OK`:**
```json
{
  "success": true,
  "action_id": "act_88b1f...",
  "updated_payload": {
    "subject": "Update on your application for Senior Software Engineer",
    "body": "Dear Alex Johnson,\n\nThank you very much for your continued interest in the Senior Software Engineer role at our company. We are writing to provide a transparent update on your status in the Technical Interview stage...",
    "regenerated_at": "2026-11-02T01:32:00+00:00"
  }
}
```

---

### 3.4. Human Decision Governance & Dispatch
- **`POST /api/actions/{action_id}/approval`**
- **Headers:** `X-API-Key: ...`, `Content-Type: application/json`
- **Request Body:**
```json
{
  "decision": "approved",
  "reviewer": "Sarah Connor (Talent Lead)",
  "notes": "Tone verified; clear timeline provided.",
  "edited_content": "Subject: Update...\n\nDear Candidate...",
  "advance_stage": "Technical Interview"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "action_id": "act_88b1f...",
  "status": "approved",
  "email_dispatched": true,
  "recipient": "alex.johnson@example.com",
  "associated_alert_status": "resolved",
  "candidate_stage_updated": "Technical Interview"
}
```
> [!NOTE]
> Setting `decision: "rejected"` gracefully marks the draft as discarded without dispatching emails, while resolving the associated alert and preserving an audit event.

---

### 3.5. Files & Batches History Ingestion
- **`POST /api/candidates/import`**
  - **Multipart Form:** `file: <filename.csv>`
  - Stores file metadata and CSV payload in `uploaded_files` table.
- **`GET /api/files`**
  - Returns array of ingested CSV files.
  - **Response `200 OK`:**
```json
[
  {
    "id": "file_9c11c...",
    "filename": "random_candidate_data_10.csv",
    "uploaded_at": "2026-11-02T01:01:37.000Z",
    "uploaded_by": "Recruiter Lead",
    "rows_count": 10,
    "errors_count": 0,
    "file_size": 1342,
    "status": "COMPLETED"
  }
]
```
- **`GET /api/files/{id}/download`**
  - Returns `text/csv` stream with `Content-Disposition: attachment; filename="..."`.
- **`DELETE /api/files/{id}`**
  - Deletes the file metadata and stored text.

---

### 3.6. Bulk Operations
- **`POST /api/candidates/bulk-delete`**
  - Request: `{"candidate_ids": ["cnd_1", "cnd_2"]}`
  - Response: `{"deleted_count": 2, "cleaned_alerts_count": 3}`
- **`POST /api/alerts/bulk-delete`**
  - Request: `{"alert_ids": ["alt_1", "alt_2"]}`
  - Response: `{"deleted_count": 2}`

---

## 4. Error Responses & Format

All error responses strictly adhere to RFC 7807 Problem Details or structured JSON:

```json
{
  "detail": "Action not found or already reviewed."
}
```
- `400 Bad Request`: Validation failure or invalid CSV header format.
- `401 Unauthorized`: Missing or invalid `X-API-Key`.
- `404 Not Found`: Candidate, Alert, Action, or File record does not exist.
- `422 Unprocessable Entity`: Request body schema validation error.
- `500 Internal Server Error`: Unhandled runtime exception logged to audit trace.
