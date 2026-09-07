# AI-PM Mobile Architecture

AI-PM Mobile uses a modular feature-first architecture with explicit dependency boundaries. This is the production architecture; new functionality should extend these modules rather than introduce new top-level baskets.

## Source layout

```text
src/
├── app/              # Expo Router only
├── features/         # Product/domain modules
├── infrastructure/   # Networking, storage, push, security, persistence
├── providers/        # Application composition and runtime orchestration
├── shared/           # Bottom-level UI, contracts, errors, generic utilities
└── config/           # Validated runtime configuration
```

## Dependency rules

- `app` composes routes/providers and delegates product behavior to features.
- `features` may depend on `shared` and `infrastructure`.
- Cross-feature imports must go through `@/features/<feature>/public`.
- `providers` may compose features and infrastructure; feature imports must use public entrypoints.
- `infrastructure` must not import features, providers, or app code.
- `shared` must not import features, infrastructure, providers, or app code.
- Feature screens are presentation/composition only: no direct API adapters, `useQuery`, or `useMutation`.
- Query keys live in the owning feature's query-key factory.

## Feature layout

Typical feature:

```text
features/issues/
├── api/          # Backend adapter for the issue domain
├── model/        # Pure domain/view mapping logic
├── queries/      # TanStack Query hooks
├── mutations/    # Server-state mutation hooks
├── hooks/        # Higher-level feature orchestration
├── components/   # Issue-specific UI
├── screens/      # Screen composition/local presentation state
├── query-keys.ts
└── public.ts     # Stable cross-feature API
```

Not every feature needs every folder. Create folders only when the responsibility exists.

## State ownership

- Backend/server state: TanStack Query.
- Auth/workspace session: AuthProvider + SecureStore infrastructure.
- Local form/filter/modal state: component state.
- Persisted query cache: infrastructure/persistence.
- Network reachability: infrastructure/networking.
- Push, realtime and app-lock bootstraps: providers/runtime orchestrating pure infrastructure services.

## Verification

Before committing changes:

```bash
pnpm run verify
```

For release-impacting changes, also bundle both platforms:

```bash
pnpm run verify:release
```

The architecture checker is intentionally executable policy, not only documentation.
