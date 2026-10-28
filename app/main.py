"""
Stall Alerter - Core Application API
Production-minded, security-first hiring pipeline stall detection and workflow automation.
"""
from __future__ import annotations

import csv
import io
import os
import re
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import Depends, FastAPI, File, Header, HTTPException, Query, Security, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security.api_key import APIKeyHeader
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# -----------------------------------------------------------------------------
# Configuration & Security
# -----------------------------------------------------------------------------
DEFAULT_API_KEY = "dev-stall-alerter-secret-key-32chars-min"
API_KEY = os.getenv("STALL_ALERTER_API_KEY", DEFAULT_API_KEY)
DB_PATH = os.getenv("DATABASE_PATH", "stall_alerter.db")

API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)

def verify_api_key(api_key: Optional[str] = Security(API_KEY_HEADER)) -> str:
    """Validate incoming API key from header."""
    if not api_key or api_key != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-API-Key header",
        )
    return api_key


# -----------------------------------------------------------------------------
# Database Setup & Persistence (SQLite with robust schemas)
# -----------------------------------------------------------------------------
def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db() -> None:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS rules (
            stage TEXT PRIMARY KEY,
            max_days INTEGER NOT NULL CHECK (max_days > 0),
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS candidates (
            id TEXT PRIMARY KEY,
            external_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            job_title TEXT NOT NULL,
            stage TEXT NOT NULL,
            stage_entered_at TEXT NOT NULL,
            last_activity_at TEXT,
            recruiter TEXT,
            source TEXT DEFAULT 'csv_import',
            raw_json TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS alerts (
            id TEXT PRIMARY KEY,
            candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
            stage TEXT NOT NULL,
            days_in_stage REAL NOT NULL,
            severity TEXT NOT NULL,
            reason TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'open',
            created_at TEXT NOT NULL,
            resolved_at TEXT
        );

        CREATE TABLE IF NOT EXISTS actions (
            id TEXT PRIMARY KEY,
            candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
            alert_id TEXT REFERENCES alerts(id) ON DELETE SET NULL,
            action_type TEXT NOT NULL,
            draft TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'draft',
            created_at TEXT NOT NULL,
            approved_at TEXT,
            executed_at TEXT
        );

        CREATE TABLE IF NOT EXISTS audit_events (
            id TEXT PRIMARY KEY,
            actor TEXT NOT NULL,
            action TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            details TEXT,
            timestamp TEXT NOT NULL
        );
    """)

    # Default SLA rules if table is empty
    cursor.execute("SELECT COUNT(*) FROM rules;")
    if cursor.fetchone()[0] == 0:
        default_rules = [
            ("Application Review", 3),
            ("Recruiter Screen", 4),
            ("Hiring Manager Review", 5),
            ("Technical Interview", 5),
            ("Take Home Assignment", 7),
            ("Onsite Interview", 5),
            ("Offer Stage", 3),
            ("Background Check", 7),
        ]
        now_iso = datetime.now(timezone.utc).isoformat()
        cursor.executemany(
            "INSERT INTO rules (stage, max_days, updated_at) VALUES (?, ?, ?);",
            [(stage, days, now_iso) for stage, days in default_rules],
        )

    conn.commit()
    conn.close()

init_db()

# -----------------------------------------------------------------------------
# FastAPI App Definition
# -----------------------------------------------------------------------------
app = FastAPI(
    title="Stall Alerter API",
    version="2.0.0",
    description="Operational hiring pipeline stall detection, SLA monitoring, and recruiter decision support.",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve frontend console static assets
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.exists(frontend_dir):
    app.mount("/console", StaticFiles(directory=frontend_dir, html=True), name="console")

# -----------------------------------------------------------------------------
# Pydantic Models & Schemas
# -----------------------------------------------------------------------------
class RuleModel(BaseModel):
    stage: str = Field(..., min_length=1, max_length=100)
    max_days: int = Field(..., gt=0, description="SLA duration threshold in days")

class CandidateOut(BaseModel):
    id: str
    external_id: str
    name: str
    email: str
    job_title: str
    stage: str
    stage_entered_at: str
    last_activity_at: Optional[str] = None
    recruiter: Optional[str] = None
    created_at: str

class AlertOut(BaseModel):
    id: str
    candidate_id: str
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    job_title: Optional[str] = None
    stage: str
    days_in_stage: float
    severity: str
    reason: str
    status: str
    recruiter: Optional[str] = None
    created_at: str

class ActionOut(BaseModel):
    id: str
    candidate_id: str
    alert_id: Optional[str] = None
    action_type: str
    draft: str
    status: str
    created_at: str
    approved_at: Optional[str] = None
    executed_at: Optional[str] = None

class ApprovalRequest(BaseModel):
    decision: str = Field(..., pattern="^(approved|rejected)$")
    reviewer: Optional[str] = "recruiter_lead"

class AuditLogEntry(BaseModel):
    id: str
    actor: str
    action: str
    entity_type: str
    entity_id: str
    details: Optional[str] = None
    timestamp: str

# -----------------------------------------------------------------------------
# Domain Helpers (Deterministic & Auditable)
# -----------------------------------------------------------------------------
def log_audit(conn: sqlite3.Connection, actor: str, action: str, entity_type: str, entity_id: str, details: str = "") -> None:
    event_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    conn.execute(
        "INSERT INTO audit_events (id, actor, action, entity_type, entity_id, details, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (event_id, actor, action, entity_type, entity_id, details, now_iso)
    )

def parse_iso_or_date(date_str: str) -> Optional[datetime]:
    if not date_str:
        return None
    date_str = date_str.strip()
    # Try ISO formats
    try:
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except ValueError:
        pass
    # Try YYYY-MM-DD
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        return dt.replace(tzinfo=timezone.utc)
    except ValueError:
        return None

def compute_elapsed_days(entered_at_dt: datetime, now_dt: Optional[datetime] = None) -> float:
    if now_dt is None:
        now_dt = datetime.now(timezone.utc)
    delta = (now_dt - entered_at_dt).total_seconds()
    return max(0.0, round(delta / 86400.0, 2))

def determine_severity(elapsed_days: float, max_days: int) -> str:
    """Operational urgency ranking based on threshold overrun factor."""
    if elapsed_days >= (2.0 * max_days):
        return "critical"
    elif elapsed_days >= (1.5 * max_days):
        return "high"
    elif elapsed_days >= float(max_days):
        return "medium"
    return "low"

def generate_followup_draft(candidate_name: str, job_title: str, stage: str, days_in_stage: float, recruiter: Optional[str]) -> str:
    """Deterministic, respectful, neutral draft template."""
    recruiter_sig = recruiter if recruiter else "Talent Operations Team"
    return (
        f"Subject: Update on your application for {job_title} at our company\n\n"
        f"Dear {candidate_name},\n\n"
        f"Thank you very much for your continued interest in the {job_title} role. "
        f"We are writing to provide a transparent update on your status in the {stage} stage. "
        f"Our team is currently finalizing reviews and our hiring committee will follow up directly with next steps within the next 48 hours.\n\n"
        f"We appreciate your patience throughout our process.\n\n"
        f"Best regards,\n{recruiter_sig}\n"
    )

# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------

@app.get("/health", tags=["System"])
def health() -> Dict[str, Any]:
    """Health check endpoint providing service liveness and version info."""
    return {
        "status": "healthy",
        "service": "Stall Alerter API",
        "version": "2.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

@app.get("/api/rules", response_model=List[RuleModel], tags=["Rules"])
def get_rules(_: str = Depends(verify_api_key)) -> List[Dict[str, Any]]:
    """List all configured stage SLA duration thresholds."""
    conn = get_db_connection()
    rows = conn.execute("SELECT stage, max_days FROM rules ORDER BY stage ASC;").fetchall()
    conn.close()
    return [{"stage": r["stage"], "max_days": r["max_days"]} for r in rows]

@app.put("/api/rules", tags=["Rules"])
def set_rule(rule: RuleModel, _: str = Depends(verify_api_key)) -> Dict[str, Any]:
    """Create or update a stage SLA threshold with audit logging."""
    conn = get_db_connection()
    now_iso = datetime.now(timezone.utc).isoformat()
    conn.execute(
        """
        INSERT INTO rules (stage, max_days, updated_at) VALUES (?, ?, ?)
        ON CONFLICT(stage) DO UPDATE SET max_days=excluded.max_days, updated_at=excluded.updated_at;
        """,
        (rule.stage, rule.max_days, now_iso),
    )
    log_audit(conn, actor="admin", action="UPDATE_RULE", entity_type="rule", entity_id=rule.stage, details=f"max_days={rule.max_days}")
    conn.commit()
    conn.close()
    return {"message": f"Rule for '{rule.stage}' updated to {rule.max_days} days.", "stage": rule.stage, "max_days": rule.max_days}

@app.post("/api/candidates/import", tags=["Candidates"])
async def import_candidates(file: UploadFile = File(...), _: str = Depends(verify_api_key)) -> Dict[str, Any]:
    """
    Import candidates from CSV export.
    Validates required columns, sanitizes inputs, handles row errors, and upserts idempotently.
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported.")

    content = await file.read()
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be valid UTF-8 text.")

    reader = csv.DictReader(io.StringIO(text))
    required_cols = {"external_id", "name", "email", "job_title", "stage", "stage_entered_at"}
    if not reader.fieldnames or not required_cols.issubset(set(reader.fieldnames)):
        missing = required_cols - set(reader.fieldnames or [])
        raise HTTPException(
            status_code=422,
            detail=f"CSV is missing required headers: {list(missing)}. Required are: {list(required_cols)}",
        )

    conn = get_db_connection()
    success_count = 0
    errors: List[Dict[str, Any]] = []
    now_iso = datetime.now(timezone.utc).isoformat()

    for idx, row in enumerate(reader, start=2):
        ext_id = (row.get("external_id") or "").strip()
        name = (row.get("name") or "").strip()
        email = (row.get("email") or "").strip()
        job_title = (row.get("job_title") or "").strip()
        stage = (row.get("stage") or "").strip()
        stage_entered_at = (row.get("stage_entered_at") or "").strip()
        last_activity_at = (row.get("last_activity_at") or "").strip()
        recruiter = (row.get("recruiter") or "").strip()

        # Row validations
        if not ext_id or not name or not stage or not stage_entered_at:
            errors.append({"row": idx, "error": "Missing essential candidate fields (external_id, name, stage, or stage_entered_at)."})
            continue

        entered_dt = parse_iso_or_date(stage_entered_at)
        if not entered_dt:
            errors.append({"row": idx, "error": f"Invalid date format for stage_entered_at: '{stage_entered_at}'."})
            continue

        cid = str(uuid.uuid4())
        conn.execute(
            """
            INSERT INTO candidates (
                id, external_id, name, email, job_title, stage, stage_entered_at,
                last_activity_at, recruiter, source, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'csv_import', ?, ?)
            ON CONFLICT(external_id) DO UPDATE SET
                name=excluded.name,
                email=excluded.email,
                job_title=excluded.job_title,
                stage=excluded.stage,
                stage_entered_at=excluded.stage_entered_at,
                last_activity_at=excluded.last_activity_at,
                recruiter=excluded.recruiter,
                updated_at=excluded.updated_at;
            """,
            (cid, ext_id, name, email, job_title, stage, entered_dt.isoformat(), last_activity_at or None, recruiter or None, now_iso, now_iso),
        )
        success_count += 1

    log_audit(conn, actor="operator", action="CSV_IMPORT", entity_type="batch", entity_id=file.filename, details=f"imported={success_count}, errors={len(errors)}")
    conn.commit()
    conn.close()

    return {
        "filename": file.filename,
        "imported_rows": success_count,
        "error_count": len(errors),
        "errors": errors[:50],  # cap preview errors to 50
    }

@app.get("/api/candidates", response_model=List[CandidateOut], tags=["Candidates"])
def list_candidates(
    stage: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(100, le=500),
    _: str = Depends(verify_api_key),
) -> List[Dict[str, Any]]:
    """List imported candidate records with optional stage filter and search."""
    conn = get_db_connection()
    query = "SELECT * FROM candidates WHERE 1=1"
    params: List[Any] = []

    if stage:
        query += " AND stage = ?"
        params.append(stage)
    if search:
        query += " AND (name LIKE ? OR email LIKE ? OR job_title LIKE ?)"
        like_term = f"%{search}%"
        params.extend([like_term, like_term, like_term])

    query += " ORDER BY stage_entered_at ASC LIMIT ?"
    params.append(limit)

    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/alerts/scan", tags=["Alerts"])
def scan_alerts(_: str = Depends(verify_api_key)) -> Dict[str, Any]:
    """
    Deterministic stall scanner.
    Compares candidate stage age against configured stage SLA rules.
    Creates, upgrades, or reconciles alerts idempotently.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    rules = {r["stage"]: r["max_days"] for r in cursor.execute("SELECT stage, max_days FROM rules").fetchall()}
    candidates = cursor.execute("SELECT * FROM candidates").fetchall()

    now_dt = datetime.now(timezone.utc)
    now_iso = now_dt.isoformat()
    new_alerts_count = 0
    resolved_count = 0

    for cand in candidates:
        stage = cand["stage"]
        max_days = rules.get(stage)
        entered_dt = parse_iso_or_date(cand["stage_entered_at"])
        if not entered_dt:
            continue

        elapsed = compute_elapsed_days(entered_dt, now_dt)

        # Check existing open alert for this candidate
        existing_alert = cursor.execute(
            "SELECT * FROM alerts WHERE candidate_id = ? AND status = 'open'",
            (cand["id"],),
        ).fetchone()

        if max_days and elapsed >= float(max_days):
            severity = determine_severity(elapsed, max_days)
            reason = f"Exceeded {max_days}-day SLA for '{stage}' (idle for {elapsed:.1f} days)."

            if existing_alert:
                # Update severity if elapsed time has advanced
                cursor.execute(
                    "UPDATE alerts SET days_in_stage = ?, severity = ?, reason = ? WHERE id = ?",
                    (elapsed, severity, reason, existing_alert["id"]),
                )
            else:
                alert_id = str(uuid.uuid4())
                cursor.execute(
                    """
                    INSERT INTO alerts (id, candidate_id, stage, days_in_stage, severity, reason, status, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, 'open', ?)
                    """,
                    (alert_id, cand["id"], stage, elapsed, severity, reason, now_iso),
                )
                new_alerts_count += 1
        else:
            # Candidate has advanced or is no longer stalled -> resolve existing alert
            if existing_alert:
                cursor.execute(
                    "UPDATE alerts SET status = 'resolved', resolved_at = ? WHERE id = ?",
                    (now_iso, existing_alert["id"]),
                )
                resolved_count += 1

    log_audit(conn, actor="system", action="SCAN_ALERTS", entity_type="alert_engine", entity_id="scan", details=f"new={new_alerts_count}, resolved={resolved_count}")
    conn.commit()
    conn.close()

    return {
        "status": "completed",
        "new_alerts": new_alerts_count,
        "resolved_alerts": resolved_count,
        "timestamp": now_iso,
    }

@app.get("/api/alerts", response_model=List[AlertOut], tags=["Alerts"])
def list_alerts(
    status_filter: str = Query("open", pattern="^(open|resolved|all)$"),
    severity: Optional[str] = None,
    _: str = Depends(verify_api_key),
) -> List[Dict[str, Any]]:
    """List pipeline alerts enriched with candidate metadata, sorted by operational urgency."""
    conn = get_db_connection()
    query = """
        SELECT a.id, a.candidate_id, a.stage, a.days_in_stage, a.severity, a.reason,
               a.status, a.created_at,
               c.name as candidate_name, c.email as candidate_email, c.job_title, c.recruiter
        FROM alerts a
        JOIN candidates c ON a.candidate_id = c.id
        WHERE 1=1
    """
    params: List[Any] = []

    if status_filter != "all":
        query += " AND a.status = ?"
        params.append(status_filter)

    if severity:
        query += " AND a.severity = ?"
        params.append(severity)

    query += """
        ORDER BY 
            CASE a.severity
                WHEN 'critical' THEN 1
                WHEN 'high' THEN 2
                WHEN 'medium' THEN 3
                ELSE 4
            END ASC,
            a.days_in_stage DESC
    """

    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/alerts/{alert_id}/draft", response_model=ActionOut, tags=["Actions"])
def create_followup_draft(alert_id: str, _: str = Depends(verify_api_key)) -> Dict[str, Any]:
    """
    Generate an evidence-based neutral follow-up draft for a stalled application.
    Requires human review and approval before execution.
    """
    conn = get_db_connection()
    alert = conn.execute("""
        SELECT a.*, c.name, c.email, c.job_title, c.recruiter
        FROM alerts a
        JOIN candidates c ON a.candidate_id = c.id
        WHERE a.id = ?
    """, (alert_id,)).fetchone()

    if not alert:
        conn.close()
        raise HTTPException(status_code=404, detail="Alert not found.")

    draft_text = generate_followup_draft(
        candidate_name=alert["name"],
        job_title=alert["job_title"],
        stage=alert["stage"],
        days_in_stage=alert["days_in_stage"],
        recruiter=alert["recruiter"],
    )

    action_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    conn.execute(
        """
        INSERT INTO actions (id, candidate_id, alert_id, action_type, draft, status, created_at)
        VALUES (?, ?, ?, 'email_followup', ?, 'draft', ?)
        """,
        (action_id, alert["candidate_id"], alert_id, draft_text, now_iso),
    )
    log_audit(conn, actor="recruiter", action="CREATE_DRAFT", entity_type="action", entity_id=action_id, details=f"alert={alert_id}")
    conn.commit()

    created = conn.execute("SELECT * FROM actions WHERE id = ?", (action_id,)).fetchone()
    conn.close()
    return dict(created)

@app.get("/api/actions", response_model=List[ActionOut], tags=["Actions"])
def list_actions(status_filter: Optional[str] = None, _: str = Depends(verify_api_key)) -> List[Dict[str, Any]]:
    """List all drafted, approved, and executed actions."""
    conn = get_db_connection()
    query = "SELECT * FROM actions WHERE 1=1"
    params: List[Any] = []
    if status_filter:
        query += " AND status = ?"
        params.append(status_filter)
    query += " ORDER BY created_at DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/actions/{action_id}/approval", tags=["Actions"])
def approve_action(action_id: str, payload: ApprovalRequest, _: str = Depends(verify_api_key)) -> Dict[str, Any]:
    """
    Enforce human-in-the-loop governance: record approval or rejection of an outbound draft.
    Does not silently send external communications without explicit approval.
    """
    conn = get_db_connection()
    action = conn.execute("SELECT * FROM actions WHERE id = ?", (action_id,)).fetchone()
    if not action:
        conn.close()
        raise HTTPException(status_code=404, detail="Action not found.")

    now_iso = datetime.now(timezone.utc).isoformat()
    new_status = payload.decision  # 'approved' or 'rejected'

    conn.execute(
        "UPDATE actions SET status = ?, approved_at = ? WHERE id = ?",
        (new_status, now_iso if new_status == "approved" else None, action_id),
    )
    log_audit(
        conn,
        actor=payload.reviewer or "reviewer",
        action=f"ACTION_{payload.decision.upper()}",
        entity_type="action",
        entity_id=action_id,
        details=f"status set to {new_status}",
    )
    conn.commit()
    conn.close()

    return {
        "action_id": action_id,
        "status": new_status,
        "decision": payload.decision,
        "timestamp": now_iso,
    }

@app.get("/api/audit-events", response_model=List[AuditLogEntry], tags=["Audit"])
def list_audit_events(limit: int = Query(100, le=500), _: str = Depends(verify_api_key)) -> List[Dict[str, Any]]:
    """List chronological immutable audit records for all material system actions."""
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM audit_events ORDER BY timestamp DESC LIMIT ?", (limit,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/api/metrics", tags=["Metrics"])
def get_metrics(_: str = Depends(verify_api_key)) -> Dict[str, Any]:
    """Get operational summary metrics for dashboard and reporting."""
    conn = get_db_connection()
    cand_count = conn.execute("SELECT COUNT(*) FROM candidates").fetchone()[0]
    total_alerts = conn.execute("SELECT COUNT(*) FROM alerts WHERE status = 'open'").fetchone()[0]
    critical_alerts = conn.execute("SELECT COUNT(*) FROM alerts WHERE status = 'open' AND severity = 'critical'").fetchone()[0]
    high_alerts = conn.execute("SELECT COUNT(*) FROM alerts WHERE status = 'open' AND severity = 'high'").fetchone()[0]
    pending_actions = conn.execute("SELECT COUNT(*) FROM actions WHERE status = 'draft'").fetchone()[0]
    approved_actions = conn.execute("SELECT COUNT(*) FROM actions WHERE status = 'approved'").fetchone()[0]
    conn.close()

    return {
        "candidates_tracked": cand_count,
        "open_alerts": total_alerts,
        "critical_alerts": critical_alerts,
        "high_alerts": high_alerts,
        "pending_drafts": pending_actions,
        "approved_drafts": approved_actions,
    }
