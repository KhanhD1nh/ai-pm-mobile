#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IOS_DIR="$ROOT_DIR/ios"
BUILD_DIR="$ROOT_DIR/build-ios"
PACKAGE_DIR="$ROOT_DIR/unsigned-ipa"
IPA_PATH="$ROOT_DIR/AI-PM-unsigned.ipa"

if [ ! -d "$IOS_DIR" ]; then
  echo "ios directory is missing. Run Expo prebuild before this script."
  exit 1
fi

cd "$IOS_DIR"

WORKSPACE="$(find . -maxdepth 1 -name '*.xcworkspace' -print -quit)"
if [ -z "$WORKSPACE" ]; then
  echo "No Xcode workspace found after prebuild."
  exit 1
fi

SCHEME="$(xcodebuild -list -json -workspace "$WORKSPACE" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["workspace"]["schemes"][0])')"
if [ -z "$SCHEME" ]; then
  echo "No Xcode scheme found."
  exit 1
fi

echo "Workspace: $WORKSPACE"
echo "Scheme: $SCHEME"

APP_ENTITLEMENTS=""
while IFS= read -r candidate; do
  if /usr/libexec/PlistBuddy -c 'Print :aps-environment' "$candidate" >/dev/null 2>&1; then
    APP_ENTITLEMENTS="$candidate"
    break
  fi
done < <(find . -name '*.entitlements' -type f -print)

if [ -z "$APP_ENTITLEMENTS" ]; then
  echo "No app entitlements file containing aps-environment was found."
  exit 1
fi

APNS_ENV="$(/usr/libexec/PlistBuddy -c 'Print :aps-environment' "$APP_ENTITLEMENTS" 2>/dev/null || true)"
if [ "$APNS_ENV" != "production" ]; then
  echo "Expected aps-environment=production, found: ${APNS_ENV:-missing}"
  exit 1
fi

rm -rf "$BUILD_DIR" "$PACKAGE_DIR" "$IPA_PATH"

xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration Release \
  -sdk iphoneos \
  -destination 'generic/platform=iOS' \
  -derivedDataPath "$BUILD_DIR" \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGN_IDENTITY='' \
  DEVELOPMENT_TEAM='' \
  build

APP_PATH="$(find "$BUILD_DIR/Build/Products/Release-iphoneos" -maxdepth 1 -name '*.app' -print -quit)"
if [ -z "$APP_PATH" ]; then
  echo "Unsigned .app was not produced."
  exit 1
fi

if [ -d "$APP_PATH/_CodeSignature" ] || [ -f "$APP_PATH/embedded.mobileprovision" ]; then
  echo "Main app unexpectedly contains signing artifacts."
  exit 1
fi

WIDGET_EXTENSION="$(find "$APP_PATH/PlugIns" -maxdepth 1 -name '*.appex' -print -quit 2>/dev/null || true)"
if [ -z "$WIDGET_EXTENSION" ]; then
  echo "Widget extension was not embedded in the app."
  exit 1
fi

if [ -d "$WIDGET_EXTENSION/_CodeSignature" ] || [ -f "$WIDGET_EXTENSION/embedded.mobileprovision" ]; then
  echo "Widget extension unexpectedly contains signing artifacts."
  exit 1
fi

APP_BUNDLE_ID="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$APP_PATH/Info.plist")"
WIDGET_BUNDLE_ID="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$WIDGET_EXTENSION/Info.plist")"
echo "App bundle: $APP_BUNDLE_ID"
echo "Widget bundle: $WIDGET_BUNDLE_ID"

mkdir -p "$PACKAGE_DIR/Payload"
/usr/bin/ditto "$APP_PATH" "$PACKAGE_DIR/Payload/$(basename "$APP_PATH")"
cd "$PACKAGE_DIR"
/usr/bin/ditto -c -k --keepParent Payload "$IPA_PATH"

echo "Created unsigned IPA: $IPA_PATH"
/usr/bin/unzip -l "$IPA_PATH" | tail -n 20
