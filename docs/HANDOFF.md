# OneToken Public Edition Handoff

## Public Boundary

- Public code, documentation and releases only describe the OneToken public API.
- The browser is configured with the OneToken Base URL, a OneToken API Key and a model name.
- Service sourcing, health checks, routing and failover remain internal to OneToken and are not part of the public client.

## Implemented

- Unified new OneToken connections on the root Base URL and made every built-in template select `/v1`, `/v1beta` or `/api/v3` explicitly.
- Preserved compatibility with legacy Base URLs that already end in `/v1`, `/v1beta` or `/api/v3`.
- Removed direct service endpoints and sourcing details from customer-facing code, UI and documentation.
- Pointed every built-in documentation entry to the OneToken guide instead of the upstream project site.
- Expanded the OneToken Seedance guide with executable create/poll examples, parameters, multimodal shapes and idempotency rules.
- Added the `OneToken Seedance 2.0` video script template.
- Added reference video and reference audio inputs to custom video scripts.
- Added Seedance reference validation and parameter normalization before the script runs.
- Added asynchronous create-and-poll handling with idempotency keys and a 15-minute timeout.
- Changed Docker Compose to build the checked-out OneToken public source.
- Added a OneToken-only setup and troubleshooting guide.

## Public Configuration

```text
Base URL  https://api.onetoken.love
Model     doubao-seedance-2-0-260128
Template  OneToken Seedance 2.0
```

Generated requests use `/v1` for standard text/image/audio APIs, `/v1beta` for OneToken Gemini-native templates and `/api/v3` for Seedance asynchronous video tasks.

## Verification

- `web/`: all 6 OneToken boundary tests, `bun run typecheck` and `bun run build` passed.
- `docs/`: `bun run types:check` and `bun run build` passed.
- Targeted Prettier checks and `git diff --check` passed.
- The source tree and production build outputs were searched for internal service names and direct endpoints; no matches were found.
- Browser checks passed on desktop and a 390 x 844 mobile viewport: the root Base URL, release link, OneToken documentation link and Seedance script were correct, with no page-level horizontal overflow or console errors.
- A local Docker image build could not run because Docker Desktop did not expose its daemon. The production Vite build used by the Dockerfile passed.

## Publication

- Public repository: `https://github.com/deepstrategy-vip/infinite-canvas`
- Public release: `v0.9.0-onetoken.4`
- OneToken API boundary implementation: commit `3c7d524`, PR `#1`.
- The upstream AGPL-3.0 license and attribution remain intact.
