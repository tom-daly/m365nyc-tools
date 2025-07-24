@echo off
echo =================================
echo    Test Data Generator Menu
echo =================================
echo.
echo Select a scenario:
echo 1. Small (10 users)
echo 2. Medium (50 users) 
echo 3. Large (100 users)
echo 4. Custom (25 users, higher points)
echo 5. Exit
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo Running small scenario...
    npm run test-data:small
) else if "%choice%"=="2" (
    echo Running medium scenario...
    npm run test-data:medium
) else if "%choice%"=="3" (
    echo Running large scenario...
    npm run test-data:large
) else if "%choice%"=="4" (
    echo Running custom scenario...
    npm run test-data:custom
) else if "%choice%"=="5" (
    echo Goodbye!
    exit
) else (
    echo Invalid choice. Please try again.
    pause
    goto :eof
)

echo.
echo Generation complete!
pause
