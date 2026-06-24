# Build APK Android via Docker (sans Flutter local)

param(
    [string]$ApiUrl = "https://api.realmeety.fr",
    [switch]$Bundle
)

$ErrorActionPreference = "Stop"
$AppDir = Join-Path $PSScriptRoot "..\app"

Write-Host "==> Build Android $(if ($Bundle) { 'AAB' } else { 'APK' })..."
Write-Host "    API_BASE_URL=$ApiUrl"

$buildCmd = if ($Bundle) {
    "flutter build appbundle --release --dart-define=API_BASE_URL=$ApiUrl --dart-define=BETA_MODE=true"
} else {
    "flutter build apk --release --dart-define=API_BASE_URL=$ApiUrl --dart-define=BETA_MODE=true"
}

docker run --rm `
    -v "${AppDir}:/app" `
    -w /app `
    ghcr.io/cirruslabs/flutter:stable `
    sh -c "flutter pub get && $buildCmd"

$output = if ($Bundle) {
    Join-Path $AppDir "build\app\outputs\bundle\release\app-release.aab"
} else {
    Join-Path $AppDir "build\app\outputs\flutter-apk\app-release.apk"
}

if (Test-Path $output) {
    Write-Host "==> Build réussi : $output" -ForegroundColor Green
} else {
    Write-Host "==> Build échoué" -ForegroundColor Red
    exit 1
}
