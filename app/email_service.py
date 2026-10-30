"""
Email Dispatcher Module for Stall Alerter
Handles both:
1. Internal Recruiter Alert Digests (Proactive SLA breach summaries)
2. External Follow-up Outreach to Candidates (Strict Human-in-the-Loop Approved)
"""

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any, List, Optional

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "ajaymahto2580@gmail.com")
SMTP_PASS = os.getenv("SMTP_PASS", "frgxopbjbuxnnmrh")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "Stall Alerter <ajaymahto2580@gmail.com>")

def send_smtp_email(to_email: str, subject: str, html_body: str, text_body: Optional[str] = None) -> Dict[str, Any]:
    """Base SMTP transport utility using STARTTLS."""
    if not SMTP_USER or not SMTP_PASS:
        return {"status": "skipped", "message": "SMTP credentials not configured."}

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = SMTP_FROM_EMAIL
    msg["To"] = to_email

    if text_body:
        msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=12)
        server.ehlo()
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, [to_email], msg.as_string())
        server.quit()
        return {"status": "sent", "recipient": to_email, "subject": subject}
    except Exception as e:
        return {"status": "failed", "error": str(e), "recipient": to_email}


def send_recruiter_digest_email(
    to_email: str,
    total_open: int,
    critical_count: int,
    high_count: int,
    overdue_candidates: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Sends an executive, modern pipeline health digest to recruiters/ops leads.
    """
    subject = f"[Stall Alerter] Hiring Pipeline Digest: {total_open} Applications Exceeding SLA ({critical_count} Critical)"
    
    # Build candidate table rows
    rows_html = ""
    for c in overdue_candidates[:8]:  # Display top 8 most urgent
        sev = c.get("severity", "medium").lower()
        badge_bg = "#fdf2f2" if sev == "critical" else "#fffbeb" if sev == "high" else "#f0fdf4"
        badge_color = "#991b1b" if sev == "critical" else "#92400e" if sev == "high" else "#166534"
        badge_border = "#fecaca" if sev == "critical" else "#fef3c7" if sev == "high" else "#bbf7d0"
        
        rows_html += f"""
        <tr style="border-bottom: 1px solid #e5e2db;">
          <td style="padding: 12px 14px; font-weight: 600; color: #1d2125;">{c.get('candidate_name', 'Unknown')}</td>
          <td style="padding: 12px 14px; color: #535962;">{c.get('job_title', 'Role')}</td>
          <td style="padding: 12px 14px; color: #535962;">{c.get('stage', 'Stage')}</td>
          <td style="padding: 12px 14px; font-weight: 600; color: #1e3d34;">{c.get('days_in_stage', 0):.1f}d</td>
          <td style="padding: 12px 14px;">
            <span style="background: {badge_bg}; color: {badge_color}; border: 1px solid {badge_border}; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase;">
              {sev}
            </span>
          </td>
        </tr>
        """

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f8f6; margin: 0; padding: 30px 15px;">
      <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e2db; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 18px rgba(0,0,0,0.06);">
        
        <!-- Header Ribbon -->
        <div style="background-color: #1e3d34; padding: 26px 30px; color: #ffffff;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.02em;">Stall Alerter</h1>
                <p style="margin: 4px 0 0; font-size: 13px; color: #e8f0ec; opacity: 0.9;">Hiring Pipeline Daily Health & SLA Digest</p>
              </td>
              <td align="right">
                <span style="background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); color: #ffffff; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600;">
                  OPS INTELLIGENCE
                </span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Metric KPI Cards -->
        <div style="padding: 24px 30px 10px;">
          <div style="display: flex; gap: 12px; margin-bottom: 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="32%" style="background: #fdf2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px; text-align: center;">
                  <div style="font-size: 11px; font-weight: 700; color: #991b1b; text-transform: uppercase;">Critical Overdue</div>
                  <div style="font-size: 24px; font-weight: 800; color: #991b1b; margin-top: 4px;">{critical_count}</div>
                </td>
                <td width="2%"></td>
                <td width="32%" style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 14px; text-align: center;">
                  <div style="font-size: 11px; font-weight: 700; color: #92400e; text-transform: uppercase;">High Priority</div>
                  <div style="font-size: 24px; font-weight: 800; color: #92400e; margin-top: 4px;">{high_count}</div>
                </td>
                <td width="2%"></td>
                <td width="32%" style="background: #f3f1ec; border: 1px solid #e5e2db; border-radius: 8px; padding: 14px; text-align: center;">
                  <div style="font-size: 11px; font-weight: 700; color: #535962; text-transform: uppercase;">Total Overdue</div>
                  <div style="font-size: 24px; font-weight: 800; color: #1d2125; margin-top: 4px;">{total_open}</div>
                </td>
              </tr>
            </table>
          </div>

          <p style="font-size: 14px; color: #535962; line-height: 1.5; margin: 0 0 16px;">
            The following candidate applications have exceeded configured stage dwell thresholds and require team action to prevent disengagement or offer loss:
          </p>

          <!-- Candidate Table -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px; text-align: left; border-collapse: collapse; margin-bottom: 25px;">
            <thead>
              <tr style="background: #f9f8f6; border-bottom: 2px solid #e5e2db; color: #535962;">
                <th style="padding: 10px 14px; font-weight: 700;">Candidate</th>
                <th style="padding: 10px 14px; font-weight: 700;">Role</th>
                <th style="padding: 10px 14px; font-weight: 700;">Stage</th>
                <th style="padding: 10px 14px; font-weight: 700;">Dwell</th>
                <th style="padding: 10px 14px; font-weight: 700;">Urgency</th>
              </tr>
            </thead>
            <tbody>
              {rows_html if rows_html else '<tr><td colspan="5" style="padding: 18px; text-align: center; color: #166534; font-weight: 600;">✓ All pipeline candidates currently within SLA thresholds.</td></tr>'}
            </tbody>
          </table>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0 20px;">
            <a href="http://localhost:3000/dashboard" style="background-color: #1e3d34; color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 14px; font-weight: 700; border-radius: 6px; display: inline-block; box-shadow: 0 3px 10px rgba(30,61,52,0.2);">
              Open Operations Console & Review Drafts →
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9f8f6; border-top: 1px solid #e5e2db; padding: 18px 30px; font-size: 12px; color: #7d8590; text-align: center;">
          Sent by <strong>Stall Alerter</strong> • Automated Deterministic SLA Intelligence<br>
          Enforcing strict Human-in-the-Loop review for all candidate actions.
        </div>
      </div>
    </body>
    </html>
    """

    return send_smtp_email(to_email=to_email, subject=subject, html_body=html_body)


def send_approved_candidate_email(
    candidate_email: str,
    candidate_name: str,
    subject: str,
    body_text: str,
    reviewer_name: str
) -> Dict[str, Any]:
    """
    Dispatches a human-approved follow-up directly to the candidate.
    Formatted cleanly and respectfully with company branding.
    """
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fcfbf9; margin: 0; padding: 25px 15px;">
      <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e2db; border-radius: 10px; padding: 35px 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.04);">
        <div style="border-bottom: 2px solid #1e3d34; padding-bottom: 15px; margin-bottom: 25px;">
          <h2 style="margin: 0; color: #1e3d34; font-size: 18px; font-weight: 700;">Recruitment Team Update</h2>
        </div>
        <div style="color: #1d2125; font-size: 15px; line-height: 1.7; white-space: pre-line;">
          {body_text}
        </div>
        <div style="margin-top: 35px; border-top: 1px solid #e5e2db; padding-top: 18px; font-size: 12px; color: #7d8590;">
          This message was reviewed and authorized by {reviewer_name} via Stall Alerter Operations.
        </div>
      </div>
    </body>
    </html>
    """

    return send_smtp_email(
        to_email=candidate_email,
        subject=subject,
        html_body=html_body,
        text_body=body_text
    )
