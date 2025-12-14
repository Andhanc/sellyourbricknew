@echo off
chcp 65001 >nul
echo ========================================
echo Исправление remote репозитория
echo ========================================
echo.

echo Проверка текущего remote...
git remote -v

echo.
echo Удаление старого remote...
git remote remove origin

echo.
echo Добавление нового remote...
git remote add origin https://github.com/Andhanc/sellyourbricknew.git

echo.
echo Проверка нового remote...
git remote -v

echo.
echo ========================================
echo Remote успешно обновлен!
echo ========================================
echo Теперь можно выполнить: git push -u origin main --force
echo.
pause

