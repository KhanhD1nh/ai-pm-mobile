#!/usr/bin/env bash
set -euo pipefail

INPUT_IPA="${1:-AI-PM-unsigned.ipa}"
OUTPUT_IPA="${2:-AI-PM-sideload-patched.ipa}"
CUSTOM_DYLIB="${3:-}"

if ! command -v ipapatch >/dev/null 2>&1; then
  echo "ipapatch is required. Install pinned v2.1.3 before running this script."
  exit 1
fi

if [ ! -f "$INPUT_IPA" ]; then
  echo "Input IPA not found: $INPUT_IPA"
  exit 1
fi

rm -f "$OUTPUT_IPA"

echo "Patching sideload compatibility into app and embedded extensions..."
PATCH_ARGS=(
  --input "$INPUT_IPA"
  --output "$OUTPUT_IPA"
  --noconfirm
)

if [ -n "$CUSTOM_DYLIB" ]; then
  if [ ! -f "$CUSTOM_DYLIB" ]; then
    echo "Custom sideload compatibility dylib not found: $CUSTOM_DYLIB"
    exit 1
  fi
  PATCH_ARGS+=(--dylib "$CUSTOM_DYLIB")
fi

ipapatch "${PATCH_ARGS[@]}"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

/usr/bin/unzip -q "$OUTPUT_IPA" -d "$TMP_DIR"

APP_PATH="$(find "$TMP_DIR/Payload" -maxdepth 1 -name '*.app' -print -quit)"
if [ -z "$APP_PATH" ]; then
  echo "Patched IPA does not contain an app bundle."
  exit 1
fi

WIDGET_PATH="$(find "$APP_PATH/PlugIns" -maxdepth 1 -name '*.appex' -print -quit 2>/dev/null || true)"
if [ -z "$WIDGET_PATH" ]; then
  echo "Patched IPA lost its widget extension."
  exit 1
fi

APP_EXECUTABLE="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleExecutable' "$APP_PATH/Info.plist")"
WIDGET_EXECUTABLE="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleExecutable' "$WIDGET_PATH/Info.plist")"
APP_GROUP="$(/usr/libexec/PlistBuddy -c 'Print :ExpoWidgetsAppGroupIdentifier' "$APP_PATH/Info.plist")"
WIDGET_GROUP="$(/usr/libexec/PlistBuddy -c 'Print :ExpoWidgetsAppGroupIdentifier' "$WIDGET_PATH/Info.plist")"

if [ "$APP_GROUP" != "$WIDGET_GROUP" ]; then
  echo "Patched app and widget no longer share the same ExpoWidgetsAppGroupIdentifier."
  echo "App:    $APP_GROUP"
  echo "Widget: $WIDGET_GROUP"
  exit 1
fi

ZX_DYLIB_NAME="$(basename "${CUSTOM_DYLIB:-zxPluginsInject.dylib}")"
ZX_DYLIB="$APP_PATH/Frameworks/$ZX_DYLIB_NAME"
if [ ! -f "$ZX_DYLIB" ]; then
  echo "$ZX_DYLIB_NAME is missing from patched IPA."
  exit 1
fi

verify_load_command() {
  local binary="$1"
  local label="$2"
  if ! /usr/bin/otool -L "$binary" | grep -Fq "@rpath/$ZX_DYLIB_NAME"; then
    echo "$label is missing the $ZX_DYLIB_NAME load command."
    exit 1
  fi
}

verify_load_command "$APP_PATH/$APP_EXECUTABLE" "Main app"
verify_load_command "$WIDGET_PATH/$WIDGET_EXECUTABLE" "Widget extension"

echo "Patched IPA verified:"
echo "  App Group: $APP_GROUP"
echo "  Main app: $ZX_DYLIB_NAME loaded"
echo "  Widget:   $ZX_DYLIB_NAME loaded"
/usr/bin/shasum -a 256 "$OUTPUT_IPA"
