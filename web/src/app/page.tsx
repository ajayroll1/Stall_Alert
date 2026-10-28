"use client";

import React, { useState } from "react";
import Link from "next/link";
import FluidFooter from "../components/FluidFooter";

export default function LandingHomePage() {
  // Interactive Simulation State in Section 4
  const [simStage, setSimStage] = useState<string>("Technical Interview");
  const [simDays, setSimDays] = useState<number>(7);

  // Calculate live urgency preview based on SLA
  const stageSlas: { [key: string]: number } = {
    "Application Review": 3,
    "Recruiter Screen": 5,
    "Technical Interview": 5,
    "Onsite Loop": 7,
    "Offer Extended": 3,
  };

  const sla = stageSlas[simStage] || 5;
  const isStalled = simDays >= sla;
  const urgency = simDays >= sla * 2 ? "Critical" : simDays >= sla * 1.5 ? "High" : isStalled ? "Medium" : "Normal (On Track)";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-canvas)" }}>
      {/* -------------------------------------------------------------
          NAVIGATION BAR
      ------------------------------------------------------------- */}
      <header className="app-header">
        <div className="brand-container">
          <img
            src="/stall-logo.svg"
            alt="Stall Alerter Logo"
            width={34}
            height={34}
            className="header-logo-img"
          />
          <div>
            <span className="brand-title">Stall Alerter</span>
            <span className="brand-subtitle">Pipeline Operations Console</span>
          </div>
        </div>

        <nav style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <a href="#how-it-works" style={{ textDecoration: "none", color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.95rem" }}>
            How It Works
          </a>
          <a href="#features" style={{ textDecoration: "none", color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.95rem" }}>
            Capabilities
          </a>
          <a href="#simulator" style={{ textDecoration: "none", color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.95rem" }}>
            Live SLA Sandbox
          </a>
          <a href="#architecture" style={{ textDecoration: "none", color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.95rem" }}>
            Integrations
          </a>
          <Link
            href="/dashboard"
            className="hp-btn-primary"
            style={{ padding: "0.6rem 1.25rem", fontSize: "0.9rem" }}
          >
            Launch Console →
          </Link>
        </nav>
      </header>

      {/* -------------------------------------------------------------
          SECTION 1: HERO (Pencil Sketch Aesthetic + Value Proposition)
      ------------------------------------------------------------- */}
      <section className="hp-hero-wrapper">
        <div className="hp-hero-container">
          <div>
            <div className="hp-hero-badge">
              <span className="hp-badge-dot" />
              <span>Production-Minded Hiring Pipeline Intelligence</span>
            </div>
            <h1 className="hp-hero-title">
              Never lose top talent to an <span className="accent-highlight">unnoticed pipeline stall.</span>
            </h1>
            <p className="hp-hero-description">
              Stall Alerter continuously analyzes hiring boards, enforces stage-specific SLAs, pinpoints overdue candidates with mathematical precision, and generates human-approved follow-ups before high-value talent walks away.
            </p>
            <div className="hp-cta-group">
              <Link href="/dashboard" className="hp-btn-primary">
                Open Operations Console
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </Link>
              <a href="#simulator" className="hp-btn-secondary">
                Try Interactive Demo
              </a>
            </div>
          </div>

          <div className="hp-hero-illustration-box">
            <img
              src="/illustrations/hero-pipeline-sketch.svg"
              alt="Pencil Sketch of Candidate Pipeline Stages & Detective Mascot"
              className="hp-hero-img"
            />
            <div className="hp-float-pill">
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--critical-badge)" }} />
              <div>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--critical-text)" }}>
                  CRITICAL SLA OVERDUE
                </div>
                <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>
                  Aarav Patel • Tech Interview (+4.2d)
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          SECTION 2: TRUST & ATS ECOSYSTEM PROOF
      ------------------------------------------------------------- */}
      <div className="hp-trust-bar">
        <div className="hp-trust-label">Built to Integrate Seamlessly With Your Recruiting Stack</div>
        <div className="hp-trust-badges-row">
          <div className="hp-trust-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
            <span>Universal ATS CSV Ingestion</span>
          </div>
          <div className="hp-trust-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span>Deterministic UTC SLA Engine</span>
          </div>
          <div className="hp-trust-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            <span>Zero-AI Decision Autonomy</span>
          </div>
          <div className="hp-trust-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>Immutable Security Audit Log</span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          SECTION 3: THREE CORE PILLARS
      ------------------------------------------------------------- */}
      <section id="features" className="hp-section">
        <div className="hp-section-container">
          <div className="hp-section-header">
            <span className="hp-tag">Operational Rigor</span>
            <h2 className="hp-section-title">Engineered for High-Velocity Talent Teams</h2>
            <p className="hp-section-subtitle">
              Unlike generic workflow alerts that cause notification fatigue, Stall Alerter combines strict stage SLAs with human-in-the-loop decision boundaries.
            </p>
          </div>

          <div className="hp-grid-3">
            <div className="hp-feature-card">
              <div className="hp-card-icon-sketch">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <h3 className="hp-card-title">Configurable Stage SLAs</h3>
              <p className="hp-card-text">
                Define maximum dwell duration for every hiring step. Automatically recalculate thresholds dynamically as interview complexity evolves.
              </p>
            </div>

            <div className="hp-feature-card">
              <div className="hp-card-icon-sketch">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <h3 className="hp-card-title">Severity-Ranked Inbox</h3>
              <p className="hp-card-text">
                Alerts escalate from Medium to High (1.5× SLA) and Critical (2.0× SLA). Recruiter capacity is spent strictly on candidates at genuine risk of ghosting.
              </p>
            </div>

            <div className="hp-feature-card">
              <div className="hp-card-icon-sketch">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <h3 className="hp-card-title">1-Click Neutral Drafts</h3>
              <p className="hp-card-text">
                Generate courteous, contextual candidate updates instantly. Zero outbound communications leave the system without explicit recruiter authorization.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          SECTION 4: INTERACTIVE SLA SIMULATOR (Pencil Sketch Accent)
      ------------------------------------------------------------- */}
      <section id="simulator" className="hp-section hp-section-alt">
        <div className="hp-section-container">
          <div className="hp-section-header">
            <span className="hp-tag">Interactive Preview</span>
            <h2 className="hp-section-title">Test the Stall Detection Algorithm</h2>
            <p className="hp-section-subtitle">
              Adjust stage parameters below to see how Stall Alerter's deterministic calculation categorizes operational risk in real time.
            </p>
          </div>

          <div className="hp-simulator-card">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem", alignItems: "center" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                  Select Hiring Pipeline Stage:
                </label>
                <select
                  value={simStage}
                  onChange={(e) => setSimStage(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-strong)", marginBottom: "1.5rem", fontSize: "0.95rem" }}
                >
                  <option value="Application Review">Application Review (SLA: 3 Days)</option>
                  <option value="Recruiter Screen">Recruiter Screen (SLA: 5 Days)</option>
                  <option value="Technical Interview">Technical Interview (SLA: 5 Days)</option>
                  <option value="Onsite Loop">Onsite Loop (SLA: 7 Days)</option>
                  <option value="Offer Extended">Offer Extended (SLA: 3 Days)</option>
                </select>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <label style={{ fontSize: "0.9rem", fontWeight: 700 }}>
                    Elapsed Days Without Movement:
                  </label>
                  <span style={{ fontWeight: 800, color: "var(--accent-primary)" }}>{simDays} Days</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="18"
                  value={simDays}
                  onChange={(e) => setSimDays(parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--accent-primary)", marginBottom: "1rem" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  <span>1 Day</span>
                  <span>Configured SLA: {sla} Days</span>
                  <span>18 Days</span>
                </div>
              </div>

              <div style={{
                backgroundColor: isStalled ? (urgency === "Critical" ? "var(--critical-bg)" : "var(--high-bg)") : "var(--medium-bg)",
                border: `1px solid ${isStalled ? (urgency === "Critical" ? "var(--critical-border)" : "var(--high-border)") : "var(--medium-border)"}`,
                borderRadius: "10px",
                padding: "1.8rem"
              }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                  Calculated Urgency Level
                </div>
                <div style={{
                  fontSize: "1.9rem",
                  fontWeight: 800,
                  color: isStalled ? (urgency === "Critical" ? "var(--critical-text)" : "var(--high-text)") : "var(--medium-text)",
                  marginBottom: "0.8rem"
                }}>
                  {urgency}
                </div>
                <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "1.2rem" }}>
                  {isStalled
                    ? `Stage exceeded threshold by ${(simDays - sla).toFixed(1)} days. Automated follow-up draft is staged in recruiter approval queue.`
                    : "Candidate application is progressing within normal SLA parameters. No alert triggered."}
                </p>
                <Link
                  href="/dashboard"
                  style={{
                    display: "inline-block",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "var(--accent-primary)",
                    textDecoration: "underline"
                  }}
                >
                  View live candidates in console →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          SECTION 5: DEEP DIVE - STAGE SLA POLICY & AUDIT GUARANTEES
      ------------------------------------------------------------- */}
      <section id="how-it-works" className="hp-section">
        <div className="hp-section-container">
          <div className="hp-split-row">
            <div className="hp-split-content">
              <span className="hp-tag">Deterministic Core</span>
              <h2 className="hp-section-title">Strict SLAs, Zero Hallucinations</h2>
              <p className="hp-card-text" style={{ fontSize: "1.05rem", marginBottom: "1.2rem" }}>
                AI in Stall Alerter is strictly restricted to text summarization and drafting neutral follow-up communications.
              </p>
              <ul style={{ paddingLeft: "1.2rem", color: "var(--text-secondary)", lineHeight: 1.8, fontSize: "0.95rem" }}>
                <li><strong>UTC Timestamps:</strong> Dwell duration calculated to the exact tenth of a day.</li>
                <li><strong>Formula Injection Protection:</strong> Sanitized against malicious spreadsheets during CSV export.</li>
                <li><strong>Automatic Deduplication:</strong> Single alert lifecycle per candidate stage to prevent alert clutter.</li>
              </ul>
            </div>

            <div className="hp-sketch-card">
              <img
                src="/illustrations/sla-rules-sketch.svg"
                alt="Pencil Sketch of SLA Threshold Policy Engine"
                className="hp-sketch-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          SECTION 6: HUMAN-IN-THE-LOOP APPROVAL GATE
      ------------------------------------------------------------- */}
      <section id="architecture" className="hp-section hp-section-alt">
        <div className="hp-section-container">
          <div className="hp-split-row reverse">
            <div className="hp-split-content">
              <span className="hp-tag">Compliance & Safety</span>
              <h2 className="hp-section-title">Humans Remain in the Pilot Seat</h2>
              <p className="hp-card-text" style={{ fontSize: "1.05rem", marginBottom: "1.2rem" }}>
                Candidate relations require empathy and context that algorithms lack. Stall Alerter enforces a mandatory approval gate for every outbound action.
              </p>
              <ul style={{ paddingLeft: "1.2rem", color: "var(--text-secondary)", lineHeight: 1.8, fontSize: "0.95rem" }}>
                <li><strong>Full Editability:</strong> Recruiters can tweak, customize, or discard drafts before approval.</li>
                <li><strong>Immutable Signing:</strong> Every approved action records reviewer identity and exact timestamp.</li>
                <li><strong>Anti-Spam Idempotency:</strong> Prevents multiple identical emails to the same candidate.</li>
              </ul>
            </div>

            <div className="hp-sketch-card">
              <img
                src="/illustrations/approval-gate-sketch.svg"
                alt="Pencil Sketch of Human Approval Gate and Shield"
                className="hp-sketch-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          SECTION 7: CALL TO ACTION BANNER
      ------------------------------------------------------------- */}
      <section className="hp-cta-banner">
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 className="hp-cta-title">Ready to bring speed and accountability to your hiring pipeline?</h2>
          <p className="hp-cta-desc">
            Explore the live dashboard, configure your team's SLAs, and see how easy it is to keep candidates engaged and moving forward.
          </p>
          <Link href="/dashboard" className="hp-btn-white">
            Launch Stall Alerter Dashboard
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </Link>
        </div>
      </section>

      {/* -------------------------------------------------------------
          FOOTER (Fluid Animated Waves & Metadata)
      ------------------------------------------------------------- */}
      <FluidFooter
        appName="Stall Alerter"
        tagline="Production Hiring Pipeline Monitoring & Recruiter Decision Support"
      />
    </div>
  );
}
