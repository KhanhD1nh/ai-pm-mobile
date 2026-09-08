# ADR-003: Offline-first cache boundary

## Status

Accepted for the current cache layer; queued write synchronization is incremental.

## Decision

Persist TanStack Query cache through `infrastructure/persistence` and expose network state through `infrastructure/networking`. Features must not access AsyncStorage or NetInfo directly.

Future queued offline mutations and conflict resolution will be added under `infrastructure/offline` without changing feature screen boundaries. Issue `version` remains the server concurrency authority for conflict detection.

## Why

Mobile connectivity is intermittent. Keeping persistence/network mechanics below features allows the app to evolve from cached reads to full offline mutation synchronization without restructuring UI modules.
