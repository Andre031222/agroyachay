@echo off
setlocal
set "ROOT=%~dp0"
set "PY=%ROOT%.venv\Scripts\python.exe"

if not exist "%PY%" (
    echo Python no encontrado. Crea el entorno con: python -m venv .venv
    pause & exit /b 1
)

if not exist "%ROOT%frontend\node_modules" (
    echo Instalando dependencias del frontend...
    cd /d "%ROOT%frontend" && call pnpm install
)

start "AgroYachay Backend"  cmd /k "cd /d "%ROOT%backend"  && "%PY%" main.py"
timeout /t 5 /nobreak > nul
start "AgroYachay Frontend" cmd /k "cd /d "%ROOT%frontend" && pnpm dev"
