# Run PowerShell as Administrator before running this script.
$hosts = "$env:SystemRoot\System32\drivers\etc\hosts"
$entries = @(
  "127.0.0.1 htrestaurant.com",
  "127.0.0.1 admin.htrestaurant.com",
  "127.0.0.1 teamomnifield.ai"
)
$content = Get-Content $hosts -ErrorAction SilentlyContinue
foreach ($entry in $entries) {
  $hostName = ($entry -split " ")[1]
  if (-not ($content -match "\s$([regex]::Escape($hostName))$")) { Add-Content -Path $hosts -Value $entry }
}
Write-Host "Local host entries configured."
