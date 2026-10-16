param(
    [ValidateSet("patch", "minor", "major")]
    [string]$Bump = "patch",
    [switch]$NoBump
)

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
if (-not $NoBump) { & (Join-Path $PSScriptRoot "bump-version.ps1") -Part $Bump }
docker compose up --build -d
docker compose ps
Write-Host "Open http://htrestaurant.com:8080"
Write-Host "Open http://admin.htrestaurant.com:8080"
Write-Host "Open http://teamomnifield.ai:8080"
