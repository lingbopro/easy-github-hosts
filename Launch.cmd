@echo off
cls
title Easy GitHub Hosts Launcher
echo.
echo Welcome to Easy GitHub Hosts Launcher
echo Version 1.0
echo.
echo Running on dictionary: %cd%
echo Changing directory to local dictionary...
cd %~dp0
echo Now running on dictionary: %cd%
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
set /p choice=Enter your choice:
if %choice%==1 goto update
if %choice%==2 goto restore
if %choice%==3 goto exit
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