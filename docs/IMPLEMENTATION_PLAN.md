# STALL ALERTER — Master Implementation & Verification Plan
**Repository Baseline Date:** October 28, 2026  
**Stack:** FastAPI 0.115+, SQLite (dev) / PostgreSQL (target), Vanilla HTML5/CSS3/ES6 Modern Ops UI, Pytest 9.2+

---

## Task Matrix & Implementation Status

| Task ID | Component / Requirement | Owner Role | Status | Acceptance Criteria & Verification Evidence |
|---|---|---|---|---|
| **BASE-001** | Inspect repository, requirements, blueprints | Principal Architect | `[x] VERIFIED` | Reviewed Master Prompt, Implementation Doc v2.0, Production Blueprint, Submission Guide. |
| **BASE-002** | Test baseline execution & environment verification | DevOps Engineer | `[x] VERIFIED` | Python 3.14.7, Node v24.20.0, Pytest 9.2.0 installed & running. |
| **BASE-003** | Gap analysis & risk assessment | Security & Tech Lead | `[x] VERIFIED` | Documented in `docs/ARCHITECTURE.md` and `docs/SECURITY.md`. |
| **DOC-001** | Master Implementation Plan & README | Technical Writer | `[x] VERIFIED` | `README.md` and `docs/IMPLEMENTATION_PLAN.md` created with verified tracking. |
| **ARCH-001** | Architecture, data flow & boundary specs | Principal Architect | `[x] VERIFIED` | `docs/ARCHITECTURE.md` with system boundary diagrams and models. |
| **CORE-001** | Canonical Application Schema & Persistence | Backend Engineer | `[x] VERIFIED` | SQLite schema with foreign keys, tables: `rules`, `candidates`, `alerts`, `actions`, `audit_events`. |
| **CORE-002** | CSV Ingestion & Row Validation | Backend Engineer | `[x] VERIFIED` | Validates headers, rows, idempotently upserts candidates on `external_id`. Tested via Pytest. |
| **CORE-003** | Canonical Stage Mapping & Rules | Backend Engineer | `[x] VERIFIED` | Configurable stage SLA thresholds via `/api/rules` PUT/GET. |
| **CORE-004** | Configurable SLA Rules Engine | Backend Engineer | `[x] VERIFIED` | Verified with unit tests in `tests/test_logic.py`. |
| **CORE-005** | Timezone-safe Stall Scanner | Backend Engineer | `[x] VERIFIED` | Deterministic UTC math, elapsed days calculation, severity ranking (`low`, `medium`, `high`, `critical`). |
| **CORE-006** | Deduplicated Alert Lifecycle & Reconcile | Backend Engineer | `[x] VERIFIED` | Upgrades open alerts or resolves alerts when candidates move out of stalled state. |
| **CORE-007** | Immutable Audit Log Trail | Security Engineer | `[x] VERIFIED` | Every import, rule update, scan, draft, and approval is recorded in `audit_events`. |
| **CORE-008** | Unit & Integration Test Automation | QA Engineer | `[x] VERIFIED` | `python -m pytest tests/test_logic.py` executed: **6 passed in 0.91s**. |
| **UI-001** | Design Tokens & Responsive Operations UI | UI/UX Designer | `[-] IN PROGRESS` | Clean B2B recruiting console (warm off-white, dark charcoal, sage/amber/crimson semantic indicators). |
| **UI-002** | Alert Inbox & Operational Dashboard | Frontend Engineer | `[-] IN PROGRESS` | Interactive dashboard connected to `/api/alerts`, `/api/metrics`, `/api/rules`. |
| **UI-003** | Alert Detail, Reason & Timeline Modal | Frontend Engineer | `[-] IN PROGRESS` | Shows candidate data, idle days, stage, SLA threshold, reason, and draft follow-up button. |
| **UI-004** | CSV Upload Wizard with Preview & Errors | Frontend Engineer | `[-] IN PROGRESS` | Drag & drop or file selection, live import summary, row error indicators. |
| **UI-005** | Stage SLA Settings Panel | Frontend Engineer | `[-] IN PROGRESS` | Edit SLA days per stage dynamically with instant update to backend. |
| **UI-006** | Follow-up Draft Review & Approval Gate | Frontend Engineer | `[-] IN PROGRESS` | Recruiter can review neutral draft, edit text, approve or reject. |
| **SEC-001** | Threat Model & Trust Boundaries | Security Engineer | `[x] VERIFIED` | Documented in `docs/SECURITY.md`. |
| **SEC-002** | API-Key Authentication Header | Security Engineer | `[x] VERIFIED` | Protected by `X-API-Key` header with 401 response on unauthorized access. Verified in unit tests. |
| **SEC-005** | Input Validation, Injection & Rate Limits | Security Engineer | `[x] VERIFIED` | Pydantic v2 schemas, parameter constraints, no SQL injection (parameterized queries). |
| **AI-001** | Safe AI Policy & Guardrails | AI Engineer | `[x] VERIFIED` | Non-autonomous AI; deterministic fallback; documented in `docs/AI_GUARDRAILS.md`. |
| **AI-003** | Neutral Follow-up Draft Generator | AI Engineer | `[x] VERIFIED` | Verified in unit test `test_generate_followup_draft_content`. |
| **OPS-001** | CI Workflow & Reproducible Build | DevOps Engineer | `[x] VERIFIED` | GitHub Actions workflow `.github/workflows/ci.yml` and Dockerfile / compose specs. |
| **OPS-002** | Production Deployment Runbook | SRE Engineer | `[x] VERIFIED` | `docs/DEPLOYMENT.md` and `docs/OPERATIONS_RUNBOOK.md`. |
