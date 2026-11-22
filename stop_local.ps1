# H-VISION — Stop All Local Services
Write-Host "Stopping H-VISION services..." -ForegroundColor Yellow

# Stop Python processes (API, Target, Agents, ChromaDB)
Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -match "uvicorn|chromadb|app.main"
} | Stop-Process -Force -ErrorAction SilentlyContinue

# Stop Node processes (Vite frontend)
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -match "vite"
} | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "[OK] All H-VISION services stopped." -ForegroundColor Green
