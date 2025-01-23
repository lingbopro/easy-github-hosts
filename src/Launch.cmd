@echo off
cls
title Easy GitHub Hosts Launcher

:: Check for administrator privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Requesting administrative privileges...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo.
echo Welcome to Easy GitHub Hosts Launcher
echo Version 1.0
echo.
echo Running on directory: %cd%
echo Changing directory to local directory...
cd /d %~dp0
echo Now running on directory: %cd%
if exist main.js ( goto Select ) else ( goto scriptnotfound )
:scriptnotfound
echo.
echo Error: main.js not found.
echo Please make sure you have the main.js file in the same directory as this script.
goto exit
exit
:Select
echo.
echo Select an option:
echo.
echo 1. Update GitHub Hosts
echo 2. Restore Original Hosts
echo 3. Exit
echo.
set /p choice=Enter your choice (1-3): 
if %choice%==1 goto update
if %choice%==2 goto restore
if %choice%==3 goto exit
echo Invalid choice. Please try again.
goto Select
:update
node main.js update
goto exit
:restore
node main.js restore
goto exit
:exit
echo.
echo Press any key to exit...
pause >nul
exit