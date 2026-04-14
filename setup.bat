@echo off
REM ═══════════════════════════════════════════════════════════
REM IT Strategy Diagnostic — One-Click Setup (Windows)
REM Double-click this file to set everything up.
REM ═══════════════════════════════════════════════════════════

echo.
echo ╔══════════════════════════════════════════════╗
echo ║   IT Strategy Diagnostic — Setup             ║
echo ╚══════════════════════════════════════════════╝
echo.

REM Navigate to the script's directory
cd /d "%~dp0"
echo Working directory: %CD%
echo.

REM ── Step 1: Check for a JavaScript runtime ──
echo Step 1: Checking for JavaScript runtime...

set RUNTIME=
set RUNNER=

REM Check for Node.js
where node >nul 2>&1
if %ERRORLEVEL%==0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
    echo   [OK] Node.js %NODE_VER% found
    set RUNTIME=node
    set RUNNER=npm
    goto :found_runtime
)

REM Check for Bun
where bun >nul 2>&1
if %ERRORLEVEL%==0 (
    for /f "tokens=*" %%i in ('bun --version') do set BUN_VER=%%i
    echo   [OK] Bun %BUN_VER% found
    set RUNTIME=bun
    set RUNNER=bun
    goto :found_runtime
)

REM Neither found — install Bun
echo   [!!] No JavaScript runtime found.
echo.
echo   Installing Bun (lightweight JavaScript runtime)...
echo   This does NOT require admin access.
echo.

powershell -Command "irm bun.sh/install.ps1 | iex"

REM Refresh PATH
set "BUN_INSTALL=%USERPROFILE%\.bun"
set "PATH=%BUN_INSTALL%\bin;%PATH%"

where bun >nul 2>&1
if %ERRORLEVEL%==0 (
    for /f "tokens=*" %%i in ('bun --version') do set BUN_VER=%%i
    echo.
    echo   [OK] Bun %BUN_VER% installed successfully
    set RUNTIME=bun
    set RUNNER=bun
    goto :found_runtime
) else (
    echo.
    echo   [ERROR] Installation failed. Please install manually:
    echo     Option A: https://bun.sh
    echo     Option B: https://nodejs.org (v24+)
    echo.
    pause
    exit /b 1
)

:found_runtime
echo.

REM ── Step 2: Install dependencies ──
echo Step 2: Installing dependencies...

if "%RUNNER%"=="bun" (
    echo   Using Bun...
    call bun install
    cd mcp-server && call bun install && cd ..
) else (
    echo   Using npm...
    call npm install
    cd mcp-server && call npm install && cd ..
)

echo   [OK] Dependencies installed
echo.

REM ── Step 3: Find an available port ──
echo Step 3: Checking port 3456...

set PORT=3456
netstat -an | findstr ":3456 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL%==0 (
    echo   [!!] Port 3456 is in use, trying 4567...
    set PORT=4567
    netstat -an | findstr ":4567 " | findstr "LISTENING" >nul 2>&1
    if %ERRORLEVEL%==0 (
        echo   [!!] Port 4567 is in use, trying 8080...
        set PORT=8080
    )
)

echo   [OK] Using port %PORT%
echo.

REM ── Step 4: Start the web UI ──
echo Step 4: Starting the web UI...
echo.
echo ╔══════════════════════════════════════════════╗
echo ║                                              ║
echo ║   Open your browser to:                      ║
echo ║   http://localhost:%PORT%                       ║
echo ║                                              ║
echo ║   Press Ctrl+C to stop the server.           ║
echo ║                                              ║
echo ╚══════════════════════════════════════════════╝
echo.

REM Open browser after a short delay
start /b cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:%PORT%"

REM Start the dev server
if "%RUNNER%"=="bun" (
    set PORT=%PORT% && bun --bun node_modules/next/dist/bin/next dev --port %PORT%
) else (
    set PORT=%PORT% && node node_modules/next/dist/bin/next dev --port %PORT%
)

pause
