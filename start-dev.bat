@echo off
set ELECTRON_RUN_AS_NODE=1
cd /d "%~dp0"
echo ===================================================
echo   KSN Super Store - Starting Local Server
echo   Open in your browser: http://localhost:3000
echo ===================================================
C:\Users\dinesh\AppData\Local\Programs\antigravity\Antigravity.exe node_modules\next\dist\bin\next dev -H 0.0.0.0 --webpack
pause
