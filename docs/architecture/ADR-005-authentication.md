# ADR-005: Authentication behind session infrastructure

## Status

Accepted.

## Decision

Authentication use-cases belong to the auth feature/provider; token persistence belongs to `infrastructure/auth`. Product screens never read or write SecureStore directly. The networking client obtains credentials through session infrastructure and applies the Bearer token and current workspace header.

## Why

The current backend uses an opaque token. AI-PM may later adopt access/refresh tokens or stronger device/session policies. Keeping persistence and transport details behind interfaces lets that change happen without rewriting product screens.

## Consequences

- SecureStore access is centralized.
- AuthProvider owns session hydration and workspace selection.
- Backend remains the authorization boundary; mobile permissions only control UX visibility/availability.
