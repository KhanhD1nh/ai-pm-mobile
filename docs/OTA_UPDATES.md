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

## When a new IPA is still required

Build and install a new IPA when native compatibility changes, including:

- adding/removing/upgrading native Expo or React Native modules;
- upgrading Expo SDK or React Native;
- changing native permissions, entitlements, plugins, bundle identifiers, or other native app configuration;
- changing the iOS native project itself.

Before such a build, bump `expo.version` in `app.json`. The project uses `runtimeVersion.policy = appVersion`, so OTA updates are only delivered to compatible app versions.

Pure TypeScript/JavaScript, styles, translations, screens, business logic, and bundled asset changes normally can be shipped through OTA without reinstalling the IPA.
