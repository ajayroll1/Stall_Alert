"use client";

import React, { useEffect, useState } from "react";

export interface TourStep {
  title: string;
  badge: string;
  tabTarget?: "alerts" | "candidates" | "drafts" | "rules" | "audit";
  description: string;
  keyPoints: string[];
  icon: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Real-Time Pipeline SLA Metrics",
    badge: "Step 1 of 6 • Executive Health",
    description:
      "Get instant, high-level visibility across all active recruiting operations. The top dashboard aggregates candidate volume, active bottlenecks, and pending outreach actions.",
    keyPoints: [
      "Total candidates actively tracked across all open requisitions.",
      "Open Overdue Alerts categorized by deterministic UTC math.",
      "Critical SLA Breaches (≥ 2.0x allowable stage limit) needing immediate recruiter triage.",
      "Pending outreach drafts awaiting Human-in-the-Loop authorization.",
    ],
    icon: "📊",
  },
  {
    title: "Overdue Alerts Inbox & Triage",
    badge: "Step 2 of 6 • Bottleneck Detection",
    tabTarget: "alerts",
    description:
      "Detect stagnant candidates early. The system continuously evaluates time spent in each pipeline stage against customizable SLAs.",
    keyPoints: [
      "Severity Ranking: Critical (≥ 2.0x), High (≥ 1.5x), and Medium (≥ 1.0x).",
      "Dynamic filtering by Severity, Resolution Status, and Pipeline Stage.",
      "One-click 'Draft Follow-up' to kickstart personalized candidate re-engagement.",
      "Deterministic calculation ensures fairness and eliminates LLM hallucinations.",
    ],
    icon: "🚨",
  },
  {
    title: "Candidates Directory & Search",
    badge: "Step 3 of 6 • Talent Repository",
    tabTarget: "candidates",
    description:
      "A complete directory of all imported candidates with fast client-side query matching and stage categorization.",
    keyPoints: [
      "Instant fuzzy search across candidate names, email addresses, and job titles.",
      "Filter by specific hiring stages (e.g. Technical Interview, HM Screen).",
      "Exact timestamps tracking when each candidate entered their current stage.",
      "Pagination bar for clean browsing across high-volume pipelines.",
    ],
    icon: "👥",
  },
  {
    title: "Human-in-the-Loop Approval Queue",
    badge: "Step 4 of 6 • Safety & Governance",
    tabTarget: "drafts",
    description:
      "A core safety pillar: Stall Alerter never sends autonomous emails to candidates without explicit recruiter review and approval.",
    keyPoints: [
      "AI/Rule-drafted follow-ups remain in 'draft' status until reviewed.",
      "Inspect, edit, approve, or reject candidate communications in an interactive modal.",
      "Eliminates embarrassing cold messaging and ensures consistent brand voice.",
      "All approval decisions are cryptographically recorded into the audit log.",
    ],
    icon: "🛡️",
  },
  {
    title: "Stage SLA Rules & Thresholds",
    badge: "Step 5 of 6 • Custom Business Logic",
    tabTarget: "rules",
    description:
      "Every hiring team moves at different speeds. Customize allowable time-in-stage limits per hiring phase with immediate recalculation.",
    keyPoints: [
      "Configurable days for Resume Review, Phone Screen, Tech Interview, and Offer stages.",
      "Supports weekend-exclusion calendar logic for realistic working-day SLAs.",
      "Changes instantly propagate to the deterministic alert scanning engine.",
      "Protected by administrative authentication checks.",
    ],
    icon: "⚙️",
  },
  {
    title: "Immutable Audit Trail & Webhooks",
    badge: "Step 6 of 6 • Enterprise Compliance",
    tabTarget: "audit",
    description:
      "Full transparency and enterprise readiness. Every single state change, file ingestion, and decision is archived in an append-only log.",
    keyPoints: [
      "Chronological timeline of actors, actions, target entities, and payloads.",
      "Filterable by action types (DRAFT, APPROVE, REJECT, IMPORT, UPDATE_SLA).",
      "ATS Webhook receiver enables real-time synchronization with Greenhouse, Lever, and Workday.",
      "Automated Slack & Microsoft Teams digest dispatching.",
    ],
    icon: "📜",
  },
];

interface ProductTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchTab?: (tab: "alerts" | "candidates" | "drafts" | "rules" | "audit") => void;
}

export default function ProductTourModal({ isOpen, onClose, onSwitchTab }: ProductTourModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      const firstTab = TOUR_STEPS[0].tabTarget;
      if (firstTab && onSwitchTab) {
        onSwitchTab(firstTab);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (!isLast) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      const nextTab = TOUR_STEPS[nextIndex].tabTarget;
      if (nextTab && onSwitchTab) {
        onSwitchTab(nextTab);
      }
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      const prevTab = TOUR_STEPS[prevIndex].tabTarget;
      if (prevTab && onSwitchTab) {
        onSwitchTab(prevTab);
      }
    }
  };

  const jumpToStep = (index: number) => {
    setCurrentStepIndex(index);
    const targetTab = TOUR_STEPS[index].tabTarget;
    if (targetTab && onSwitchTab) {
      onSwitchTab(targetTab);
    }
  };

  return (
    <div className="tour-modal-backdrop" onClick={onClose}>
      <div
        className="tour-modal-window"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-dialog-title"
      >
        {/* Header */}
        <div className="tour-modal-header">
          <div className="tour-header-meta">
            <span className="tour-badge">{currentStep.badge}</span>
            <div className="tour-progress-pills">
              {TOUR_STEPS.map((step, idx) => (
                <button
                  key={step.title}
                  type="button"
                  aria-label={`Jump to ${step.title}`}
                  className={`tour-pill-indicator ${idx === currentStepIndex ? "active" : idx < currentStepIndex ? "completed" : ""}`}
                  onClick={() => jumpToStep(idx)}
                />
              ))}
            </div>
          </div>
          <button className="tour-close-btn" onClick={onClose} aria-label="Close Tour">
            ✕
          </button>
        </div>

        {/* Body Content */}
        <div className="tour-modal-body">
          <div className="tour-step-hero">
            <div className="tour-icon-bubble">{currentStep.icon}</div>
            <div className="tour-hero-text">
              <h2 id="tour-dialog-title" className="tour-step-title">{currentStep.title}</h2>
              <p className="tour-step-desc">{currentStep.description}</p>
            </div>
          </div>

          <div className="tour-feature-highlights">
            <h4 className="tour-highlights-heading">Key Capabilities & Architecture</h4>
            <div className="tour-points-grid">
              {currentStep.keyPoints.map((pt, i) => (
                <div key={i} className="tour-point-card">
                  <div className="tour-point-check">✓</div>
                  <div className="tour-point-text">{pt}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="tour-modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Skip Tour
          </button>

          <div className="tour-nav-buttons">
            <button
              className="btn btn-secondary btn-sm"
              disabled={isFirst}
              onClick={handlePrev}
            >
              ← Back
            </button>
            <button
              className="btn btn-primary btn-sm tour-next-btn"
              onClick={handleNext}
            >
              {isLast ? "Finish Tour ✓" : "Next Feature →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
