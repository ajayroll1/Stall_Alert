"""
Unit and API integration tests for Stall Alerter
Verifies deterministic SLA calculations, severity ranking, draft formatting, CSV ingestion, and approval state machine.
"""
import os
import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient

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
)

client = TestClient(app)
AUTH_HEADER = {"X-API-Key": "test-secret-key-12345"}

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
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "Stall Alerter API"

def test_auth_protection_on_rules():
    # Without header
    res_unauth = client.get("/api/rules")
    assert res_unauth.status_code == 401

    # With valid header
    res_auth = client.get("/api/rules", headers=AUTH_HEADER)
    assert res_auth.status_code == 200
    assert len(res_auth.json()) > 0

def test_full_pipeline_flow():
    # 1. Update SLA rule for Technical Interview to 4 days
    rule_res = client.put(
        "/api/rules",
        headers=AUTH_HEADER,
        json={"stage": "Technical Interview", "max_days": 4}
    )
    assert rule_res.status_code == 200

    # 2. Upload sample CSV file
    csv_data = (
        "external_id,name,email,job_title,stage,stage_entered_at,last_activity_at,recruiter\n"
        "T-001,John Doe,john@example.com,Backend Dev,Technical Interview,2026-10-15T00:00:00Z,2026-10-16T00:00:00Z,Recruiter Jane\n"
        "T-002,Jane Roe,jane@example.com,Frontend Dev,Recruiter Screen,2026-10-27T00:00:00Z,2026-10-27T00:00:00Z,Recruiter Jane\n"
    )
    import_res = client.post(
        "/api/candidates/import",
        headers=AUTH_HEADER,
        files={"file": ("test_candidates.csv", csv_data.encode("utf-8"), "text/csv")}
    )
    assert import_res.status_code == 200
    import_json = import_res.json()
    assert import_json["imported_rows"] == 2
    assert import_json["error_count"] == 0

    # 3. Trigger stall detection scan
    scan_res = client.post("/api/alerts/scan", headers=AUTH_HEADER)
    assert scan_res.status_code == 200
    scan_json = scan_res.json()
    assert scan_json["new_alerts"] >= 1

    # 4. List alerts and verify John Doe is flagged as stalled
    alerts_res = client.get("/api/alerts?status_filter=open", headers=AUTH_HEADER)
    assert alerts_res.status_code == 200
    alerts = alerts_res.json()
    assert len(alerts) >= 1
    target_alert = next((a for a in alerts if a["candidate_name"] == "John Doe"), None)
    assert target_alert is not None
    assert target_alert["severity"] in ["high", "critical"]

    # 5. Generate follow-up draft for the alert
    draft_res = client.post(f"/api/alerts/{target_alert['id']}/draft", headers=AUTH_HEADER)
    assert draft_res.status_code == 200
    action = draft_res.json()
    assert action["status"] == "draft"
    assert "John Doe" in action["draft"]

    # 6. Human approval gate
    approval_res = client.post(
        f"/api/actions/{action['id']}/approval",
        headers=AUTH_HEADER,
        json={"decision": "approved", "reviewer": "TalentLead"}
    )
    assert approval_res.status_code == 200
    assert approval_res.json()["status"] == "approved"

    # 7. Check audit log
    audit_res = client.get("/api/audit-events", headers=AUTH_HEADER)
    assert audit_res.status_code == 200
    events = audit_res.json()
    actions_logged = [e["action"] for e in events]
    assert "CSV_IMPORT" in actions_logged
    assert "ACTION_APPROVED" in actions_logged
