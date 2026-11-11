@echo off
setlocal
cd /d "%~dp0"
title Marina Gate Properties - FF-002 Demonstration
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is missing. Please install Node.js 24 or 22.16+ from https://nodejs.org/
  pause
  exit /b 1
)
echo ================================================
echo  MARINA GATE PROPERTIES - JUDGES DEMONSTRATION
echo ================================================
node scripts\setup.mjs
if errorlevel 1 (
  echo Setup failed. Read README.md for troubleshooting.
  pause
  exit /b 1
)
echo.
echo Open http://localhost:3000 in your browser.
echo Login details: data\demo-credentials.txt
echo.
echo Keep this window open during the presentation.
start "" /min powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:3000'"
node server.mjs
pause
