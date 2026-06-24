#!/usr/bin/env bash
# Build APK/AAB Android via Docker
set -euo pipefail

API_URL="${1:-https://api.realmeety.fr}"
BUILD_TYPE="${2:-apk}"
APP_DIR="$(cd "$(dirname "$0")/../app" && pwd)"

CMD="flutter build apk --release"
if [ "$BUILD_TYPE" = "aab" ]; then
  CMD="flutter build appbundle --release"
fi

docker run --rm \
  -v "$APP_DIR:/app" -w /app \
  ghcr.io/cirruslabs/flutter:stable \
  sh -c "flutter pub get && $CMD \
    --dart-define=API_BASE_URL=$API_URL \
    --dart-define=BETA_MODE=true"

echo "Build terminé dans app/build/"
