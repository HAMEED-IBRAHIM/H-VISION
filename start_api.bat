@echo off
title H-VISION API (port 8000)
cd /d c:\Users\HAMEED\OneDrive\Desktop\H-VISION\api
echo Starting H-VISION API...
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
pause
