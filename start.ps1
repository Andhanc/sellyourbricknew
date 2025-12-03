$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "Установка зависимостей..." -ForegroundColor Green
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "Ошибка при установке зависимостей" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "Запуск dev-сервера..." -ForegroundColor Green
npm run dev





