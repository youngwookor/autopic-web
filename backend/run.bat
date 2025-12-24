@echo off
chcp 65001 > nul
cd /d "%~dp0"

echo ========================================
echo   AUTOPIC Backend Server
echo ========================================
echo.

if not exist "venv\Scripts\activate.bat" (
    echo [INFO] Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat

echo [INFO] Installing dependencies...
pip install -r requirements.txt -q

echo.
echo [INFO] Starting server...
echo [INFO] API Docs: http://localhost:8000/docs
echo [INFO] Press Ctrl+C to stop
echo.

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
