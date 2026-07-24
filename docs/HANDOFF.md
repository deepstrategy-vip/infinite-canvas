# OneToken Public Edition Handoff

## Public Boundary

- Public code, documentation and releases only describe the OneToken public API.
- The browser is configured with the OneToken Base URL, a OneToken API Key and a model name.
- Service sourcing, health checks, routing and failover remain internal to OneToken and are not part of the public client.

## Implemented

- Added the `OneToken Seedance 2.0` video script template.
- Added reference video and reference audio inputs to custom video scripts.
- Added Seedance reference validation and parameter normalization before the script runs.
- Added asynchronous create-and-poll handling with idempotency keys and a 15-minute timeout.
- Changed Docker Compose to build the checked-out OneToken public source.
- Added a OneToken-only setup and troubleshooting guide.

## Public Configuration

```text
Base URL  https://api.onetoken.love/api/v3
Model     doubao-seedance-2-0-260128
Template  OneToken Seedance 2.0
```

## Verification

- `web/`: `bun test`, `bun run typecheck` and `bun run build` passed.
- `docs/`: `bun run types:check` and `bun run build` passed.
- Targeted Prettier checks and `git diff --check` passed.
- The source tree and production build outputs were searched for internal service names and direct endpoints; no matches were found.
- A local Docker image build could not run because Docker Desktop did not expose its daemon. The production Vite build used by the Dockerfile passed.

## Publication

- Public repository: `https://github.com/deepstrategy-vip/infinite-canvas`
- Public release: `v0.9.0-onetoken.3`
- The upstream AGPL-3.0 license and attribution remain intact.
