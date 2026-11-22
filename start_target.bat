@echo off
title H-VISION Target App (port 8001)
cd /d c:\Users\HAMEED\OneDrive\Desktop\H-VISION\target_app
echo Starting Target App...
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001
pause
