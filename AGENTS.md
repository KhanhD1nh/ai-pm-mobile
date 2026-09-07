# AI-PM Mobile Engineering Rules

## Expo SDK

Expo HAS CHANGED. Before changing Expo or React Native behavior, read the exact versioned docs at:
https://docs.expo.dev/versions/v57.0.0/

This repository targets Expo SDK 57. Do not assume APIs from another SDK version.

## UI/UX work

For any task that changes mobile layout, navigation, typography, spacing, color, theme, Liquid Glass, loading/empty/error states, motion, gestures, haptics, accessibility, or perceived performance, read and follow:

1. `.agents/skills/ai-pm-mobile-ui-ux/SKILL.md`
2. `docs/ui-ux/UI_UX_BASELINE.md`
3. `docs/ui-ux/UI_UX_AUDIT_CHECKLIST.md` for audits and sign-off
4. `docs/ui-ux/RESEARCH_SOURCES.md` when platform guidance is version-sensitive

For broad redesigns or visual-debug passes, use `docs/ui-ux/UI_UX_AGENT_PROMPT.md` as the operating prompt.

The existing mobile UI is not a visual specification. Preserve product behavior and architecture, but redesign weak mobile composition instead of copying or polishing a desktop-first layout.

Meaningful UI redesigns require visual verification on a real device or simulator whenever available; passing TypeScript alone is not UI sign-off.

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
pnpm run verify
```

For release-impacting changes also bundle both platforms:

```bash
pnpm run verify:release
```

Do not weaken architecture checks to make invalid code pass; fix the dependency or responsibility boundary instead.
