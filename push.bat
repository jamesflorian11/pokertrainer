@echo off
cd /d "C:\Dev\Poker App"

echo ==========================
git add .

echo ==========================
for /f %%i in ('powershell -command "Get-Date -Format yyyy-MM-dd_HH-mm-ss"') do set datetime=%%i
git commit -m "update %datetime%" 2>nul

echo ==========================
git push origin main

echo ==========================
echo Done!
pause