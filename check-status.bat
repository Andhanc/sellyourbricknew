@echo off
chcp 65001 >nul
echo ========================================
echo Проверка статуса Git
echo ========================================
echo.

echo Текущий коммит:
git log -1 --oneline
echo.

echo Статус репозитория:
git status
echo.

echo ========================================
echo Если есть изменения, которые нужно отменить:
echo Выполните: git checkout -- .
echo Или: git reset --hard HEAD
echo ========================================
pause
