# ADR-004: Realtime and push are infrastructure capabilities

## Status
Accepted.

## Decision
Foreground realtime uses SSE services under infrastructure and application runtime bootstraps under `providers/runtime`. Background/killed-app delivery uses Expo Push through infrastructure push services and the backend Notification Engine.

Features do not open SSE connections or call Expo Notifications directly. Runtime bootstraps translate external events into query invalidation, badge synchronization, workspace switching, and navigation.

## Why
Realtime transport and push providers can change independently from product domains. Keeping them out of feature screens prevents transport-specific behavior from spreading through the application.

## Consequences
- Expo Push can later be replaced or supplemented with direct FCM/APNs without restructuring features.
- SSE reconnection/lifecycle changes remain infrastructure/runtime concerns.
- Notification deep-link routing is centralized.
