# INTENT.md — PRODUCT INTENT & DESIGN PHILOSOPHY
**Product Name:** Stall Alerter  
**Version:** 2.0.0  
**Target Audience:** Recruiters, Recruiting Operations Leads, Hiring Managers  
**Document Status:** Live Canonical Standard  

---

## 1. Executive Intent (Why Does This Project Exist?)

In high-growth companies, hiring momentum determines organizational success. However, recruiting pipelines constantly suffer from **silent stalls**:
- Top-tier candidates sit in interview stages for days or weeks without follow-up because interviewers delay scorecards or recruiters juggle too many requisitions.
- Disengaged candidates drop out of the process, accept counter-offers, or post negative feedback on Glassdoor.
- Standard Applicant Tracking Systems (Greenhouse, Lever, Workday) act as passive databases; they do not proactively enforce operational deadlines or prioritize recruiter attention.

**The Intent of Stall Alerter:**  
Build an active operational copilot that continuously audits pipeline hygiene, calculates stage dwell time mathematically, flags overdue applicants before they go cold, and drafts human-governed follow-up messages.

---

## 2. Core Philosophy & Architectural Boundary

```
[ ATS Pipeline Data ] 
       │
       ▼ (Deterministic Math Engine - Zero Hallucinations)
[ SLA Breach Detection & Severity Tiering ]
       │
       ▼ (Assisted Intelligence - Neutral Draft Preparation)
[ Human-in-the-Loop Approval Gate ] ───(Recruiter Signs Off)───► [ Authorized Communication ]
```

### The Three Sacred Invariants:
1. **Math Over Guesswork:**  
   SLA breach duration and severity classification (Medium, High, Critical) are computed strictly via deterministic UTC timestamp subtraction. An LLM is never allowed to calculate time, infer dates, or decide whether a candidate is stalled.
2. **Operational Urgency ≠ Candidate Suitability:**  
   Alert severity measures *process delay*, not candidate talent or fit. Stall Alerter never scores, ranks, rejects, or passes candidates.
3. **Zero Autonomous Outbound Action:**  
   AI generates polite, neutral follow-up drafts, but no email or message is ever transmitted without affirmative, authenticated human review and approval.

---

## 3. User Personas & Primary Workflows

### Primary Personas:
- **Recruiter (Daily Driver):**  
  *Goal:* Needs to know who to email first in the morning without manually combing through 200 pipeline cards.
- **Recruiting Operations / Talent Ops Lead:**  
  *Goal:* Configures stage-specific SLAs, audits pipeline bottlenecks, and ensures compliance with internal service standards.
- **Auditor / Leadership:**  
  *Goal:* Reviews immutable audit logs to verify that all outreach complies with privacy policies and company tone standards.

---

## 4. Problem Space vs. Solution Space

| Problem Area | Industry Failure Mode | Stall Alerter's Solved Intent |
| :--- | :--- | :--- |
| **Stage Delay** | Candidates wait 14+ days for interview feedback. | Configurable SLAs trigger alerts at 1.0x, 1.5x, and 2.0x threshold breach. |
| **Notification Fatigue** | Tools spam recruiters with endless trivial alerts. | Deduplicated alerts ranked strictly by severity and elapsed days. |
| **Communication Quality** | Harried recruiters send rushed or cold emails. | Contextual, respectful follow-up drafts generated in 1 click. |
| **Compliance & Risk** | Autonomous bots send wrong info or hallucinate rejections. | Strict Human-in-the-Loop approval gate with immutable audit logging. |
| **Data Integrity** | Malicious CSV exports inject formula payloads. | Automatic formula sanitization (`=`, `@`, `+`, `-`) on ingestion. |

---

## 5. Non-Goals (What This Project Intentionally Does NOT Do)

To maintain safety, compliance, and ethical operations, Stall Alerter explicitly rejects the following:
- **NO Autonomous Candidate Rejections:** The system will never automatically reject an applicant.
- **NO Candidate Scoring or Ranking:** No algorithm will determine whether a candidate is "good" or "bad."
- **NO Silent ATS Mutating:** No third-party system of record will be modified without user visibility.
- **NO Direct Outbound Dispatch Without Recruiter Click:** The system never hits SendGrid/SMTP on its own.

---

## 6. Success Metrics & Key Performance Indicators (KPIs)

A successful deployment of Stall Alerter achieves:
1. **Time-to-First-Followup:** Reduced from days to < 2 minutes via 1-click drafted outreach.
2. **Pipeline Velocity:** 40% reduction in average candidate dwell time in screening and technical stages.
3. **Zero Ghosting Incidents:** 100% of candidates exceeding SLA receive a personalized status touchpoint.
4. **Recruiter Adoption:** Daily dashboard usage by recruiters to prioritize morning workflows.
