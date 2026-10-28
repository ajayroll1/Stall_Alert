# STALL ALERTER — Technology Stack Specification

**Document Version:** 2.0.0  
**Last Updated:** October 28, 2026  
**Status:** Active & Verified in Repository  

---

## 1. Architecture Overview
Stall Alerter is built as a high-performance **modular monolith** with clear boundary separation between the API layer, deterministic domain engine, persistence layer, and responsive operations frontend console.

```
┌────────────────────────────────────────────────────────┐
│             Web UI Operations Console                 │
│    (HTML5, Modern CSS Design Tokens, Vanilla ES6 JS)   │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP / JSON API (X-API-Key)
┌──────────────────────────▼─────────────────────────────┐
│                 FastAPI API Gateway                    │
│    (ASGI, Route Handlers, Security Dependencies)        │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
┌──────────────▼─────────────┐ ┌──────────▼──────────────┐
│  Deterministic SLA Engine  │ │ Human Approval & Draft  │
│  - Timezone-aware UTC math │ │ - Evidence-based neutral│
│  - Severity Classifier     │ │ - Gated State Machine   │
└──────────────┬─────────────┘ └──────────┬──────────────┘
               │                          │
┌──────────────▼──────────────────────────▼──────────────┐
│              Relational Persistence Layer              │
│   SQLite 3 (Local / Dev)  ──▶  PostgreSQL (Target Prod)│
│   - Candidates   - SLA Rules   - Alerts   - Audit Logs │
└────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Technology Stack Breakdown

### A. Backend Services & Application Framework
| Technology | Version / Spec | Category | Role in System & Technical Rationale |
|---|---|---|---|
| **Python** | `3.14.7` (3.10+ compatible) | Programming Language | Core backend language providing high maintainability, strong typing, and rich data manipulation capabilities. |
| **FastAPI** | `0.141.1` (`>=0.115.0`) | Web Framework | Modern, high-performance async ASGI web framework for building typed RESTful APIs with automatic OpenAPI (Swagger) generation. |
| **Uvicorn** | `0.54.0` | ASGI Server | Lightning-fast ASGI web server implementation for Python. |
| **Pydantic v2** | `2.13.5` (`pydantic-core 2.46.5`) | Schema Validation & Serialization | High-throughput data validation and settings management with runtime type safety. |
| **Python-Multipart** | `0.0.32` | Form / File Streaming | Efficient streaming parser for processing CSV and multi-part ATS file uploads. |

---

### B. Persistence, Storage & Data Integrity
| Technology | Engine / Format | Purpose & Implementation Details |
|---|---|---|
| **SQLite 3** | `sqlite3` driver with `PRAGMA foreign_keys = ON;` | Zero-configuration relational database for local development, tests, and self-contained deployments. |
| **PostgreSQL** *(Production Target)* | Managed PostgreSQL | Production database target specified in architecture blueprint for multi-instance scaling, row locking, and encrypted backups. |
| **Relational Schemas** | ACID Relational Model | Normalized tables for `candidates`, `rules`, `alerts`, `actions`, and immutable `audit_events`. |
| **Idempotency Control** | Unique Constraints (`external_id`) | Idempotent upserts prevent duplicate alerts or re-created candidate records upon repeated syncs. |

---

### C. Frontend Architecture & Design System
| Technology | Implementation | Aesthetic & Architectural Decisions |
|---|---|---|
| **Next.js (React 19)** | `web/` (App Router, Turbopack) | Production React framework providing typed client components, state management, fast page loads, and modular UI structure. |
| **TypeScript** | `v5+` | Strict static typing for all frontend API models, state transitions, and UI event handlers. |
| **Modern Custom CSS** | Design Tokens (`globals.css`) | **Calm B2B Recruiting Aesthetic:** Warm off-white surfaces (`#f9f8f6`), charcoal typography (`#1d2125`), muted forest-green brand accents (`#1e3d34`), and semantic urgency badges (amber, coral, crimson). No bloated UI dependencies. |
| **Modal Dialogs & Toasts** | Custom Accessible Overlay System | Accessible popups for CSV file uploads and follow-up draft review/approval with backdrop filters and floating toast feedback. |
| **Vanilla Console Fallback** | `frontend/` (Static HTML5/ES6) | Lightweight embedded console served directly by FastAPI at `/console/` for zero-node footprint deployments. |

---

### D. Quality Assurance, Testing & CI/CD
| Tool | Version / Spec | Purpose |
|---|---|---|
| **Pytest** | `9.2.0` | Comprehensive test runner verifying SLA boundary math, draft generation, auth gates, and end-to-end flows. |
| **HTTPX / TestClient** | `0.28.1` | High-fidelity HTTP client for API contract and integration testing. |
| **GitHub Actions** | Workflow (`.github/workflows/ci.yml`) | Automated continuous integration verifying Python syntax, requirements installation, and test execution on push and PR. |

---

### E. Containerization & Deployment
| Tool | Configuration | Role |
|---|---|---|
| **Docker** | Multi-stage `python:3.11-slim` base | Reproducible production container image with built-in health checks (`curl /health`). |
| **Docker Compose** | `docker-compose.yml` (v3.8) | One-command orchestration mounting persistent data volumes and defining environment boundaries. |

---

### F. Security, AI Safeguards & Governance
| Component | Implementation | Standard |
|---|---|---|
| **Authentication** | `X-API-Key` Request Header | Enforced on all operational endpoints (`/api/*`), rejecting unauthorized requests with HTTP 401. |
| **Deterministic Rule Primacy** | Pure Python Domain Math | SLA calculations, idle days, and severity ranking are 100% deterministic, preventing LLM hallucination in calculations. |
| **Human-in-the-Loop Governance** | Gated State Machine (`draft` ➔ `approved`/`rejected`) | No external candidate communications are dispatched autonomously. Explicit recruiter authorization is required. |
| **Audit Trails** | Append-only `audit_events` | Immutable chronological event logging tracking actor, action, timestamp, and target entity for compliance. |
| **Injection Defense** | Parameterized SQL & CSV sanitization | All database operations use parameter bindings (`?`); CSV cells are sanitized against formula injection (`=`, `@`, `+`, `-`). |

---

## 3. Directory Structure
```text
Stall_Alert/
├── app/
│   ├── __init__.py           # Package init with version
│   └── main.py               # FastAPI backend, schemas, SQLite persistence & endpoints
├── docs/
│   ├── AI_GUARDRAILS.md      # AI safety boundary & human approval policies
│   ├── API.md                # Endpoint schema & authentication reference
│   ├── ARCHITECTURE.md       # High-level architecture & data flows
│   ├── IMPLEMENTATION_PLAN.md# Task checklist with verification statuses
│   ├── SECURITY.md           # Threat model, attack vectors & mitigations
│   └── TECH_STACK.md         # Full technical stack specification (this file)
├── examples/
│   └── candidates.csv        # Realistic synthetic candidate pipeline dataset
├── frontend/
│   ├── app.js                # Frontend controller handling API fetch and UI state
│   ├── index.css             # Production B2B design system & CSS tokens
│   └── index.html            # Responsive operations console UI
├── tests/
│   └── test_logic.py         # 6 automated Pytest unit and integration tests
├── .env.example              # Non-sensitive environment variable template
├── .github/workflows/ci.yml  # GitHub Actions automated CI workflow
├── Dockerfile                # Production Docker container build
├── docker-compose.yml        # Orchestrated multi-container configuration
├── README.md                 # Live project overview & run instructions
└── requirements.txt          # Pinned Python package dependencies
```
