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
  {
    targetId: "tour-target-metrics",
    category: "Orientation & Executive Dashboard",
    title: "Pipeline Operations Pulse",
    description:
      "Monitor total active candidates, open SLA alerts, and critical bottleneck warnings synchronized atomically with every ATS event and scan.",
  },
  {
    targetId: "tour-step-scan-btn",
    category: "Deterministic SLA Engine",
    title: "Instant Dwell-Time Scan",
    description:
      "Execute instantaneous stall detection scans across all candidates with deterministic UTC math, avoiding LLM hallucinations.",
  },
  {
    targetId: "tour-step-import-btn",
    category: "Ingestion & Security Gateway",
    title: "Candidate CSV Ingestion",
    description:
      "Import candidate batches with formula injection sanitization, idempotent external ID deduplication, and streaming parsing.",
  },
  {
    targetId: "tour-target-tabs",
    category: "Navigation & Operations",
    title: "Workflow Domain Switcher",
    description:
      "Seamlessly transition between Overdue Alerts, Candidate Directory, Human-in-the-Loop Approval Queue, SLA Rules, and Audit Logs.",
  },
  {
    targetId: "tour-target-alerts-toolbar",
    tabTarget: "alerts",
    category: "Overdue Alerts Inbox",
    title: "Multi-Dimensional Alert Filters",
    description:
      "Filter overdue alerts by urgency (Critical ≥ 2x SLA, High ≥ 1.5x, Medium ≥ 1x), resolution state, and stage with responsive pagination.",
  },
  {
    targetId: "tour-target-candidates-toolbar",
    tabTarget: "candidates",
    category: "Talent Directory",
    title: "Fast Candidate Search & Stage Filtering",
    description:
      "Search any candidate by name, job role, or email with stage-specific filters and exact dwell-time entry timestamps.",
  },
  {
    targetId: "tour-target-drafts-toolbar",
    tabTarget: "drafts",
    category: "Human-in-the-Loop Governance",
    title: "Follow-up Approval Gateway",
    description:
      "Review, personalize, and approve candidate re-engagement drafts. Autonomous outbound messaging is strictly locked behind human approval.",
  },
  {
    targetId: "tour-target-rules-toolbar",
    tabTarget: "rules",
    category: "Business Policy Engine",
    title: "Configurable SLA Thresholds",
    description:
      "Tailor allowable days per hiring phase with optional weekend-exclusion calendar logic. Changes apply immediately to subsequent scans.",
  },
  {
    targetId: "tour-target-audit-toolbar",
    tabTarget: "audit",
    category: "Compliance & Security",
    title: "Immutable Audit Ledger",
    description:
      "Cryptographically traceable append-only trail logging every actor, action, timestamp, and target entity for SOC2/ISO compliance.",
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

        // Horizontally center card with the element
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
