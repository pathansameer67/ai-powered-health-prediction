# AI Healthcare Information Assistant - Startup Script for Windows PowerShell

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   AI HEALTHCARE INFORMATION ASSISTANT (Clinical RAG)     " -ForegroundColor White -BackgroundColor DarkCyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Ensure database & knowledge base are seeded
Write-Host "[1/3] Checking & Seeding Knowledge Base..." -ForegroundColor Yellow
python scripts/seed_trusted_docs.py

# Step 2: Start FastAPI Backend in background
Write-Host "[2/3] Starting FastAPI Backend on http://localhost:8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

# Step 3: Start Vite React Frontend
Write-Host "[3/3] Starting Vite React Frontend on http://localhost:5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " Services Successfully Launched!" -ForegroundColor Green
Write-Host " - Frontend UI:      http://localhost:5173" -ForegroundColor White
Write-Host " - Backend API:      http://localhost:8000" -ForegroundColor White
Write-Host " - OpenAPI Swagger:  http://localhost:8000/docs" -ForegroundColor White
Write-Host " - Safety Standard:  Category A (112), B (Review), C (Info)" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
