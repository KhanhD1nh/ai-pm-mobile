# ADR-002: TanStack Query owns server state

## Status

Accepted.

## Decision

All backend-owned state is accessed through TanStack Query hooks in feature `queries/` and `mutations/`. Screens do not instantiate queries/mutations directly and do not call API adapters.

Each feature owns a query-key factory. Mutation invalidation must target these factories instead of ad-hoc array keys.

## Why

This centralizes caching, retry, invalidation, optimistic updates, concurrency handling, and offline persistence. It also prevents screens from accumulating transport and cache-coordination logic.

## Consequences

- Feature API adapters remain transport-facing and UI-agnostic.
- Query/mutation hooks become the stable application-facing server-state boundary.
- Local UI state remains local component state.
