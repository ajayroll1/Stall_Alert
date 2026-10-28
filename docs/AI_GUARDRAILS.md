# STALL ALERTER — AI Guardrails & Human-in-the-Loop Policy

## 1. Safety Boundary & Non-Goals
Stall Alerter is strictly an **operational coordination and decision-support tool**.
- **PROHIBITED:** Autonomous candidate rejection, suitability scoring, or candidate ranking based on protected attributes.
- **PROHIBITED:** Automated outbound emailing without human recruiter review and explicit approval.
- **DETERMINISTIC PRIMACY:** Timestamps, SLA thresholds, elapsed time math, and severity rankings (`critical`, `high`, `medium`) are computed deterministically.

## 2. LLM Use Cases
1. **Unstructured Evidence Summaries:** Generating 2-sentence summaries of why an application is delayed based purely on verifiable stage timestamps and reviewer feedback status.
2. **Neutral Follow-up Draft Generation:** Drafting respectful, non-discriminatory candidate and hiring manager check-in messages.

## 3. Human Approval Gate State Machine
```
[ Stall Detected ]
        │
        ▼
[ Draft Created ] (Status: 'draft')
        │
        ├──▶ [ Recruiter Reviews in Console ]
        │         ├── Edits text
        │         ├── Decides approval
        │
        ├──▶ Rejected  (Status: 'rejected', Action logged in audit table)
        └──▶ Approved  (Status: 'approved', Timestamped with authorized reviewer)
```
