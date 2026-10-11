@echo off
setlocal
title Legal Argument Prototype
cd /d "%~dp0"
if errorlevel 1 goto error_directory

if not exist "%~dp0dist\index.html" goto error_files
if not exist "%~dp0tools\serve.cjs" goto error_files

where.exe node.exe >nul 2>nul
if errorlevel 1 goto error_node
node.exe -e "if (Number(process.versions.node.split('.')[0]) < 22) process.exit(1)"
if errorlevel 1 goto error_node_version

echo Starting the prototype. Keep this window open while using the web page.
node.exe "%~dp0tools\serve.cjs" --open
if errorlevel 1 goto error_server
exit /b 0

:error_directory
echo [ERROR] Could not open the project directory.
goto error_end

:error_files
echo [ERROR] Project files are missing. Extract the entire ZIP before starting.
goto error_end

:error_node
echo [ERROR] Node.js was not found. Install Node.js 22 or later, then try again.
echo If Node.js was just installed, close this window and reopen the launcher.
goto error_end

:error_node_version
echo [ERROR] Node.js 22 or later is required. Your installed version is:
node.exe --version
goto error_end

:error_server
echo [ERROR] The web server could not start. Read the error message above.
goto error_end

:error_end
echo.
echo Press any key to close this window.
pause >nul
exit /b 1
