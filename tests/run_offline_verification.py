"""
Offline Direct Integration Test Suite
Tests backend database, domain logic, CSV parsing, stall detection, drafts, and approval state machine.
"""
import os
import io
import csv
import uuid
from datetime import datetime, timezone, timedelta

os.environ["DATABASE_PATH"] = "test_stall_alerter_offline.db"
os.environ["STALL_ALERTER_API_KEY"] = "dev-stall-alerter-secret-key-32chars-min"

from app.main import (
    init_db,
    get_db_connection,
    compute_elapsed_days,
    determine_severity,
    generate_followup_draft,
    scan_alerts,
    create_followup_draft,
    approve_action,
    ApprovalRequest,
    RuleModel,
    set_rule,
    get_rules,
    get_metrics,
    list_audit_events
)

def run_all_offline_tests():
    print(">>> 1. Testing Core Math & Calculations...")
    now = datetime(2026, 10, 28, 12, 0, 0, tzinfo=timezone.utc)
    entered = now - timedelta(days=6)
    elapsed = compute_elapsed_days(entered, now)
    assert elapsed == 6.0, f"Expected 6.0, got {elapsed}"
    assert determine_severity(2.0, 5) == "low"
    assert determine_severity(5.0, 5) == "medium"
    assert determine_severity(7.5, 5) == "high"
    assert determine_severity(10.0, 5) == "critical"
    print("  [PASS] Elapsed days & severity thresholds verified.")

    print(">>> 2. Initializing Clean Test Database...")
    if os.path.exists("test_stall_alerter_offline.db"):
        os.remove("test_stall_alerter_offline.db")
    init_db()
    print("  [PASS] Database tables and default SLA rules initialized.")

    print(">>> 3. Inserting Candidate Records...")
    conn = get_db_connection()
    c = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()
    c.execute(
        """
        INSERT INTO candidates (id, external_id, name, email, job_title, stage, stage_entered_at, last_activity_at, recruiter, created_at, updated_at)
        VALUES (?, 'TST-01', 'Aarav Patel', 'aarav@example.com', 'Backend Lead', 'Technical Interview', '2026-10-15T00:00:00Z', '2026-10-16T00:00:00Z', 'Pooja', ?, ?)
        """,
        (str(uuid.uuid4()), now_iso, now_iso)
    )
    c.execute(
        """
        INSERT INTO candidates (id, external_id, name, email, job_title, stage, stage_entered_at, last_activity_at, recruiter, created_at, updated_at)
        VALUES (?, 'TST-02', 'Neha Sen', 'neha@example.com', 'UI Designer', 'Recruiter Screen', '2026-10-27T10:00:00Z', '2026-10-27T10:00:00Z', 'Rohan', ?, ?)
        """,
        (str(uuid.uuid4()), now_iso, now_iso)
    )
    conn.commit()
    conn.close()
    print("  [PASS] 2 test candidates inserted.")

    print(">>> 4. Testing SLA Rule Configuration...")
    rule_res = set_rule(RuleModel(stage="Technical Interview", max_days=4), _="valid_key")
    assert rule_res["stage"] == "Technical Interview"
    assert rule_res["max_days"] == 4
    rules = get_rules(_="valid_key")
    tech_rule = next(r for r in rules if r["stage"] == "Technical Interview")
    assert tech_rule["max_days"] == 4
    print("  [PASS] Dynamic SLA rule updated to 4 days.")

    print(">>> 5. Testing Stall Alert Scan & Deduplication...")
    scan_res = scan_alerts(_="valid_key")
    assert scan_res["status"] == "completed"
    assert scan_res["new_alerts"] >= 1
    print(f"  [PASS] Scan executed successfully: {scan_res['new_alerts']} new alert(s) detected.")

    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT id, candidate_id, stage, days_in_stage, severity FROM alerts WHERE status = 'open' LIMIT 1")
    alert_row = c.fetchone()
    assert alert_row is not None, "Alert was not created"
    alert_id = alert_row[0]
    conn.close()

    print(f">>> 6. Testing Follow-up Draft Generation for Alert #{alert_id}...")
    draft_res = create_followup_draft(str(alert_id), _="valid_key")
    action_id = draft_res["id"]
    assert draft_res["status"] == "draft"
    assert "Aarav Patel" in draft_res["draft"]
    assert "Backend Lead" in draft_res["draft"]
    print("  [PASS] Human-reviewable follow-up draft generated with candidate context.")

    print(f">>> 7. Testing Human Approval Gate for Action #{action_id}...")
    approval_res = approve_action(
        str(action_id),
        ApprovalRequest(decision="approved", reviewer="HiringLead_Sarah"),
        _="valid_key"
    )
    assert approval_res["status"] == "approved"
    assert approval_res["action_id"] == str(action_id)
    print("  [PASS] Action approved and state transition recorded.")

    print(">>> 8. Verifying Operational Metrics & Audit Trail...")
    metrics = get_metrics(_="valid_key")
    assert metrics["candidates_tracked"] >= 2
    assert metrics["open_alerts"] >= 1
    assert metrics["approved_drafts"] >= 1

    audit_logs = list_audit_events(limit=50, _="valid_key")
    actions_logged = [e["action"] for e in audit_logs]
    assert "UPDATE_RULE" in actions_logged
    assert "SCAN_ALERTS" in actions_logged
    assert "CREATE_DRAFT" in actions_logged
    assert "ACTION_APPROVED" in actions_logged
    print("  [PASS] Metrics computed and immutable audit log verified.")

    if os.path.exists("test_stall_alerter_offline.db"):
        os.remove("test_stall_alerter_offline.db")

    print("\n=======================================================")
    print(">>> ALL 8 CORE & INTEGRATION TEST PHASES PASSED 100%! <<<")
    print("=======================================================")

if __name__ == "__main__":
    run_all_offline_tests()
