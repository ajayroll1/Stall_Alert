# STALL ALERTER
> **Production-Grade, Security-First, AI-Enabled Hiring Pipeline Stall Detection & Operational Workflow Automation**

[![CI Pipeline](https://github.com/ajayroll1/Stall_Alert/actions/workflows/ci.yml/badge.svg)](https://github.com/ajayroll1/Stall_Alert/actions)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015%20(React%2019)-black?style=flat&logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.141+-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.14+-3776ab?style=flat&logo=python)](https://www.python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

---

## Executive Summary & Product Mission
Hiring velocity suffers when candidates sit unattended in recruiting pipeline stages without timely follow-ups. **Stall Alerter** provides operations teams with transparent, explainable alerts when candidates exceed stage-specific Service Level Agreements (SLAs).

> **Safety & Fairness Boundary:**  
> Stall Alerter is strictly a **recruiting operations coordination tool**, NOT an automated decision-maker. It never calculates employability scores, infers protected characteristics, or decides candidate suitability. Alert severity represents **operational urgency**, never candidate merit. External candidate communications require explicit authorized human approval.

---

## System Architecture & Workflow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Recruiter Web Console                           │
│     (Next.js 15, React 19, TypeScript, WCAG 2.2 AA Accessible UI)     │
│       • Overdue Alerts Inbox       • Candidate Search Directory        │
│       • Follow-up Approval Queue   • Stage SLA Rule Configuration      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / JSON (X-API-Key Protected)
┌───────────────────────────────────▼────────────────────────────────────┐
│                       FastAPI API Gateway                              │
│       • Schema Validation (Pydantic v2) • Audit Event Logger           │
│       • Streaming CSV Ingestion Engine  • Security Auth Dependencies   │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
┌───────────────────▼──────────────────┐ ┌───────────▼───────────────────┐
│     Deterministic SLA Engine         │ │   Human-in-the-Loop Gateway   │
│  • Timezone-aware UTC elapsed math   │ │  • Evidence-based follow-ups  │
│  • Severity Ranking:                 │ │  • State Machine:             │
│    - Critical: >= 2.0x SLA           │ │    draft -> approved/rejected │
│    - High:     >= 1.5x SLA           │ │  • Recruiter review & signoff │
│    - Medium:   >= 1.0x SLA           │ │  • Zero autonomous auto-sends │
└───────────────────┬──────────────────┘ └───────────┬───────────────────┘
                    │                                │
┌───────────────────▼────────────────────────────────▼───────────────────┐
│                    ACID Relational Persistence                         │
│       SQLite 3 (Dev / Local)  ──▶  Managed PostgreSQL (Prod Target)    │
│       Tables: candidates, rules, alerts, actions, audit_events         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Core Features & Capabilities

1. **Deterministic SLA Monitoring:** Evaluates candidate time-in-stage using UTC math. Zero LLM hallucinations in SLA calculations.
2. **Deduplicated Ingestion:** Validates candidate CSV exports, protects against CSV formula injection, and performs idempotent upserts on `external_id`.
3. **Operational Severity Ranking:** Automatic categorization into `Critical`, `High`, and `Medium` overdue alerts.
4. **Human-in-the-Loop Outreach:** Evidence-based, neutral communication drafting with explicit recruiter review and approval gates.
5. **Immutable Audit Trail:** Append-only chronological logging of every import, rule edit, scan, draft, and approval.
6. **Dual Frontend Options:**
   - **Modern Next.js 15 (React 19, TS):** Client-side reactive console with responsive mobile layouts, dynamic filters, pagination, and micro-animations.
   - **Embedded Vanilla Console:** Lightweight zero-node fallback served directly by FastAPI at `/console/`.

---

## Complete Technology Stack

| Layer | Technology | Specification / Version |
|---|---|---|
| **Web Frontend** | **Next.js 15+ (React 19)** | TypeScript 5+, Turbopack, Accessible Modals, Toast Feedback, Smooth Animations |
| **Styling** | **Custom CSS Design Tokens** | Warm B2B aesthetic (`#f9f8f6`, charcoal `#1d2125`, forest green `#1e3d34`) |
| **Backend API** | **FastAPI** | Python 3.10+ (tested on Python 3.14), Uvicorn ASGI |
| **Data Validation** | **Pydantic v2** | Strict schema validation (`pydantic-core 2.46+`) |
| **Database** | **SQLite / PostgreSQL** | Relational schema with foreign keys and idempotent upserts |
| **Testing** | **Pytest 9.2+** | Unit, API contract, and integration tests |
| **CI/CD & DevOps** | **GitHub Actions**, **Docker** | Reproducible multi-stage Dockerfile and automated workflow |

---

## Quick Start Guide

### Prerequisites
- **Python 3.10+** (Tested on Python 3.14.7)
- **Node.js 18+** & npm (Tested on Node v24.20.0)

### 1. Clone & Setup Repository
```bash
git clone https://github.com/ajayroll1/Stall_Alert.git
cd Stall_Alert
```

### 2. Install Dependencies
```powershell
# Python Backend Dependencies
pip install -r requirements.txt

# Next.js Frontend Dependencies
cd web
npm install
cd ..
```

### 3. Run the Servers

#### Option A: One-Click Windows Launcher
Double-click [`start_all.bat`](file:///start_all.bat) or run:
```powershell
.\start_all.bat
```

#### Option B: Separate Terminals
```powershell
# Terminal 1 - Start FastAPI Backend (Port 8000)
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2 - Start Next.js Frontend (Port 3000)
cd web
npm run dev
```

### 4. Access Interfaces
- **Next.js Web App:** [http://localhost:3000](http://localhost:3000)
- **Interactive API Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check Probe:** [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

## Testing & Verification

Run the comprehensive automated pytest suite:
```powershell
python -m pytest tests/test_logic.py -v
```

**Observed Test Results (100% Passed):**
```text
tests/test_logic.py::test_compute_elapsed_days PASSED           [ 16%]
tests/test_logic.py::test_determine_severity_thresholds PASSED  [ 33%]
tests/test_logic.py::test_generate_followup_draft_content PASSED[ 50%]
tests/test_logic.py::test_health_check_endpoint PASSED          [ 66%]
tests/test_logic.py::test_auth_protection_on_rules PASSED       [ 83%]
tests/test_logic.py::test_full_pipeline_flow PASSED             [100%]

======================== 6 passed in 0.91s ========================
```

---

## Security & Compliance
- **API Key Authentication:** Protected via `X-API-Key` headers; unauthorized requests return HTTP 401.
- **SQL Injection Defense:** Strict parameterized SQL queries across all endpoints.
- **Formula Injection Defense:** CSV cells sanitized against spreadsheet formula exploitation (`=`, `@`, `+`, `-`).
- **No Autonomous Actions:** Outbound messaging is strictly locked behind a human approval gate (`POST /api/actions/{id}/approval`).

---

## Documentation Index
- [`docs/TECH_STACK.md`](docs/TECH_STACK.md) — Comprehensive technical stack specification.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Architectural design, data flows, and trust boundaries.
- [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) — Master implementation checklist with verified task statuses.
- [`docs/SECURITY.md`](docs/SECURITY.md) — Threat model, security review, and mitigations.
- [`docs/AI_GUARDRAILS.md`](docs/AI_GUARDRAILS.md) — AI safety policies and human-in-the-loop review criteria.
- [`docs/API.md`](docs/API.md) — REST API schemas, endpoints, and authentication guide.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Production container deployment, backups, and operations runbook.
