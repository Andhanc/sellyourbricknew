@echo off
chcp 65001 >nul
echo Откат изменений к последнему коммиту...
git restore .
if errorlevel 1 (
    echo Попытка альтернативного метода...
    git checkout -- .
)
echo Готово!


