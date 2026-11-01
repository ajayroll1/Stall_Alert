# STALL ALERTER — Architecture Specification (v2.5.0)

## 1. System Overview & Core Philosophy
Stall Alerter is a high-reliability hiring pipeline monitoring and recruiter decision-support system. It protects candidate engagement, hiring team brand reputation, and recruitment throughput by preventing candidates from silently stalling at critical interview stages.

### Guiding Principles
- **Strictly Deterministic SLA Calculations:** Timestamps, idle day calculations, breach detections, and severity tiering are 100% mathematical and rule-governed.
- **Human-in-the-Loop Governance:** AI drafts communications, but zero external messages or stage changes ever leave the system without explicit, authenticated recruiter sign-off.
- **Immutable Audit Trail:** Every ingest, scan, alert transition, draft edit, approval, rejection, and stage advance is recorded permanently with full provenance.
- **Zero Hallucination Surface:** AI is quarantined strictly to communication drafting and summarization; it has zero authority to alter candidate records, delete data, or bypass SLA rules.

---

## 2. High-Level Architecture Diagram

```mermaid
graph TD
    subgraph DataIngestion ["1. Data Ingestion & Storage"]
        CSV[ATS CSV File / Upload] --> IngestValidator[FastAPI Ingest Validator]
        IngestValidator --> DB[(Persistent Database: SQLite / Neon Postgres)]
        DB --> CandidatesTable[candidates]
        DB --> RulesTable[rules]
        DB --> FilesTable[uploaded_files]
    end

    subgraph DeterministicEngine ["2. Deterministic SLA Engine"]
        CandidatesTable --> Scanner[Stall Scanner Engine]
        RulesTable --> Scanner
        Scanner -->|Math: now - stage_entered_at > max_days| AlertGenerator[Alert Generator & Priority Queue]
        AlertGenerator --> AlertsTable[alerts]
    end

    subgraph GovernanceQueue ["3. Recruiter Governance & Outreach"]
        AlertsTable --> DraftService[Template / Neutral AI Drafter]
        DraftService --> ActionsTable[actions]
        ActionsTable --> ReviewModal[Review & Approve Modal UI]
        ReviewModal -->|One-Click Approve| DecisionGate{Recruiter Decision}
        DecisionGate -->|Approved| SMTP[Real SMTP Dispatcher]
        DecisionGate -->|Advance Stage Option| StageTransition[Reset Dwell to 0.0d]
        StageTransition --> CandidatesTable
        DecisionGate -->|Auto-Resolve| AlertsTable
        DecisionGate -->|Rejected| ActionDiscard[Discard Draft]
    end

    subgraph AuditLayer ["4. Immutable Governance Trail"]
        IngestValidator -.-> AuditLog[audit_events Table]
        Scanner -.-> AuditLog
        DecisionGate -.-> AuditLog
        StageTransition -.-> AuditLog
    end

    classDef store fill:#f8fafc,stroke:#64748b,stroke-width:2px;
    classDef engine fill:#eff6ff,stroke:#2563eb,stroke-width:2px;
    classDef ui fill:#ecfdf5,stroke:#059669,stroke-width:2px;
    class DB,AuditLog store;
    class Scanner,AlertGenerator engine;
    class ReviewModal,DecisionGate ui;
```

---

## 3. Data Model & Entity Relations (ERD)

```mermaid
erDiagram
    UPLOADED_FILES ||--o{ CANDIDATES : "contains"
    CANDIDATES ||--o{ ALERTS : "triggers"
    RULES ||--o{ ALERTS : "governs"
    ALERTS ||--o{ ACTIONS : "generates"
    CANDIDATES ||--o{ AUDIT_EVENTS : "subject_of"

    UPLOADED_FILES {
        string id PK
        string filename
        datetime uploaded_at
        string uploaded_by
        int rows_count
        int errors_count
        int file_size
        string status
        text file_text_content
    }

    CANDIDATES {
        string id PK
        string external_id UK
        string name
        string email
        string job_title
        string stage
        datetime stage_entered_at
        datetime created_at
        datetime updated_at
    }

    RULES {
        string stage PK
        int max_days
        datetime updated_at
    }

    ALERTS {
        string id PK
        string candidate_id FK
        string stage
        float idle_days
        float max_days
        string severity
        string status
        datetime created_at
        datetime resolved_at
    }

    ACTIONS {
        string id PK
        string alert_id FK
        string candidate_id FK
        string type
        string status
        json payload
        string reviewer
        datetime created_at
        datetime decided_at
    }

    AUDIT_EVENTS {
        string id PK
        string event_type
        json payload
        datetime timestamp
    }
```

---

## 4. Operational Sequence: Overdue Alert to Candidate Delivery

```mermaid
sequenceDiagram
    autonumber
    actor Recruiter as Recruiter / Hiring Lead
    participant WebUI as Next.js 16 Web Console
    participant API as FastAPI 0.115 Backend
    participant Scanner as Deterministic Scanner
    participant DB as Persistent Store (SQLite / Postgres)
    participant SMTP as SMTP Mail Gateway

    Recruiter->>WebUI: Click "Scan Alerts"
    WebUI->>API: POST /api/alerts/scan
    API->>Scanner: evaluate_stalls()
    Scanner->>DB: Query candidates joined with rules
    Scanner->>Scanner: Calculate elapsed idle days against SLA
    Scanner->>DB: Upsert open alerts (CRITICAL, HIGH, MEDIUM)
    Scanner-->>WebUI: Scan Complete (Active alerts updated)

    Recruiter->>WebUI: Click "Draft Follow-up"
    WebUI->>API: POST /api/alerts/{id}/draft
    API->>DB: Fetch candidate & stage context
    API->>API: Generate structured, respectful outreach draft
    API->>DB: Insert action record (status: 'draft')
    API-->>WebUI: Draft generated & ready for review

    Recruiter->>WebUI: Open "Review & Approve" Modal
    Note over Recruiter,WebUI: Recruiter can edit message, regenerate draft, or choose stage advance
    Recruiter->>WebUI: Click "Approve Message"
    WebUI->>WebUI: Optimistically close modal & set loading state
    WebUI->>API: POST /api/actions/{id}/approval (decision: approved, advance_stage: Optional)
    API->>DB: Update action status -> 'approved'
    API->>DB: Auto-resolve associated alert -> 'resolved'
    opt Advance Stage Selected
        API->>DB: Update candidate stage_entered_at = now() (reset idle to 0.0d)
    end
    API->>SMTP: Dispatch email to candidate address
    API->>DB: Write immutable audit record
    API-->>WebUI: Success confirmation + Audit persisted
    WebUI-->>Recruiter: Visual Toast & Live Inbox Refresh
```

---

## 5. Security Architecture & Threat Boundaries

1. **Untrusted External Data (CSV Ingestion):**
   - Ingested files undergo row-by-row structural validation.
   - Text fields starting with formula trigger tokens (`=`, `+`, `-`, `@`) are sanitised or quoted to eliminate CSV Formula Injection (Excel Macro attacks).
2. **Deterministic Process Isolation:**
   - LLM generation logic is strictly encapsulated behind the `POST /api/alerts/{id}/draft` and `/regenerate` endpoints. It has no write credentials to the database.
3. **Database Migration & Concurrency:**
   - Automatic SQLite table creation and column alteration migrations (`uploaded_files`, `file_text_content`) run on backend boot (`init_db()`), enabling seamless zero-downtime restarts.
4. **Credential Isolation:**
   - Production API keys and SMTP credentials are provided strictly through system environment variables (`API_KEY`, `SMTP_USER`, `SMTP_PASSWORD`) and are omitted from all Git tracking.
