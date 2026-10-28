# STALL ALERTER — API Documentation

Base URL: `http://127.0.0.1:8000`  
Interactive OpenAPI UI: `http://127.0.0.1:8000/docs`  
Interactive Operations Console: `http://127.0.0.1:8000/console/`

## Authentication
Protected endpoints require the `X-API-Key` HTTP header:
```http
X-API-Key: dev-stall-alerter-secret-key-32chars-min
```

---

## Endpoints

### 1. System Health
- **`GET /health`**
  - **Auth:** Public
  - **Response:** `{"status": "healthy", "service": "Stall Alerter API", "version": "2.0.0", "timestamp": "..."}`

### 2. SLA Rules
- **`GET /api/rules`**
  - Returns array of stage definitions and their maximum allowable days (`max_days`).
- **`PUT /api/rules`**
  - Update or insert an SLA threshold for a specific stage.
  - Body: `{"stage": "Technical Interview", "max_days": 4}`

### 3. Candidates Ingestion
- **`POST /api/candidates/import`**
  - Multipart form upload with `file` (`.csv`).
  - Idempotently upserts candidates based on `external_id`.
- **`GET /api/candidates`**
  - List candidate records with optional `?search=` and `?stage=` query filters.

### 4. Alert Scanner & Operational Inbox
- **`POST /api/alerts/scan`**
  - Runs deterministic SLA evaluation across all candidates. Creates new alerts or marks resolved alerts.
- **`GET /api/alerts`**
  - Query parameters: `status_filter` (`open`, `resolved`, `all`), `severity` (`critical`, `high`, `medium`).
  - Returns alerts enriched with candidate details, sorted by operational urgency.

### 5. Follow-up Drafts & Approval Gates
- **`POST /api/alerts/{id}/draft`**
  - Generates neutral follow-up communication draft for a stalled alert.
- **`GET /api/actions`**
  - Lists generated action drafts and their approval statuses (`draft`, `approved`, `rejected`).
- **`POST /api/actions/{id}/approval`**
  - Record human approval or rejection.
  - Body: `{"decision": "approved", "reviewer": "recruiter_name"}`

### 6. Audit Trail & Metrics
- **`GET /api/audit-events`**
  - Read-only chronologically ordered log of material system events.
- **`GET /api/metrics`**
  - Summary metrics: candidate counts, open alerts, critical breaches, pending drafts.
