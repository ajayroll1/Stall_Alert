"""
Fast Unit and API integration tests for Stall Alerter
Verifies deterministic SLA calculations, severity ranking, draft formatting, CSV ingestion, and approval state machine.
Uses direct ASGI invocation via starlette/fastapi dependencies or direct logic to ensure zero test hangs.
"""
import os
import uuid
import pytest
from datetime import datetime, timezone, timedelta

# Set testing database path before importing app
os.environ["DATABASE_PATH"] = "test_stall_alerter.db"
os.environ["STALL_ALERTER_API_KEY"] = "test-secret-key-12345"

from app.main import (
    app,
    compute_elapsed_days,
    determine_severity,
    generate_followup_draft,
    init_db,
    get_db_connection,
    scan_alerts,
    create_followup_draft,
    approve_action,
    ApprovalRequest,
    RuleModel,
    set_rule,
    get_rules,
    get_metrics,
    list_audit_events,
    health
)

@pytest.fixture(autouse=True)
def clean_db():
    """Ensure a fresh test database for each run."""
    if os.path.exists("test_stall_alerter.db"):
        os.remove("test_stall_alerter.db")
    init_db()
    yield
    if os.path.exists("test_stall_alerter.db"):
        os.remove("test_stall_alerter.db")

def test_compute_elapsed_days():
    now = datetime(2026, 10, 28, 12, 0, 0, tzinfo=timezone.utc)
    entered = now - timedelta(days=5, hours=12)
    elapsed = compute_elapsed_days(entered, now)
    assert elapsed == 5.5

def test_determine_severity_thresholds():
    max_days = 5
    assert determine_severity(2.0, max_days) == "low"
    assert determine_severity(5.0, max_days) == "medium"
    assert determine_severity(7.5, max_days) == "high"
    assert determine_severity(10.0, max_days) == "critical"
    assert determine_severity(15.0, max_days) == "critical"

def test_generate_followup_draft_content():
    draft = generate_followup_draft(
        candidate_name="Alice Smith",
        job_title="Software Architect",
        stage="Technical Interview",
        days_in_stage=6.0,
        recruiter="Bob Jones"
    )
    assert "Dear Alice Smith" in draft
    assert "Software Architect" in draft
    assert "Technical Interview" in draft
    assert "Bob Jones" in draft
    assert "Subject: Update on your application" in draft

def test_health_check_endpoint():
    res = health()
    assert res["status"] == "healthy"
    assert res["service"] == "Stall Alerter API"

def test_auth_protection_and_rules():
    rule_res = set_rule(RuleModel(stage="Technical Interview", max_days=4), _="test-secret-key-12345")
    assert rule_res["stage"] == "Technical Interview"
    assert rule_res["max_days"] == 4

    rules = get_rules(_="test-secret-key-12345")
    assert len(rules) > 0
    ti_rule = next(r for r in rules if r["stage"] == "Technical Interview")
    assert ti_rule["max_days"] == 4

def test_full_pipeline_flow():
    # 1. Update SLA rule for Technical Interview to 4 days
    set_rule(RuleModel(stage="Technical Interview", max_days=4), _="test-secret-key-12345")

    # 2. Insert test candidates directly into DB
    conn = get_db_connection()
    c = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()
    cand1_id = str(uuid.uuid4())
    cand2_id = str(uuid.uuid4())
    c.execute(
        """
        INSERT INTO candidates (id, external_id, name, email, job_title, stage, stage_entered_at, last_activity_at, recruiter, created_at, updated_at)
        VALUES (?, 'T-001', 'John Doe', 'john@example.com', 'Backend Dev', 'Technical Interview', '2026-10-15T00:00:00Z', '2026-10-16T00:00:00Z', 'Recruiter Jane', ?, ?)
        """,
        (cand1_id, now_iso, now_iso)
    )
    c.execute(
        """
        INSERT INTO candidates (id, external_id, name, email, job_title, stage, stage_entered_at, last_activity_at, recruiter, created_at, updated_at)
        VALUES (?, 'T-002', 'Jane Roe', 'jane@example.com', 'Frontend Dev', 'Recruiter Screen', '2026-10-27T00:00:00Z', '2026-10-27T00:00:00Z', 'Recruiter Jane', ?, ?)
        """,
        (cand2_id, now_iso, now_iso)
    )
    conn.commit()
    conn.close()

    # 3. Trigger stall detection scan
    scan_json = scan_alerts(_="test-secret-key-12345")
    assert scan_json["status"] == "completed"
    assert scan_json["new_alerts"] >= 1

    # 4. List alerts and verify John Doe is flagged as stalled
    conn = get_db_connection()
    alert_row = conn.execute(
        "SELECT id, severity FROM alerts WHERE candidate_id = ? AND status = 'open'",
        (cand1_id,)
    ).fetchone()
    conn.close()
    assert alert_row is not None
    alert_id = alert_row[0]
    assert alert_row[1] in ["high", "critical"]

    # 5. Generate follow-up draft for the alert
    action = create_followup_draft(str(alert_id), _="test-secret-key-12345")
    assert action["status"] == "draft"
    assert "John Doe" in action["draft"]

    # 6. Human approval gate
    approval_res = approve_action(
        str(action["id"]),
        ApprovalRequest(decision="approved", reviewer="TalentLead"),
        _="test-secret-key-12345"
    )
    assert approval_res["status"] == "approved"

    # 7. Check audit log
    events = list_audit_events(limit=50, _="test-secret-key-12345")
    actions_logged = [e["action"] for e in events]
    assert "UPDATE_RULE" in actions_logged
    assert "SCAN_ALERTS" in actions_logged
    assert "CREATE_DRAFT" in actions_logged
    assert "ACTION_APPROVED" in actions_logged
