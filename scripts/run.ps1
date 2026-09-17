$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
docker compose up --build -d
docker compose ps
Write-Host "Open http://htrestaurant.com:8080"
Write-Host "Open http://admin.htrestaurant.com:8080"
Write-Host "Open http://teamomnifield.ai:8080"
