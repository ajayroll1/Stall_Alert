# STALL ALERTER — Command Execution & Deployment Playbook (v2.5.0)

A comprehensive, production-grade guide for local development, automated testing, database migrations, and cloud deployments (Vercel + Render).

---

## 1. Quick Reference Sheet

| Task | Command | Description |
|---|---|---|
| **Start Backend (Local)** | `python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload` | Runs FastAPI server at `http://127.0.0.1:8000` |
| **Start Frontend (Local)** | `cd web && npm run dev` | Runs Next.js 16 UI at `http://localhost:3000` |
| **One-Click Run (Windows)** | `.\start_all.bat` | Launches both servers in dedicated terminal windows |
| **Run Pytest Suite** | `pytest -v` | Runs unit & integration test suite |
| **Run Offline Verifier** | `python -c "import sys; sys.path.insert(0, '.'); import tests.run_offline_verification as r; r.run_all_offline_tests()"` | Validates SLA scan math, draft generation, and approval |
| **Docker Build & Run** | `docker compose up --build -d` | Launches containerized environment |
| **Database Migration** | `python migrate_uploaded_files.py` | Migrates SQLite tables (`uploaded_files`, raw text storage) |

---

## 2. Local Environment Setup

### 2.1. Prerequisites
- **Python:** 3.11+ or 3.14+
- **Node.js:** 18+ or 20+ (with `npm`)
- **Git**

### 2.2. Backend Setup
1. Clone repository and install Python packages:
   ```bash
   git clone https://github.com/ajayroll1/Stall_Alert.git
   cd Stall_Alert
   pip install -r requirements.txt
   ```
2. Configure `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```
3. Start the FastAPI development server:
   ```powershell
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   - OpenAPI Docs: `http://127.0.0.1:8000/docs`
   - Healthcheck: `http://127.0.0.1:8000/health`

### 2.3. Frontend Setup
1. Enter `web/` directory and install dependencies:
   ```powershell
   cd web
   npm install
   ```
2. Verify or create `web/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
   NEXT_PUBLIC_API_KEY=dev-stall-alerter-secret-key-32chars-min
   ```
3. Start Next.js development server:
   ```powershell
   npm run dev
   ```
   - Ops Console: `http://localhost:3000/dashboard`

---

## 3. Testing & Automated Verification

### 3.1. Pytest Test Suite
```bash
pytest -v
```
Validates:
- CSV row parsing and field sanitization (CSV formula injection defense)
- SLA scanner breach detection (Medium $\ge 1.0\times$, High $\ge 1.5\times$, Critical $\ge 2.0\times$)
- Approval state transitions (`draft` $\rightarrow$ `approved` / `rejected`)
- File ingestion history endpoints (`/api/files`)

### 3.2. Manual E2E Smoke Test
Upload test data file via cURL:
```bash
curl -X POST "http://127.0.0.1:8000/api/candidates/import" \
  -H "X-API-Key: dev-stall-alerter-secret-key-32chars-min" \
  -F "file=@examples/candidates.csv"
```
Trigger deterministic scan:
```bash
curl -X POST "http://127.0.0.1:8000/api/alerts/scan" \
  -H "X-API-Key: dev-stall-alerter-secret-key-32chars-min"
```

---

## 4. Production Cloud Deployment

### 4.1. Live Environments
- **Frontend (Vercel):** [https://stall-alert.vercel.app](https://stall-alert.vercel.app)
- **Backend (Render):** [https://stall-alert.onrender.com](https://stall-alert.onrender.com)

### 4.2. Deploying Backend to Render
1. Create a **New Web Service** connected to `ajayroll1/Stall_Alert`.
2. Configure settings:
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Configure Environment Variables in Render:
   - `API_KEY`: Production 32+ character key
   - `SMTP_HOST`: `smtp.gmail.com`
   - `SMTP_PORT`: `587`
   - `SMTP_USER`: `ajaymahto2580@gmail.com`
   - `SMTP_PASSWORD`: `<App_Password>`
   - `SENDER_EMAIL`: `ajaymahto2580@gmail.com`

### 4.3. Deploying Frontend to Vercel
1. Import repository in [Vercel](https://vercel.com).
2. Set **Root Directory** to `web`.
3. Set **Framework Preset** to `Next.js`.
4. Configure Project Environment Variables:
   - `NEXT_PUBLIC_API_URL`: `https://stall-alert.onrender.com`
   - `NEXT_PUBLIC_API_KEY`: Matching production `API_KEY`
5. Click **Deploy**.

---

## 5. Dockerized Deployment

To run the entire stack on any Linux VPS (AWS, DigitalOcean, Hetzner):
```bash
# Clone repository
git clone https://github.com/ajayroll1/Stall_Alert.git
cd Stall_Alert

# Build and start in background
docker compose up --build -d

# Check live logs
docker compose logs -f

# Stop containers
docker compose down
```
