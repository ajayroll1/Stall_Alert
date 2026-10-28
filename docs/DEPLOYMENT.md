# STALL ALERTER — Deployment & Operations Runbook

## 1. Environments & Runtime Topology

| Environment | Database | API Service | Web UI | Purpose |
|---|---|---|---|---|
| **Development** | SQLite (`stall_alerter.db`) | Uvicorn (`http://127.0.0.1:8000`) | Next.js (`http://localhost:3000`) | Local feature development & rapid iteration. |
| **Staging** | Managed PostgreSQL (Docker / Cloud) | Containerized FastAPI | Containerized Next.js | Pre-production testing, synthetic loads, ATS sandbox. |
| **Production** | Multi-AZ PostgreSQL with TLS & automated backups | Gunicorn + Uvicorn workers behind Ingress TLS | Next.js Node/Edge runner behind CDN | Live recruiting pipeline monitoring. |

---

## 2. Production Deployment Steps

### Step 1: Environment Configuration
Ensure production environment variables are injected via a secure secrets manager (AWS Secrets Manager, GCP Secret Manager, or HashiCorp Vault):
```bash
STALL_ALERTER_API_KEY="<strong-random-64-character-secret>"
DATABASE_URL="postgresql://user:password@db-host:5432/stall_alerter_prod"
ENVIRONMENT="production"
```

### Step 2: Container Image Build & Security Scan
Build using the root Dockerfile:
```bash
docker build -t stall-alerter-api:latest .
```
Scan for vulnerabilities:
```bash
docker scan stall-alerter-api:latest
```

### Step 3: Run Service with Docker Compose
```bash
docker compose up -d
```

### Step 4: Health Check & Smoke Test
```bash
curl -f http://localhost:8000/health
```
Expected response:
```json
{
  "status": "healthy",
  "service": "Stall Alerter API",
  "version": "2.0.0",
  "timestamp": "2026-10-28T..."
}
```

---

## 3. Operations Runbook & Disaster Recovery

### SLA Scan Backlog / Stall
- **Trigger:** Scheduled scan fails to run or stalls during execution.
- **Action:**
  1. Inspect error logs for database lock timeouts.
  2. Run manual scan: `POST /api/alerts/scan` with `X-API-Key`.
  3. Verify candidate records have valid ISO timestamps.

### Database Backup & Restore
- **Backup:**
  ```bash
  # SQLite local
  sqlite3 stall_alerter.db ".backup 'stall_alerter_backup.db'"
  
  # PostgreSQL production
  pg_dump -U postgres -d stall_alerter_prod -Fc -f backup.dump
  ```
- **Restore:**
  ```bash
  pg_restore -U postgres -d stall_alerter_prod backup.dump
  ```

### Rollback Strategy
If a deployment fails smoke tests:
1. Revert container image to the previous verified digest: `stall-alerter-api:<previous_tag>`.
2. Schema migrations are strictly backward-compatible; no destructive drops without a deprecation window.
