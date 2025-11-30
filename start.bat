@echo off
cd /d "%~dp0"
echo Установка зависимостей...
call npm install
if %errorlevel% neq 0 (
    echo Ошибка при установке зависимостей
    pause
    exit /b %errorlevel%
)
echo Запуск dev-сервера...
call npm run dev



