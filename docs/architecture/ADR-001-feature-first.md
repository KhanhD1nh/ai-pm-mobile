# ADR-001: Modular feature-first architecture

## Status

Accepted.

## Decision

Organize product behavior by feature/domain rather than by global technical baskets. Expo Router files remain thin route adapters. Feature screens compose UI and local presentation state; data access and server mutations live in feature queries/mutations/hooks.

Cross-feature dependencies use `@/features/<feature>/public`. Infrastructure and shared layers are lower-level and may not depend back on product features.

## Why

AI-PM has many domains (issues, projects, planning, wiki, agents, notifications, administration). A global `services/`, `hooks/`, or `types/` structure becomes difficult to own and change as the app grows. Feature boundaries keep related behavior together and allow individual domains to evolve without broad rewrites.

## Consequences

- New features extend `src/features/`.
- Top-level `services`, `hooks`, `types`, `contexts`, `lib`, and `components` baskets are forbidden.
- Architecture rules are checked by `scripts/check-architecture.mjs`.
