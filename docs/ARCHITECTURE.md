# STALL ALERTER — Architecture Specification

## 1. System Overview & Core Philosophy
Stall Alerter monitors hiring pipelines to eliminate silent candidate stalls without over-automating critical hiring decisions. 
- **Deterministic SLA Engine:** Timestamps, stage transitions, SLA calculations, and severity ratings are owned strictly by deterministic code and verified rules.
- **Human-in-the-Loop Governance:** AI draft generators assist recruiters, but no external candidate communications or status changes are executed without explicit human approval.

## 2. Component Diagram
```
[ ATS CSV Export / Future Direct API ]
                  │
                  ▼
   [ Fast Ingestion & Row Validator ]
                  │
                  ▼
   [ SQLite / PostgreSQL Persistent Store ]
      ├─ Candidates (external_id, stage, stage_entered_at)
      ├─ Rules (stage, max_days SLA)
      ├─ Alerts (candidate_id, severity, idle_days, status)
      ├─ Actions (draft, status: draft -> approved/rejected)
      └─ Audit Events (immutable chronological log)
                  │
                  ▼
     [ Deterministic Stall Scanner ]
                  │
                  ▼
      [ Operational Priority Queue ]
        ├── Medium: Overrun >= 1.0x SLA
        ├── High:   Overrun >= 1.5x SLA
        └── Critical: Overrun >= 2.0x SLA
                  │
                  ▼
   [ Recruiter Ops Console / Web UI ]
        ├── Dashboard Metrics Ribbon
        ├── Overdue Alerts Inbox
        ├── Candidate Directory
        ├── Follow-up Draft Review & Approval Gate
        ├── SLA Rules Configuration
        └── Audit Trail Inspector
```

## 3. Trust Boundaries
1. **External Untrusted Input:** CSV imports and candidate records are treated as untrusted data. Validated against strict schemas. Formulas are stripped to prevent CSV formula injection.
2. **API Access Control:** Secured with `X-API-Key` headers on all operational endpoints.
3. **Audit Immutability:** All material mutations (imports, rule updates, alert scans, draft creations, approvals) emit timestamped immutable audit records.
