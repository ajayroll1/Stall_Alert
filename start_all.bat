@echo off
echo ========================================================
echo Starting Stall Alerter Services (Backend + Next.js UI)
echo ========================================================

echo [1/2] Starting Python FastAPI Backend on http://127.0.0.1:8000 ...
start "Stall Alerter - FastAPI Backend" cmd /k "python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting Next.js Web Frontend on http://localhost:3000 ...
start "Stall Alerter - Next.js Frontend" cmd /k "cd web && npm run dev"

echo.
echo Both servers are launching in separate windows!
echo - Web Console:  http://localhost:3000
echo - API Docs:     http://127.0.0.1:8000/docs
echo - API Health:   http://127.0.0.1:8000/health
echo ========================================================
