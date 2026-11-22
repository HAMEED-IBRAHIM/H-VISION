# ═══════════════════════════════════════════════════════════════
#  H-VISION (JANUS-Sentinel) — Local Startup Script (No Docker)
# ═══════════════════════════════════════════════════════════════
# Starts all services locally:
#   1. PostgreSQL (local service)
#   2. ChromaDB (embedded server)
#   3. H-VISION API (FastAPI on port 8000)
#   4. Target App (FastAPI on port 8001)
#   5. Blue Agent (Python process)
#   6. Red Agent (Python process)
#   7. Frontend (Vite on port 5173)
# ═══════════════════════════════════════════════════════════════

$ErrorActionPreference = "Continue"
$PROJECT_ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  H-VISION — Starting All Services Locally" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ── Load .env ─────────────────────────────────────────────────
$envFile = Join-Path $PROJECT_ROOT ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $val = $matches[2].Trim()
            [System.Environment]::SetEnvironmentVariable($key, $val, "Process")
        }
    }
    Write-Host "[OK] .env loaded" -ForegroundColor Green
}

# ── Override env vars for local mode ──────────────────────────
$env:DATABASE_URL = "postgresql+asyncpg://janus:januspass@localhost:5432/janus_sentinel"
$env:CHROMA_HOST = "localhost"
$env:CHROMA_PORT = "8002"
$env:JANUS_API_URL = "http://localhost:8000"
$env:API_URL = "http://localhost:8000"
$env:TARGET_URL = "http://localhost:8001"
$env:JANUS_TARGET_HOSTNAME = "localhost"
$env:INTERNAL_SERVICE_TOKEN = "internal-service-token-change-in-prod"
$env:PYTHONDONTWRITEBYTECODE = "1"
$env:PYTHONUNBUFFERED = "1"

# ── Find PostgreSQL ──────────────────────────────────────────
$pgDir = $null
$pgPaths = @(
    "C:\Program Files\PostgreSQL\17\bin",
    "C:\Program Files\PostgreSQL\16\bin",
    "C:\Program Files\PostgreSQL\15\bin"
)
foreach ($p in $pgPaths) {
    if (Test-Path (Join-Path $p "pg_isready.exe")) {
        $pgDir = $p
        break
    }
}

if (-not $pgDir) {
    Write-Host "[ERROR] PostgreSQL not found. Please install PostgreSQL first." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] PostgreSQL found at: $pgDir" -ForegroundColor Green

# ── Ensure PostgreSQL service is running ─────────────────────
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($pgService -and $pgService.Status -ne "Running") {
    Write-Host "[..] Starting PostgreSQL service..." -ForegroundColor Yellow
    Start-Service $pgService.Name
    Start-Sleep 3
}

# ── Create database and user if needed ───────────────────────
Write-Host "[..] Setting up database..." -ForegroundColor Yellow
$env:PGPASSWORD = "januspass"
& "$pgDir\psql" -U postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='janus'" 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    & "$pgDir\createuser" -U postgres -s janus 2>$null
    & "$pgDir\psql" -U postgres -c "ALTER USER janus PASSWORD 'januspass';" 2>$null
}
& "$pgDir\psql" -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='janus_sentinel'" 2>$null | Out-Null
$dbExists = & "$pgDir\psql" -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='janus_sentinel'" 2>$null
if ($dbExists -notmatch "1") {
    & "$pgDir\createdb" -U postgres -O janus janus_sentinel 2>$null
    Write-Host "[OK] Database 'janus_sentinel' created" -ForegroundColor Green
} else {
    Write-Host "[OK] Database 'janus_sentinel' exists" -ForegroundColor Green
}

# ── Start ChromaDB server ────────────────────────────────────
Write-Host "[..] Starting ChromaDB on port 8002..." -ForegroundColor Yellow
$chromaJob = Start-Process -FilePath "python" -ArgumentList "-m", "chromadb.cli", "run", "--host", "localhost", "--port", "8002", "--path", "$PROJECT_ROOT\chroma_data" -WindowStyle Minimized -PassThru
Write-Host "[OK] ChromaDB started (PID: $($chromaJob.Id))" -ForegroundColor Green
Start-Sleep 3

# ── Start H-VISION API ───────────────────────────────────────
Write-Host "[..] Starting H-VISION API on port 8000..." -ForegroundColor Yellow
$apiJob = Start-Process -FilePath "python" -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload" -WorkingDirectory "$PROJECT_ROOT\api" -WindowStyle Minimized -PassThru
Write-Host "[OK] API started (PID: $($apiJob.Id))" -ForegroundColor Green
Start-Sleep 5

# ── Start Target App ─────────────────────────────────────────
Write-Host "[..] Starting Target App on port 8001..." -ForegroundColor Yellow
$targetJob = Start-Process -FilePath "python" -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--reload" -WorkingDirectory "$PROJECT_ROOT\target_app" -WindowStyle Minimized -PassThru
Write-Host "[OK] Target App started (PID: $($targetJob.Id))" -ForegroundColor Green
Start-Sleep 3

# ── Start Blue Agent ─────────────────────────────────────────
Write-Host "[..] Starting Blue Agent..." -ForegroundColor Yellow
$blueJob = Start-Process -FilePath "python" -ArgumentList "-m", "app.main" -WorkingDirectory "$PROJECT_ROOT\agents\blue_agent" -WindowStyle Minimized -PassThru
Write-Host "[OK] Blue Agent started (PID: $($blueJob.Id))" -ForegroundColor Green

# ── Start Red Agent ──────────────────────────────────────────
Write-Host "[..] Starting Red Agent..." -ForegroundColor Yellow
$redJob = Start-Process -FilePath "python" -ArgumentList "-m", "app.main" -WorkingDirectory "$PROJECT_ROOT\agents\red_agent" -WindowStyle Minimized -PassThru
Write-Host "[OK] Red Agent started (PID: $($redJob.Id))" -ForegroundColor Green

# ── Start Frontend ───────────────────────────────────────────
Write-Host "[..] Starting Frontend on port 5173..." -ForegroundColor Yellow
$frontendJob = Start-Process -FilePath "npx" -ArgumentList "vite", "--host" -WorkingDirectory "$PROJECT_ROOT\frontend" -WindowStyle Minimized -PassThru
Write-Host "[OK] Frontend started (PID: $($frontendJob.Id))" -ForegroundColor Green

Start-Sleep 3

Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ H-VISION is RUNNING!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  🌐 Dashboard:   http://localhost:5173" -ForegroundColor Cyan
Write-Host "  🔧 API:         http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "  🎯 Target App:  http://localhost:8001/docs" -ForegroundColor Cyan
Write-Host "  📦 ChromaDB:    http://localhost:8002" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Press Ctrl+C to stop all services" -ForegroundColor Yellow
Write-Host ""

# ── Wait and cleanup on exit ─────────────────────────────────
try {
    while ($true) { Start-Sleep 5 }
} finally {
    Write-Host "`n[..] Stopping all services..." -ForegroundColor Yellow
    @($chromaJob, $apiJob, $targetJob, $blueJob, $redJob, $frontendJob) | ForEach-Object {
        if ($_ -and !$_.HasExited) {
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        }
    }
    Write-Host "[OK] All services stopped." -ForegroundColor Green
}
