# OTA updates for internal builds

AI-PM Mobile uses EAS Update through `expo-updates` for JavaScript and asset updates.

## One-time OTA-capable iOS build

OTA support is native functionality, so an OTA-capable IPA must be installed once:

### Unsigned Release IPA

Use this when the IPA will be signed/sideloaded separately:

```bash
pnpm run build:unsigned:ios
```

The `unsigned-ios` workflow compiles the app with Xcode's **Release** configuration and points it at the `internal` EAS Update channel. Do not change it back to a Debug/development-client build: Expo documents that most of the Updates API is unavailable in development builds.

The unsigned IPA also keeps the native `expo-notifications` capability and declares `aps-environment=production` for the ESign profile. Sideloading does not inherently disable push notifications. When signing/re-signing the IPA, use an **explicit App ID** and a distribution provisioning profile whose entitlements include `aps-environment=production`/Push Notifications. If the signer changes the bundle identifier or Apple team, the APNs/Expo push credentials used by the backend must match that signed app identity as well.

Home Screen widgets have stricter signing requirements than the host app. The IPA contains both the main app target and `ExpoWidgetsTarget`; each target needs its own provisioning profile, while both profiles must authorize the same App Group used by `expo-widgets`. A signer that applies only the host app profile to the nested `.appex`, rewrites only the host bundle identifier, or strips `com.apple.security.application-groups` can leave the app working while widget previews render blank/black.

GitHub CI now publishes only the unmodified `AI-PM-unsigned.ipa` for iOS. The optional sideload patch helper remains available for manual experiments, but it is not part of the normal build, artifact upload, or release flow.

For custom signing identities, build the unsigned IPA with the final identifiers instead of rewriting them after the build. In the GitHub `Build Native Apps` workflow, set `ios_bundle_identifier` and `ios_app_group_identifier` to the values authorized by the final provisioning profiles. For EAS custom builds, define `AI_PM_IOS_BUNDLE_IDENTIFIER` and `AI_PM_IOS_APP_GROUP_IDENTIFIER` in the selected EAS environment before starting the build.

For example, if the final identity is `com.example.aipm`, the profiles must cover both `com.example.aipm` and `com.example.aipm.widgets`, and both must include the same App Group such as `group.example.aipm`. If only one provisioning profile is available, or the allowed App Groups do not include the configured group, the dynamic widget cannot work; this is a native signing/provisioning issue and cannot be repaired by OTA.

### Signed internal IPA

Use this when EAS/Apple credentials are available:

```bash
pnpm run build:internal:ios
```

The `internal-ios` profile points at the `internal` EAS Update channel. iOS internal distribution still requires valid Apple signing/provisioning for the target devices.

If an older AI-PM IPA was built as a development client/Debug build, it cannot enable OTA through JavaScript. Install one new OTA-capable Release IPA; after that, compatible JavaScript/assets updates can be delivered without reinstalling the IPA.

## Publish an OTA update

For changes that do not alter the native runtime:

```bash
pnpm run update:internal -- --message "Describe the update"
```

When the installed app is opened or returns to the foreground, it checks for an update. If one is available, the user is offered **Update now** or **Later**. Choosing **Update now** downloads the update and reloads AI-PM into the new bundle.

While the update is being applied, AI-PM keeps a full-screen update surface visible. It shows `expo-updates` download progress when the server exposes enough information to calculate it, falls back to an explicit loading state otherwise, and switches to a native reload screen while the JavaScript runtime restarts. This avoids dropping the user back onto the current screen or flashing a blank/default background during the bundle swap.

## When a new IPA is still required

Build and install a new IPA when native compatibility changes, including:

- adding/removing/upgrading native Expo or React Native modules;
- upgrading Expo SDK or React Native;
- changing native permissions, entitlements, plugins, bundle identifiers, or other native app configuration;
- changing the iOS native project itself.

Before such a build, bump `expo.version` in `app.json`. The project uses `runtimeVersion.policy = appVersion`, so OTA updates are only delivered to compatible app versions.

Pure TypeScript/JavaScript, styles, translations, screens, business logic, and bundled asset changes normally can be shipped through OTA without reinstalling the IPA.
