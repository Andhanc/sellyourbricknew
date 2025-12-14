# Скрипт для настройки Git и загрузки проекта на GitHub

Write-Host "Инициализация Git репозитория..." -ForegroundColor Green
git init

Write-Host "Добавление всех файлов..." -ForegroundColor Green
git add .

Write-Host "Создание первого коммита..." -ForegroundColor Green
git commit -m "Initial commit: новая версия проекта"

Write-Host "Добавление remote репозитория..." -ForegroundColor Green
git remote add origin https://github.com/Andhanc/sellyourbricknew.git

Write-Host "Проверка remote..." -ForegroundColor Green
git remote -v

Write-Host "Загрузка на GitHub..." -ForegroundColor Green
Write-Host "Внимание: Если в репозитории уже есть код, будет выполнена force push!" -ForegroundColor Yellow
git branch -M main
git push -u origin main --force

Write-Host "Готово! Проект загружен на GitHub." -ForegroundColor Green

