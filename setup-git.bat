@echo off
chcp 65001 >nul
echo ========================================
echo Настройка Git и загрузка на GitHub
echo ========================================
echo.

echo [1/6] Инициализация Git репозитория...
git init
if errorlevel 1 (
    echo ОШИБКА: Не удалось инициализировать Git
    pause
    exit /b 1
)

echo.
echo [2/6] Добавление всех файлов...
git add .
if errorlevel 1 (
    echo ОШИБКА: Не удалось добавить файлы
    pause
    exit /b 1
)

echo.
echo [3/6] Создание первого коммита...
git commit -m "Initial commit: новая версия проекта"
if errorlevel 1 (
    echo ПРЕДУПРЕЖДЕНИЕ: Возможно, нет изменений для коммита
)

echo.
echo [4/6] Проверка существующего remote...
git remote remove origin 2>nul
echo Добавление remote репозитория...
git remote add origin https://github.com/Andhanc/sellyourbricknew.git
if errorlevel 1 (
    echo ОШИБКА: Не удалось добавить remote
    pause
    exit /b 1
)

echo.
echo [5/6] Проверка remote...
git remote -v

echo.
echo [6/6] Загрузка на GitHub...
echo ВНИМАНИЕ: Если в репозитории уже есть код, будет выполнена force push!
echo.
git branch -M main 2>nul
git push -u origin main --force
if errorlevel 1 (
    echo.
    echo ОШИБКА: Не удалось загрузить на GitHub
    echo Возможные причины:
    echo - Нет авторизации (нужен Personal Access Token)
    echo - Нет прав на запись в репозиторий
    echo - Проблемы с сетью
    echo.
    echo Попробуйте выполнить команды вручную или используйте GitHub Desktop
    pause
    exit /b 1
)

echo.
echo ========================================
echo Готово! Проект загружен на GitHub
echo ========================================
echo Репозиторий: https://github.com/Andhanc/sellyourbricknew
echo.
pause

