---
name: ai-pm-mobile-platform
description: Project-specific Expo/native runtime workflow for AI-PM Mobile. Use for tasks involving Expo SDK 57, iOS or Android native behavior, dev-client/Metro connectivity, EAS or internal builds, OTA updates, push notifications, deep links, app lifecycle/background handling, SecureStore/auth sessions, permissions, offline/network behavior, ATS/TLS, Tailscale, native configuration, or release-impacting platform changes.
---

# AI-PM Mobile Platform

Treat Expo/native runtime work as a compatibility and lifecycle problem, not only a TypeScript problem. Preserve the project's architecture boundaries while validating behavior on the actual platform state that matters.

## Operating workflow

1. Read `AGENTS.md`, `package.json`, the relevant app/EAS configuration, `docs/architecture/README.md` when infrastructure boundaries are involved, and the target infrastructure/provider code.
2. Confirm the exact Expo SDK 57 documentation for every version-sensitive native API before changing behavior.
3. Classify the change before implementation:
   - JavaScript/assets only and compatible with the installed runtime
   - native dependency or native configuration change
   - credential/provisioning/signing change
   - development connectivity issue
   - release/distribution change
4. Write the lifecycle matrix that matters for the task: iOS/Android, foreground/background/terminated, cold/warm start, online/offline, old/new binary, and permission state as applicable.
5. Implement through existing infrastructure/provider boundaries. Do not move SecureStore, notifications, NetInfo, updates, or transport mechanics into feature screens.
6. Test the real lifecycle transition that originally failed; a successful API call or static render is not sufficient for native behavior.
7. Run `pnpm run verify`. Run `pnpm run verify:release` for release-impacting changes. For native dependency/config changes, also validate with a native build or installed development/internal binary when the environment permits.

## Expo and native compatibility

- Target Expo SDK 57 and the versions pinned in `package.json`. Do not copy APIs from another SDK version.
- Distinguish Expo Go, development builds, internal/release builds, and web. Native modules or configuration may behave differently across these environments.
- Guard web-only/native-only APIs explicitly when the app supports web. SecureStore, notifications, local authentication, and other native modules must not be assumed available on web.
- Treat app configuration changes, native entitlements/capabilities, plugins, and native dependency changes as binary-impacting until proven otherwise.

## OTA and internal distribution

- Use OTA only for JavaScript/assets that are compatible with the installed native runtime. Native dependency, plugin, entitlement, Info.plist/AndroidManifest, or other native runtime changes require a new binary.
- Keep EAS channel/runtime strategy consistent with the installed internal build. Do not publish an update to a channel/runtime that the target binary cannot receive.
- Verify update behavior across cold start, foreground check/apply flow, failed download, and rollback/fallback behavior when the task touches updates.
- Prefer explicit user-facing update state for internal builds when an update is being downloaded or requires restart; do not leave the app in an ambiguous partially-updated state.
- Read `references/runtime-checklist.md` for release and OTA checks.

## Push notifications

- Test push on a physical device when platform delivery is part of the task.
- Separate permission state, Expo push token acquisition, backend device registration, server delivery, receipt/result handling, local badge state, and notification tap routing. A failure in one stage should not be misdiagnosed as another.
- Re-register or refresh device state safely when auth account, workspace context, installation token, or notification permission changes.
- Verify foreground, background, and terminated notification taps when deep linking is involved.
- Keep push token/device registration in infrastructure, not feature screens.

## Deep links and pending destinations

- Verify both cold-start and already-running app behavior.
- Preserve an intended destination across authentication when a deep link arrives before a valid session is ready.
- Resolve external URLs in one navigation boundary and route to product screens through Expo Router instead of duplicating parsing logic across features.
- Test malformed and unauthorized destinations as well as valid links.

## Auth, session, and secure storage

- Store secrets/tokens only in the secure session abstraction on native platforms; do not move credentials into AsyncStorage for convenience.
- On logout/account switch, clear account-scoped query cache and persisted account data before reusing the UI for another identity.
- Treat backend authorization as the security boundary. Client state and hidden routes are UX controls only.
- Handle native/web storage capability differences explicitly.

## Network, ATS, Metro, and dev-client connectivity

- Diagnose connectivity in layers: device DNS/hostname resolution, route reachability, HTTP versus HTTPS policy, Metro/dev-client URL, API reachability, and app transport configuration.
- On iOS, distinguish ATS rejection from DNS failure and from an unreachable server. Changing one layer does not fix the others.
- For LAN/Tailscale development, verify the exact hostname/IP from the phone itself before changing app code.
- Do not hardcode a temporary host into production configuration; use the project's environment/config abstraction.

## Offline and app lifecycle

- Distinguish cached offline reads from an actual offline mutation queue. Do not claim writes are offline-capable unless mutations are persisted and reconciled.
- Preserve useful stale data during transient disconnects when safe, then refetch after connectivity returns.
- Make background/foreground listeners idempotent and clean them up correctly. Avoid duplicate push/update/session listeners after Fast Refresh or navigation remounts.

## Date and time contracts

- Treat date-only fields such as `due_date` as calendar dates, not timestamps. Compare normalized `YYYY-MM-DD` keys in the intended local/calendar semantics rather than comparing midnight timestamps against `Date.now()`.
- Treat scheduled start/end and activity timestamps as instants with timezone-aware conversion.
- Do not silently convert a date-only backend contract into a local timestamp contract in the mobile layer.

## Release gate

Before declaring platform work complete:

- `pnpm run verify` passes.
- `pnpm run verify:release` passes for release-impacting JavaScript/assets/config changes when applicable.
- Native dependency/config changes are exercised in a native build or installed binary when build access is available.
- The relevant lifecycle matrix has been tested, not only the happy-path screen.
- Any environment limitation that prevented native validation is stated explicitly.

## References

- Read `references/runtime-checklist.md` for a compact native lifecycle and release checklist.
- Read the exact versioned Expo SDK 57 documentation for the package being changed.
