# STALL ALERTER — Security Engineering Specification & Threat Model

## 1. Threat Model & Mitigations

| Threat Vector | Severity | Vulnerability Description | Remediation in Code |
|---|---|---|---|
| **CSV Formula Injection** | High | Excel execution via `=cmd|...` or `@SUM` formulas | Stripped and sanitized during row normalization; strict schema parsing. |
| **Unauthorized Operational Access** | High | Unauthenticated access to pipeline data or approvals | Enforced `X-API-Key` validation on all `/api/*` endpoints with HTTP 401. |
| **SQL Injection** | Critical | Arbitrary query execution via search or import parameters | Parameterized SQL queries everywhere via `sqlite3` driver. Zero string concatenation. |
| **Unbounded File Uploads** | Medium | Large file uploads causing memory exhaustion | Capped upload reading, UTF-8 decoding verification, file extension restriction (`.csv`). |
| **Unauthorized External Messaging** | High | Autonomous AI agents emailing candidates mistakenly | State machine strictly enforces `draft` -> `approved` state transition. No auto-send. |
| **Cross-Tenant Data Exposure** | Critical | Future multi-tenant leakage | Relational schemas designed with tenant-scoped foreign keys and audit logging. |

## 2. Secrets Management
- No hardcoded API keys or credentials in source code.
- `.env.example` provides non-sensitive placeholders.
- Runtime reads `STALL_ALERTER_API_KEY` from process environment variables.
