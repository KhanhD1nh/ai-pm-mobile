#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_DIR="$ROOT_DIR/android"
OUTPUT_PATH="$ROOT_DIR/AI-PM-android-release.apk"

if [ ! -d "$ANDROID_DIR" ]; then
  echo "android directory is missing. Run Expo prebuild before this script."
  exit 1
fi

cd "$ANDROID_DIR"
chmod +x ./gradlew
./gradlew :app:assembleRelease --no-daemon

APK_PATH="$(find app/build/outputs/apk/release -name '*.apk' -type f -print -quit)"
if [ -z "$APK_PATH" ]; then
  echo "Release APK was not produced."
  exit 1
fi

cp "$APK_PATH" "$OUTPUT_PATH"
echo "Created APK: $OUTPUT_PATH"
ls -lh "$OUTPUT_PATH"
