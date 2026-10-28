"use client";

import React, { useEffect, useRef } from "react";

interface FluidFooterProps {
  appName?: string;
  tagline?: string;
}

export default function FluidFooter({
  appName = "Stall Alerter",
  tagline = "Hiring Pipeline Stall Detection & Operational Workflow Automation",
}: FluidFooterProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 1200);
    let height = (canvas.height = 180);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = 180;
    };
    window.addEventListener("resize", handleResize);

    // Dynamic wave / particle state
    let step = 0;
    const waves = [
      { speed: 0.02, length: 0.007, amplitude: 22, color: "rgba(30, 61, 52, 0.35)", offset: 0 },
      { speed: 0.015, length: 0.011, amplitude: 16, color: "rgba(60, 107, 93, 0.25)", offset: 1.5 },
      { speed: 0.025, length: 0.009, amplitude: 18, color: "rgba(245, 158, 11, 0.15)", offset: 3.0 },
    ];

    // Floating particles (antigravity pulse nodes)
    const particles: Array<{ x: number; y: number; radius: number; vx: number; vy: number; alpha: number }> = [];
    for (let i = 0; i < 24; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 1,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.5 - 0.2, // upward fluid float
        alpha: Math.random() * 0.6 + 0.2,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw animated fluid harmonic waves
      waves.forEach((wave) => {
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 4) {
          const y =
            height * 0.65 +
            Math.sin(x * wave.length + step * wave.speed + wave.offset) * wave.amplitude +
            Math.cos((x * 0.005) + step * 0.01) * 8;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fillStyle = wave.color;
        ctx.fill();
      });

      // 2. Draw glowing fluid antigravity particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Reset if float out of bounds
        if (p.y < 10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 158, 11, ${p.alpha})`;
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      step += 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <footer className="fluid-footer-wrap">
      <div className="fluid-canvas-container">
        <canvas ref={canvasRef} className="fluid-canvas" />
      </div>

      <div className="fluid-footer-content">
        <div className="footer-brand-section">
          <div className="footer-logo-row">
            <img src="/stall-logo.svg" alt="Stall Alerter Logo" width={38} height={38} className="footer-logo-img" />
            <div>
              <div className="footer-app-name">{appName}</div>
              <div className="footer-tagline">{tagline}</div>
            </div>
          </div>
        </div>

        <div className="footer-meta-row">
          <div className="footer-badge-list">
            <span className="footer-chip">Deterministic SLA</span>
            <span className="footer-chip">Human-in-the-Loop</span>
            <span className="footer-chip">Zero-Biased AI</span>
            <span className="footer-chip">Immutable Audit</span>
          </div>
          <div className="footer-copy">
            &copy; 2026 Stall Alerter &bull; Production Recruiting Operations Console
          </div>
        </div>
      </div>
    </footer>
  );
}
