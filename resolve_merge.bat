@echo off
chcp 65001 >nul
echo ========================================
echo Resolving merge conflicts: andrej -^> main
echo ========================================
echo.

echo [1/6] Switching to main branch...
git checkout main
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to checkout main branch
    pause
    exit /b 1
)

echo [2/6] Updating main branch from remote...
git pull origin main
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Failed to pull main, continuing anyway...
)

echo [3/6] Merging andrej into main...
git merge andrej -X theirs --no-edit
if %ERRORLEVEL% NEQ 0 (
    echo Conflicts detected, resolving with andrej version...
    echo [4/6] Using andrej version for all conflicts...
    git checkout --theirs .
    git add .
    echo [5/6] Committing merge...
    git commit -m "Merge andrej into main - resolved conflicts using andrej version"
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to commit merge
        pause
        exit /b 1
    )
) else (
    echo Merge completed without conflicts!
)

echo [6/6] Switching back to andrej branch...
git checkout andrej

echo.
echo ========================================
echo Merge completed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Review the changes: git log main ^-1
echo 2. Push to remote: git push origin main
echo.
pause
