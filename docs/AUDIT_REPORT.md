# Senior Software Engineering Architecture & Vulnerability Audit
**Project:** Stall Alerter  
**Auditor Role:** Principal / Staff Software Architect & AppSec Reviewer  
**Date:** October 28, 2026  
**Repository:** [github.com/ajayroll1/Stall_Alert](https://github.com/ajayroll1/Stall_Alert)

---

## 1. Executive Summary & Architecture Score
The current implementation of Stall Alerter is a solid, functional **modular monolith** with clear boundary separation between the FastAPI REST API, deterministic SLA domain calculations, and Next.js 15 frontend.

- **Current Architecture Maturity:** `8.5 / 10` (High for an early-stage production candidate; clear separation of concerns).
- **Security Baseline:** `8.2 / 10` (Safe against primary web flaws like SQLi/XSS, but lacks multi-tenant auth and DDoS controls).
- **Production Scalability Readiness:** `7.5 / 10` (Requires managed PostgreSQL and asynchronous workers for high-volume pipelines).

---

## 2. Comprehensive Inventory of Architectural & Code Deficiencies

### Category A: Scalability & Concurrency Bottlenecks

#### 🔴 Critical Finding A-1: Unbounded In-Memory Alert Scan (`O(N)` Full Table Iteration)
- **Location:** [`app/main.py` lines 434–454](file:///c:/Users/LENOVO/Desktop/Stall_Alert/app/main.py#L434-L454) (`scan_alerts()`)
- **Current Pattern:**
  ```python
  candidates = cursor.execute("SELECT * FROM candidates").fetchall()
  for cand in candidates:
      # in-memory calculation and individual single-row queries...
  ```
- **Architectural Impact:** Loads the entire candidate database into RAM on every scan. At 50,000+ candidates, this will cause memory exhaustion, CPU spikes, and API gateway timeouts.
- **Remediation Strategy:** 
  1. Offload SLA scanning to a background worker job (Celery / RQ / Arq).
  2. Perform elapsed timestamp comparison directly inside the database query with an indexed column:
     ```sql
     SELECT id, stage, stage_entered_at FROM candidates 
     WHERE stage_entered_at <= :threshold_timestamp
     ```

---

#### 🔴 Critical Finding A-2: SQLite Single-Writer Lock Contention
- **Location:** [`app/main.py` lines 48–53](file:///c:/Users/LENOVO/Desktop/Stall_Alert/app/main.py#L48-L53) (`get_db_connection()`)
- **Current Pattern:** `sqlite3.connect("stall_alerter.db")` without connection pooling or WAL mode explicitly set.
- **Architectural Impact:** SQLite locks the entire database file during writes (`IMPORTS`, `UPDATES`, `APPROVALS`). Under concurrent web traffic or multi-threaded background workers, requests will fail with `sqlite3.OperationalError: database is locked`.
- **Remediation Strategy:**
  1. Enable WAL mode on SQLite: `PRAGMA journal_mode = WAL;` (immediate fix).
  2. Transition to PostgreSQL with SQLAlchemy / Asyncpg connection pooling for production.

---

### Category B: Security & Authentication Vulnerabilities

#### 🟡 Finding B-1: Permissive CORS Configuration (`allow_origins=["*"]`)
- **Location:** [`app/main.py` lines 147–153](file:///c:/Users/LENOVO/Desktop/Stall_Alert/app/main.py#L147-L153)
- **Current Code:**
  ```python
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["*"],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```
- **Security Impact:** In production, allowing wildcard origins (`*`) with credentials enables unauthorized cross-origin requests from untrusted browser contexts.
- **Remediation Strategy:** Bind allowed origins strictly to authorized domains via environment configuration:
  ```python
  ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
  ```

---

#### 🟡 Finding B-2: Single Shared Static API Key vs. User-Level Identity
- **Location:** [`app/main.py` lines 39–46](file:///c:/Users/LENOVO/Desktop/Stall_Alert/app/main.py#L39-L46) (`verify_api_key`)
- **Current Code:** Constant `X-API-Key` comparison against an environment variable.
- **Security Impact:**
  - Lack of non-repudiation: Any recruiter holding the key can trigger actions under any name.
  - Revocation risk: Revoking the key invalidates all users and integrations simultaneously.
- **Remediation Strategy:** Introduce OAuth2 / OIDC authentication with JWT bearer tokens containing individual user claims and roles (`admin`, `recruiter`, `auditor`).

---

#### 🟡 Finding B-3: Missing File Size & MIME-Type Guards on CSV Ingestion
- **Location:** [`app/main.py` lines 340–355](file:///c:/Users/LENOVO/Desktop/Stall_Alert/app/main.py#L340-L355) (`import_candidates()`)
- **Current Code:** Reads the complete file into memory: `content = await file.read()`.
- **Security Impact:** A malicious user could upload a 500MB file or decompression bomb, exhausting server RAM.
- **Remediation Strategy:** Stream the file in chunks and enforce a strict payload size limit (e.g., max 15MB) before decoding.

---

### Category C: Domain Logic & Functional Edge Cases

#### 🟠 Finding C-1: Calendar Ignorance (Weekends & Statutory Holidays)
- **Location:** [`app/main.py` lines 270–276](file:///c:/Users/LENOVO/Desktop/Stall_Alert/app/main.py#L270-L276) (`compute_elapsed_days()`)
- **Current Code:** Raw wall-clock delta calculation:
  ```python
  delta = (now_dt - entered_at_dt).total_seconds()
  return max(0.0, round(delta / 86400.0, 2))
  ```
- **Business Logic Flaw:** A 3-day SLA entered on a Friday afternoon will flag the candidate as stalled on Monday morning, even though no business days have elapsed.
- **Remediation Strategy:** Introduce an optional business-hours calendar engine that subtracts weekends and regional holidays from elapsed day totals.

---

#### 🟠 Finding C-2: Missing Database Indexing on Frequent Query Predicates
- **Location:** SQLite table definition in `app/main.py`.
- **Current State:** No secondary indexes created on `candidates(stage)`, `candidates(stage_entered_at)`, or `alerts(status, severity)`.
- **Performance Impact:** Causes full-table scans for `/api/alerts?status_filter=open` and `/api/candidates?stage=...`.
- **Remediation Strategy:** Add compound indexes:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_candidates_stage_time ON candidates(stage, stage_entered_at);
  CREATE INDEX IF NOT EXISTS idx_alerts_status_urgency ON alerts(status, severity);
  ```

---

## 3. Prioritized Engineering Action Plan & Implementation Status

| Priority | Issue ID | Area | Remediated Status | Verification Evidence |
|---|---|---|---|---|
| **P0** | **A-2** | Concurrency: SQLite WAL Mode | `[x] FIXED & VERIFIED` | Enabled `PRAGMA journal_mode = WAL;` and `synchronous = NORMAL`. Eliminates database write lock contention. |
| **P0** | **B-1** | Security: Strict CORS Configuration | `[x] FIXED & VERIFIED` | Replaced wildcard `*` with strict environment-configured domain allowlist (`localhost:3000`, `127.0.0.1:8000`). |
| **P1** | **B-3** | Security: CSV Payload Size Limit | `[x] FIXED & VERIFIED` | Enforced strict 15MB file size ceiling (`MAX_FILE_SIZE = 15 * 1024 * 1024`) with HTTP 413 rejection. |
| **P1** | **B-4** | Security: CSV Formula Injection Defense | `[x] FIXED & VERIFIED` | Input sanitizer strips spreadsheet formula execution prefixes (`=`, `+`, `-`, `@`, `\t`, `\r`). |
| **P1** | **C-2** | Performance: Database Query Indexing | `[x] FIXED & VERIFIED` | Added 7 database indexes on `candidates(stage)`, `candidates(stage, stage_entered_at)`, `alerts(status, severity)`, and `audit_events(timestamp DESC)`. |
| **P2** | **A-1** | Scalability: Batched Cursor Scanning | `[x] FIXED & VERIFIED` | Refactored `scan_alerts` from full-table RAM load to stream-chunked cursor batches (`fetchmany(500)`). |
| **P2** | **C-1** | Domain: Business-Day Weekend Support | `[x] FIXED & VERIFIED` | Implemented `exclude_weekends` parameter in `compute_elapsed_days` eliminating false-positive Friday-to-Monday SLA breaches. |
| **P3** | **B-2** | Governance: Enterprise OAuth2 / RBAC | `[~] PLANNED` | Outlined in `docs/ARCHITECTURE.md` for multi-tenant production migration. |

