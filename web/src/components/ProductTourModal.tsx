"use client";

import React, { useEffect, useState } from "react";

export interface TourStep {
  targetId: string;
  tabTarget?: "alerts" | "candidates" | "drafts" | "rules" | "audit";
  category: string;
  title: string;
  description: string;
}

const TOUR_STEPS: TourStep[] = [
  // SECTION 0: GLOBAL DASHBOARD & LAUNCHERS
  {
    targetId: "tour-target-metrics",
    category: "Orientation & Executive Dashboard",
    title: "Pipeline Operations Pulse",
    description:
      "Real-time aggregated health metrics tracking candidate volume, open stalls, critical SLA breaches, and pending outreach drafts.",
  },
  {
    targetId: "tour-step-scan-btn",
    category: "Deterministic SLA Engine",
    title: "1-Click Dwell-Time Scan",
    description:
      "Triggers the deterministic background audit scan across every active candidate in the pipeline using strict UTC math.",
  },
  {
    targetId: "tour-step-import-btn",
    category: "Ingestion & Security Gateway",
    title: "Candidate CSV Ingestion",
    description:
      "Upload external candidate spreadsheets with built-in formula injection sanitization and idempotent external ID deduplication.",
  },

  // SECTION 1: OVERDUE ALERTS (Complete In-Depth Breakdown)
  {
    targetId: "tab-btn-alerts",
    tabTarget: "alerts",
    category: "Overdue Alerts Inbox",
    title: "1. Overdue Alerts Navigation Tab",
    description:
      "Direct entry to the Overdue Alerts triage view where all stalled candidate applications are flagged and tracked.",
  },
  {
    targetId: "tour-alerts-filter-group",
    tabTarget: "alerts",
    category: "Overdue Alerts Inbox",
    title: "Multi-Dimensional Filters",
    description:
      "Slice overdue alerts by Urgency (Critical ≥ 2x SLA, High ≥ 1.5x, Medium ≥ 1x), Resolution Status (Open/Resolved), and Stage.",
  },
  {
    targetId: "tour-alerts-table-card",
    tabTarget: "alerts",
    category: "Overdue Alerts Inbox",
    title: "Bottleneck Table & Recruiter Routing",
    description:
      "Detailed candidate audit logs displaying candidate name, role, idle days in stage, and the assigned recruiter for ownership.",
  },
  {
    targetId: "tour-alerts-draft-btn",
    tabTarget: "alerts",
    category: "Overdue Alerts Inbox",
    title: "One-Click Outreach Draft Action",
    description:
      "Instantly initializes an AI-assisted follow-up email draft tailored to the candidate's exact stage and idle duration.",
  },
  {
    targetId: "tour-alerts-pagination",
    tabTarget: "alerts",
    category: "Overdue Alerts Inbox",
    title: "Alerts Pagination Controls",
    description:
      "Browse through large pipelines cleanly with compact 5-item pages, page indicators, and Prev/Next buttons.",
  },

  // SECTION 2: ALL CANDIDATES (Complete In-Depth Breakdown)
  {
    targetId: "tab-btn-candidates",
    tabTarget: "candidates",
    category: "Talent Directory",
    title: "2. Candidates Directory Navigation Tab",
    description:
      "Access the master candidate index representing all synchronized or imported applications across open roles.",
  },
  {
    targetId: "tour-candidates-search-group",
    tabTarget: "candidates",
    category: "Talent Directory",
    title: "Instant Search & Stage Dropdown",
    description:
      "Fuzzy search candidates by full name, job title, or email address, combined with hiring stage filtering.",
  },
  {
    targetId: "tour-candidates-table-card",
    tabTarget: "candidates",
    category: "Talent Directory",
    title: "Candidate Profiles & Dwell Tracking",
    description:
      "Tracks external ATS applicant IDs, target roles, current hiring stages, and exact timestamps when the stage was entered.",
  },
  {
    targetId: "tour-candidates-pagination",
    tabTarget: "candidates",
    category: "Talent Directory",
    title: "Candidates Directory Pagination",
    description:
      "Effortlessly navigate through hundreds of applicants without performance degradation or browser memory bloat.",
  },

  // SECTION 3: FOLLOW-UP DRAFTS & GOVERNANCE (Complete In-Depth Breakdown)
  {
    targetId: "tab-btn-drafts",
    tabTarget: "drafts",
    category: "Human-in-the-Loop Governance",
    title: "3. Follow-up Drafts Approval Queue",
    description:
      "The essential AI safety gateway: No email leaves the system automatically. Recruiter inspection and approval are strictly required.",
  },
  {
    targetId: "tour-drafts-filter-group",
    tabTarget: "drafts",
    category: "Human-in-the-Loop Governance",
    title: "Draft Status Filtering",
    description:
      "Filter generated communications by review status: 'Pending Review', 'Approved' (ready for transmission), or 'Rejected'.",
  },
  {
    targetId: "tour-drafts-table-card",
    tabTarget: "drafts",
    category: "Human-in-the-Loop Governance",
    title: "Communication Preview & Audit State",
    description:
      "Displays the generated draft body, creation timestamp, action type, and cryptographic audit identifier.",
  },
  {
    targetId: "tour-drafts-review-btn",
    tabTarget: "drafts",
    category: "Human-in-the-Loop Governance",
    title: "Review, Personalize & Authorize Modal",
    description:
      "Opens the full interactive review modal allowing recruiters to edit wording before explicitly approving or discarding.",
  },
  {
    targetId: "tour-drafts-pagination",
    tabTarget: "drafts",
    category: "Human-in-the-Loop Governance",
    title: "Draft Queue Pagination",
    description:
      "Organized view of queued communications ensuring recruiters never miss a pending candidate follow-up.",
  },

  // SECTION 4: STAGE SLA RULES (Complete In-Depth Breakdown)
  {
    targetId: "tab-btn-rules",
    tabTarget: "rules",
    category: "SLA Policy Engine",
    title: "4. Stage SLA Rules Configuration",
    description:
      "Define operational velocity expectations across each hiring phase: Resume Review, Screen, Interview, and Offer.",
  },
  {
    targetId: "tour-rules-table-card",
    tabTarget: "rules",
    category: "SLA Policy Engine",
    title: "SLA Threshold Editor",
    description:
      "Inline numeric inputs allow recruiting leaders to calibrate max allowable days per stage to match team bandwidth.",
  },
  {
    targetId: "tour-rules-update-btn",
    tabTarget: "rules",
    category: "SLA Policy Engine",
    title: "Instant Policy Recalculation",
    description:
      "Saving a new SLA rule immediately takes effect on the next stall scan and records an audit event in the security ledger.",
  },

  // SECTION 5: AUDIT LOGS (Complete In-Depth Breakdown)
  {
    targetId: "tab-btn-audit",
    tabTarget: "audit",
    category: "Compliance & Security",
    title: "5. Immutable Audit Events Ledger",
    description:
      "An enterprise-grade append-only security log tracking every state change, decision, CSV import, and SLA modification.",
  },
  {
    targetId: "tour-audit-filter-group",
    tabTarget: "audit",
    category: "Compliance & Security",
    title: "Action Type Audit Filtering",
    description:
      "Quickly isolate specific events like 'CREATE_DRAFT', 'DECISION_APPROVE', 'UPDATE_SLA', or 'CSV_IMPORT'.",
  },
  {
    targetId: "tour-audit-table-card",
    tabTarget: "audit",
    category: "Compliance & Security",
    title: "Cryptographic Event Records",
    description:
      "Chronological ledger entries capturing precise UTC timestamps, actor identities, action verbs, and affected entity IDs.",
  },
  {
    targetId: "tour-audit-pagination",
    tabTarget: "audit",
    category: "Compliance & Security",
    title: "Audit History Pagination",
    description:
      "Provides full compliance navigability across thousands of historical audit events for SOC2 and ISO compliance reviews.",
  },
];

interface ProductTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchTab?: (tab: "alerts" | "candidates" | "drafts" | "rules" | "audit") => void;
}

export default function ProductTourModal({ isOpen, onClose, onSwitchTab }: ProductTourModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number }>({
    top: 200,
    left: 200,
  });

  const step = TOUR_STEPS[currentStepIndex];
  const totalSteps = TOUR_STEPS.length;
  const progressPercent = Math.round(((currentStepIndex + 1) / totalSteps) * 100);

  useEffect(() => {
    if (!isOpen) return;

    if (step.tabTarget && onSwitchTab) {
      onSwitchTab(step.tabTarget);
    }

    const updateRect = () => {
      const el = document.getElementById(step.targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);

        const cardWidth = Math.min(window.innerWidth * 0.92, 380);
        const cardHeight = 240;
        const margin = 14;

        // Horizontally center card with target element
        let left = rect.left + rect.width / 2 - cardWidth / 2;
        left = Math.max(margin, Math.min(window.innerWidth - cardWidth - margin, left));

        // Place below if space permits, otherwise above
        const spaceBelow = window.innerHeight - (rect.bottom + margin);
        let top: number;

        if (spaceBelow >= cardHeight || rect.top < cardHeight) {
          top = rect.bottom + margin;
        } else {
          top = Math.max(margin, rect.top - cardHeight - margin);
        }

        setPopoverPos({ top, left });
      } else {
        setTargetRect(null);
        setPopoverPos({
          top: window.innerHeight / 2 - 120,
          left: window.innerWidth / 2 - 190,
        });
      }
    };

    const timer = setTimeout(updateRect, 130);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [isOpen, currentStepIndex, step.targetId, step.tabTarget, onSwitchTab]);

  if (!isOpen) return null;

  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === totalSteps - 1;

  const handleNext = () => {
    if (!isLast) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="tour-spotlight-backdrop" onClick={onClose}>
      {/* Precision Cutout Ring Around the Active Feature Component */}
      {targetRect && (
        <div
          className="tour-cutout-ring"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
        />
      )}

      {/* Floating Alert Card Styled Exactly like Reference */}
      <div
        className="tour-alert-card"
        style={{
          top: popoverPos.top,
          left: popoverPos.left,
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Card Header: Category Pill & Close Button */}
        <div className="tour-card-header">
          <div className="tour-category-tag">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            {step.category}
          </div>
          <button className="tour-close-x" onClick={onClose} aria-label="Close tour">
            ✕
          </button>
        </div>

        {/* Card Body: Title & Clean Description */}
        <div className="tour-card-body">
          <h3 className="tour-card-title">{step.title}</h3>
          <p className="tour-card-desc">{step.description}</p>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="tour-progress-section">
          <div className="tour-progress-track">
            <div
              className="tour-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="tour-progress-meta">
            <span>Step {currentStepIndex + 1} of {totalSteps}</span>
            <span>{progressPercent}%</span>
          </div>
        </div>

        {/* Card Footer: Prev, Skip, Next Buttons */}
        <div className="tour-card-footer">
          <button
            className="tour-btn tour-btn-prev"
            disabled={isFirst}
            onClick={handlePrev}
          >
            ‹ Prev
          </button>
          <button className="tour-btn tour-btn-skip" onClick={onClose}>
            Skip
          </button>
          <button className="tour-btn tour-btn-next" onClick={handleNext}>
            {isLast ? "Done ✓" : "Next ›"}
          </button>
        </div>
      </div>
    </div>
  );
}
