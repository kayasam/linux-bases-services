@echo off
chcp 65001 >nul
pwsh -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0publier-les-cours.ps1"
echo.
pause
