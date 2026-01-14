@echo off
chcp 65001 >nul
git reset --hard 5b379a1
echo.
echo HEAD is now at 5b379a1 prereg
echo.
git log --oneline -1
pause


