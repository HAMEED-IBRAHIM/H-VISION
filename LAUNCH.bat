@echo off
title H-VISION LAUNCHER
color 0A
echo ============================================
echo   H-VISION / JANUS-Sentinel - Full Launch
echo ============================================

:: Kill any old processes
echo [1/7] Killing old processes...
taskkill /f /im chroma.exe >nul 2>&1
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: Start ChromaDB
echo [2/7] Starting ChromaDB on port 8002...
start "ChromaDB" /min "C:\Users\HAMEED\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\LocalCache\local-packages\Python313\Scripts\chroma.exe" run --host localhost --port 8002 --path "c:\Users\HAMEED\OneDrive\Desktop\H-VISION\chroma_data"
timeout /t 6 /nobreak >nul

:: Start API
echo [3/7] Starting API on port 8000...
start "JANUS-API" /min cmd /c "cd /d c:\Users\HAMEED\OneDrive\Desktop\H-VISION\api && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
timeout /t 8 /nobreak >nul

:: Start Target App
echo [4/7] Starting Target App on port 8001...
start "Target-App" /min cmd /c "cd /d c:\Users\HAMEED\OneDrive\Desktop\H-VISION\target_app && python -m uvicorn app.main:app --host 0.0.0.0 --port 8001"
timeout /t 4 /nobreak >nul

:: Start Blue Agent
echo [5/7] Starting Blue Agent...
start "Blue-Agent" /min cmd /c "cd /d c:\Users\HAMEED\OneDrive\Desktop\H-VISION\agents\blue_agent && set API_URL=http://localhost:8000 && set INTERNAL_SERVICE_TOKEN=internal-service-token-change-in-prod && python -m app.main"
timeout /t 2 /nobreak >nul

:: Start Red Agent
echo [6/7] Starting Red Agent...
start "Red-Agent" /min cmd /c "cd /d c:\Users\HAMEED\OneDrive\Desktop\H-VISION\agents\red_agent && set TARGET_URL=http://localhost:8001 && set API_URL=http://localhost:8000 && set INTERNAL_SERVICE_TOKEN=internal-service-token-change-in-prod && python -m app.main"
timeout /t 2 /nobreak >nul

:: Start Frontend
echo [7/7] Starting Frontend on port 5173...
start "Frontend" /min cmd /c "cd /d c:\Users\HAMEED\OneDrive\Desktop\H-VISION\frontend && npx vite --host"
timeout /t 5 /nobreak >nul

:: Open browser
echo Opening browser...
start "" "http://localhost:5173"

echo.
echo ============================================
echo   ALL SERVICES LAUNCHED!
echo   Open: http://localhost:5173
echo   Login with any username + password
echo ============================================
pause
