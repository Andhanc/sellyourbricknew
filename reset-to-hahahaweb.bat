@echo off
chcp 65001 >nul
echo Откат к коммиту hahahaweb...
git reset --hard df4aff2
if errorlevel 1 (
    echo Попытка поиска коммита по сообщению...
    for /f "tokens=1" %%i in ('git log --all --grep="hahahaweb" --format=%%H -1') do set COMMIT_HASH=%%i
    if defined COMMIT_HASH (
        git reset --hard %COMMIT_HASH%
    ) else (
        echo Коммит не найден!
        pause
        exit /b 1
    )
)
echo Готово! Проект откачен к коммиту hahahaweb
pause

