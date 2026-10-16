param(
    [ValidateSet("patch", "minor", "major")]
    [string]$Part = "patch"
)

$ErrorActionPreference = "Stop"
$root = Join-Path $PSScriptRoot ".."

# The csproj that Docker builds is the source of truth for the current version.
$sourceCsproj = Join-Path $root "src/TeamOmnifield.Web/TeamOmnifield.Web.csproj"
$files = @(
    $sourceCsproj,
    (Join-Path $root "TeamOmnifield.Web.csproj"),
    (Join-Path $root "package.json")
)

$match = [regex]::Match([IO.File]::ReadAllText($sourceCsproj), "<Version>(\d+)\.(\d+)\.(\d+)</Version>")
if (-not $match.Success) { throw "No <Version>x.y.z</Version> found in $sourceCsproj" }

$major = [int]$match.Groups[1].Value
$minor = [int]$match.Groups[2].Value
$patch = [int]$match.Groups[3].Value
$old = "$major.$minor.$patch"

switch ($Part) {
    "major" { $major++; $minor = 0; $patch = 0 }
    "minor" { $minor++; $patch = 0 }
    "patch" { $patch++ }
}
$new = "$major.$minor.$patch"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
foreach ($file in $files) {
    if (-not (Test-Path $file)) { continue }
    $text = [IO.File]::ReadAllText($file)
    if ($file -like "*.json") {
        # Only the top-level "version" (first occurrence), not dependency versions.
        $text = ([regex]'"version":\s*"[^"]*"').Replace($text, "`"version`": `"$new`"", 1)
    } else {
        $text = ([regex]'<Version>[^<]*</Version>').Replace($text, "<Version>$new</Version>", 1)
    }
    [IO.File]::WriteAllText($file, $text, $utf8NoBom)
}

Write-Host "Version bumped: $old -> $new"
