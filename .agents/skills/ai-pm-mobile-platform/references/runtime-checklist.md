# AI-PM Mobile runtime checklist

Use only the rows relevant to the current platform task.

## Lifecycle matrix

| Area                 | States to verify                                             |
| -------------------- | ------------------------------------------------------------ |
| App start            | cold start, warm start, already-running app                  |
| App lifecycle        | foreground, background, terminated                           |
| Network              | online, offline, reconnect, slow/failing request             |
| Auth                 | signed out, signed in, account switch, expired session       |
| Permissions          | not determined, granted, denied/restricted                   |
| Deep link            | direct valid route, auth-required route, malformed route     |
| Push                 | foreground delivery, background delivery, terminated tap     |
| OTA                  | no update, update available, download failure, restart/apply |
| Binary compatibility | current runtime, older installed binary when relevant        |

## Delivery decision

Use OTA only when the change is JavaScript/assets and compatible with the installed native runtime.

Require a new binary for changes involving, for example:

- native dependencies or versions
- config plugins with native output
- iOS entitlements/capabilities or plist changes
- Android manifest/permission/native config changes
- native code or runtime compatibility changes

When uncertain, classify the change as binary-impacting until validated against Expo SDK 57 documentation.

## Connectivity diagnosis

Check in this order:

1. Can the phone resolve the hostname?
2. Can the phone reach the host/port from Safari or another direct client?
3. Is iOS ATS or another transport policy rejecting the URL?
4. Is Metro/dev-client serving the exact URL embedded in the link/QR?
5. Is the API base URL independently reachable?
6. Is app configuration reading the intended environment value?

Avoid changing app code before identifying which layer fails.

## Completion

- Run `pnpm run verify`.
- Run `pnpm run verify:release` for release-impacting changes when applicable.
- Exercise a native build/installed binary after native dependency or native configuration changes when possible.
- Record any platform state that could not be tested.
