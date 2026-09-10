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

# Expo prebuild generates conservative Gradle memory defaults (2 GiB heap and
# 512 MiB metaspace). The SDK 57 release graph can exhaust that metaspace while
# KSP and native modules compile on GitHub-hosted runners, leaving Gradle alive
# until the workflow timeout. Override only the generated CI project settings;
# android/ is gitignored and recreated by Expo prebuild for every run.
python3 - <<'PY'
from pathlib import Path

path = Path("gradle.properties")
text = path.read_text()
overrides = {
    "org.gradle.jvmargs": "-Xmx3072m -XX:MaxMetaspaceSize=1536m -Dfile.encoding=UTF-8",
    "org.gradle.parallel": "false",
    "org.gradle.workers.max": "2",
}

lines = text.splitlines()
seen = set()
for index, line in enumerate(lines):
    key = line.split("=", 1)[0].strip() if "=" in line else ""
    if key in overrides:
        lines[index] = f"{key}={overrides[key]}"
        seen.add(key)

for key, value in overrides.items():
    if key not in seen:
        lines.append(f"{key}={value}")

path.write_text("\n".join(lines) + "\n")
PY

echo "Gradle CI memory settings:"
grep -E '^org\.gradle\.(jvmargs|parallel|workers\.max)=' gradle.properties

# Keep all Expo/React Native default ABIs so the generated APK remains a
# universal internal artifact rather than silently dropping device support.
./gradlew :app:assembleRelease --no-daemon --stacktrace

APK_PATH="$(find app/build/outputs/apk/release -name '*.apk' -type f -print -quit)"
if [ -z "$APK_PATH" ]; then
  echo "Release APK was not produced."
  exit 1
fi

cp "$APK_PATH" "$OUTPUT_PATH"
echo "Created APK: $OUTPUT_PATH"
ls -lh "$OUTPUT_PATH"
