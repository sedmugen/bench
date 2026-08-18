# 7. Cross-Platform Web and Desktop Dual Runtime

Date: 2026-08-18

## Status

Accepted

## Context

Bench is primarily designed as a native desktop command center using Tauri v2. However, requiring a full Rust build toolchain for every frontend tweak or rapid demonstration increases onboarding friction for contributors and web reviewers.

## Decision

1. Abstract runtime capabilities behind `Platform` (`core/platform.js`), detecting whether `window.__TAURI__` is available.
2. Provide a browser mock mode for window titlebar controls when running in standard web environments.
3. Implement a zero-dependency Node.js HTTP dev server (`scripts/dev-server.js` / `npm run dev:web`) serving raw ES modules directly from `src/` with path normalization and MIME header resolution.

## Consequences

- The entire Bench interface can run in any modern web browser with zero compilation step.
- Desktop releases retain full native capabilities (frameless window dragging, system minimization/maximization, OS window controls).
