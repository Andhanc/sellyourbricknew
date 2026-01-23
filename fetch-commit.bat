@echo off
chcp 65001 >nul
echo Получение последних изменений из репозитория...
git fetch origin
echo.
echo Проверка коммита a9dc649...
git show a9dc649 --oneline
echo.
echo Применение коммита...
git checkout a9dc649
if errorlevel 1 (
    echo Попытка создать новую ветку с этим коммитом...
    git checkout -b temp-commit a9dc649
)
echo.
echo Готово!
pause
