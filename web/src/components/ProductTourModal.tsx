"use client";

import React, { useEffect, useState, useLayoutEffect } from "react";

export interface TourStep {
  targetId: string;
  tabTarget?: "alerts" | "candidates" | "drafts" | "rules" | "audit";
  title: string;
  badge: string;
  description: string;
  keyPoints: string[];
  preferredPlacement?: "bottom" | "top" | "center";
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: "tour-step-scan-btn",
    title: "1-Click Deterministic Stall Scan",
    badge: "Step 1 of 7 • Engine Trigger",
    description:
      "Initiates the deterministic background audit scan across every candidate application in the database, evaluating stage dwell time against SLA limits.",
    keyPoints: [
      "Calculates UTC elapsed days deterministically (zero AI hallucinations).",
      "Creates new alerts or automatically auto-resolves candidates who advanced.",
    ],
    preferredPlacement: "bottom",
  },
  {
    targetId: "tour-target-metrics",
    title: "Pipeline Operations Pulse",
    badge: "Step 2 of 7 • Executive Overview",
    description:
      "Aggregated real-time metrics showing total tracked candidates, open overdue stalls, critical breaches (≥ 2.0x allowable limit), and pending outreach drafts.",
    keyPoints: [
      "Immediate detection of critical bottlenecks requiring recruiter intervention.",
      "Live stats refresh automatically following scans, imports, and draft approvals.",
    ],
    preferredPlacement: "bottom",
  },
  {
    targetId: "tour-target-tabs",
    title: "Workflow Navigation Center",
    badge: "Step 3 of 7 • Domain Views",
    description:
      "Seamlessly toggle between operational workflows. Each view provides dedicated filters, custom pagination, and stateful tracking.",
    keyPoints: [
      "Overdue Alerts: Immediate triage and follow-up draft generation.",
      "All Candidates: Comprehensive candidate search and stage tracking.",
      "Follow-up Drafts: Human-in-the-Loop review and approval gateway.",
      "SLA Rules & Audit: Dynamic policy customization and immutable audit trail.",
    ],
    preferredPlacement: "bottom",
  },
  {
    targetId: "tour-target-alerts-toolbar",
    tabTarget: "alerts",
    title: "Overdue Alerts Inbox & Filters",
    badge: "Step 4 of 7 • Alerts Triage",
    description:
      "Triage overdue candidates categorized by severity (Critical, High, Medium), resolution state, and hiring stage with responsive pagination.",
    keyPoints: [
      "Filter by Critical (≥ 2x SLA), High (≥ 1.5x SLA), and Medium (≥ 1x SLA).",
      "One-click 'Draft Follow-up' opens candidate re-engagement workflow.",
    ],
    preferredPlacement: "bottom",
  },
  {
    targetId: "tour-target-candidates-toolbar",
    tabTarget: "candidates",
    title: "Candidate Search & Pipeline Stage Filtering",
    badge: "Step 5 of 7 • Talent Directory",
    description:
      "Search any candidate by full name, target role, or email, with dynamic stage filtering and paginated record navigation.",
    keyPoints: [
      "Fast client-side fuzzy search across all active job postings.",
      "Exact timestamps showing when candidate entered current stage.",
    ],
    preferredPlacement: "bottom",
  },
  {
    targetId: "tour-target-drafts-toolbar",
    tabTarget: "drafts",
    title: "Human-in-the-Loop Approval Queue",
    badge: "Step 6 of 7 • Safety & Governance Gate",
    description:
      "Crucial AI Safety Boundary: Stall Alerter NEVER transmits autonomous communications. Outbound messages require explicit recruiter inspection, editing, and sign-off.",
    keyPoints: [
      "Recruiters review, personalize, and approve or reject drafted communications.",
      "Decisions are immutably logged into the audit ledger for governance compliance.",
    ],
    preferredPlacement: "bottom",
  },
  {
    targetId: "tour-target-rules-toolbar",
    tabTarget: "rules",
    title: "Configurable SLA Thresholds & Compliance",
    badge: "Step 7 of 7 • SLA Engine Rules",
    description:
      "Tailor allowable days per hiring phase (Resume Review, Screen, Interview, Offer). Edits take effect immediately on next stall scan.",
    keyPoints: [
      "Customizable thresholds in days with validation bounds.",
      "Protected by administrative authentication checks.",
    ],
    preferredPlacement: "bottom",
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
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; placement: "top" | "bottom" | "center" }>({
    top: 200,
    left: 200,
    placement: "bottom",
  });

  const step = TOUR_STEPS[currentStepIndex];

  // When step changes, switch tab if needed and update target rect
  useEffect(() => {
    if (!isOpen) return;

    if (step.tabTarget && onSwitchTab) {
      onSwitchTab(step.tabTarget);
    }

    const updateRect = () => {
      const el = document.getElementById(step.targetId);
      if (el) {
        // Scroll target gently into view if needed
        el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);

        // Compute popover position
        const popoverWidth = Math.min(window.innerWidth * 0.9, 460);
        const popoverHeight = 300; // estimated
        const margin = 16;

        let left = rect.left + rect.width / 2 - popoverWidth / 2;
        left = Math.max(margin, Math.min(window.innerWidth - popoverWidth - margin, left));

        // Place below if space permits, else above
        const spaceBelow = window.innerHeight - (rect.bottom + margin);
        const spaceAbove = rect.top - margin;

        let top = 0;
        let placement: "top" | "bottom" | "center" = "bottom";

        if (spaceBelow >= popoverHeight || spaceBelow >= spaceAbove) {
          top = rect.bottom + margin;
          placement = "bottom";
        } else {
          top = Math.max(margin, rect.top - popoverHeight - margin);
          placement = "top";
        }

        setPopoverPos({ top, left, placement });
      } else {
        // Fallback center
        setTargetRect(null);
        setPopoverPos({
          top: window.innerHeight / 2 - 160,
          left: window.innerWidth / 2 - 230,
          placement: "center",
        });
      }
    };

    // Allow slight delay for DOM tab switch to render
    const t = setTimeout(updateRect, 120);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [isOpen, currentStepIndex, step.targetId, step.tabTarget, onSwitchTab]);

  if (!isOpen) return null;

  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

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
    <div className="spotlight-tour-overlay" onClick={onClose}>
      {/* Dynamic Cutout Spotlight Box */}
      {targetRect && (
        <div
          className="spotlight-cutout"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
        />
      )}

      {/* Contextual Anchored Alert Popover */}
      <div
        className={`spotlight-popover placement-${popoverPos.placement}`}
        style={{
          top: popoverPos.top,
          left: popoverPos.left,
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="spotlight-header">
          <div className="spotlight-badge-row">
            <span className="spotlight-step-badge">{step.badge}</span>
            <div className="spotlight-pills">
              {TOUR_STEPS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`spotlight-pill ${idx === currentStepIndex ? "active" : idx < currentStepIndex ? "done" : ""}`}
                  onClick={() => setCurrentStepIndex(idx)}
                />
              ))}
            </div>
          </div>
          <button className="spotlight-close-btn" onClick={onClose} aria-label="Close tour">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="spotlight-body">
          <h3 className="spotlight-title">{step.title}</h3>
          <p className="spotlight-desc">{step.description}</p>

          <div className="spotlight-points">
            {step.keyPoints.map((pt, i) => (
              <div key={i} className="spotlight-point-item">
                <span className="spotlight-point-icon">✓</span>
                <span>{pt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="spotlight-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Exit Tour
          </button>

          <div className="spotlight-nav-actions">
            <button
              className="btn btn-secondary btn-sm"
              disabled={isFirst}
              onClick={handlePrev}
            >
              ← Back
            </button>
            <button
              className="btn btn-primary btn-sm spotlight-next-btn"
              onClick={handleNext}
            >
              {isLast ? "Complete Tour ✓" : "Next Feature →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
