# AI-PM Mobile Engineering Rules

## Expo SDK

Expo HAS CHANGED. Before changing Expo or React Native behavior, read the exact versioned docs at:
https://docs.expo.dev/versions/v57.0.0/

This repository targets Expo SDK 57. Do not assume APIs from another SDK version.

## Production architecture

Read `docs/architecture/README.md` and the ADRs before adding or moving application code.

Mandatory boundaries:

1. `src/app/` is Expo Router composition only. Route files must delegate to feature screens.
2. Product code lives in `src/features/<feature>/`.
3. Feature screens must not call API adapters, `useQuery`, or `useMutation` directly. Put server-state access in `queries/`, `mutations/`, or feature `hooks/`.
4. Cross-feature imports must use `@/features/<feature>/public`.
5. `src/infrastructure/` must not import features, providers, or app code.
6. `src/shared/` must not import features, infrastructure, providers, or app code.
7. Query keys must come from the owning feature query-key factory; never create ad-hoc key arrays in application code.
8. Server state belongs to TanStack Query. SecureStore, AsyncStorage, NetInfo, Expo Notifications, biometrics, and transport mechanics belong to infrastructure.
9. Backend authorization is the security boundary. Mobile role checks only shape UX.
10. Do not recreate top-level `services/`, `hooks/`, `types/`, `contexts/`, `lib/`, or `components/` baskets.

## Required verification

Before committing application changes run:

```bash
npm run check:architecture
npm run typecheck
npm run lint
npx expo-doctor
```

For release-impacting changes also bundle both platforms:

```bash
npx expo export --platform android --output-dir .dist-test
npx expo export --platform ios --output-dir .dist-ios-test
```

Do not weaken architecture checks to make invalid code pass; fix the dependency or responsibility boundary instead.
