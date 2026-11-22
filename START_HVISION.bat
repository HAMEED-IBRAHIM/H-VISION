@echo off
title H-VISION Master Launcher
color 0A
echo =============================================
echo   H-VISION / JANUS-Sentinel - Full Launch
echo =============================================
echo.

echo [*] Killing old processes...
taskkill /f /im chroma.exe >nul 2>&1
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
timeout /t 3 /nobreak >nul

echo [1/4] Starting ChromaDB on port 8002...
start "ChromaDB :8002" c:\Users\HAMEED\OneDrive\Desktop\H-VISION\start_chromadb.bat
timeout /t 7 /nobreak >nul

echo [2/4] Starting API on port 8000...
start "JANUS API :8000" c:\Users\HAMEED\OneDrive\Desktop\H-VISION\start_api.bat
timeout /t 8 /nobreak >nul

echo [3/4] Starting Target App on port 8001...
start "Target App :8001" c:\Users\HAMEED\OneDrive\Desktop\H-VISION\start_target.bat
timeout /t 4 /nobreak >nul

echo [4/4] Starting Frontend on port 5173...
start "Frontend :5173" c:\Users\HAMEED\OneDrive\Desktop\H-VISION\start_frontend.bat
timeout /t 8 /nobreak >nul

echo.
echo [*] Opening browser...
start "" "http://localhost:5173"

echo.
echo =============================================
echo  ALL 4 SERVICES LAUNCHED IN SEPARATE WINDOWS
echo  
echo  Login: type any username + any password
echo  URL:   http://localhost:5173
echo =============================================
echo.
echo Keep this window open. Close it to stop launcher.
pause
