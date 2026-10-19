# Assay Backend

The Assay backend is the runtime for repository scanning, result persistence, and public verification. It keeps the scanner, API, and attestation data aligned with a single rule-pack version so maintainers and contributors can trust the repo status they are viewing.

## What this service does

- fetches and stores the active rule pack
- orchestrates repository scans across branches and commit history
- normalizes findings into structured results and explanations
- exposes status endpoints for clean, stale, and findings states
- tracks verification metadata and attestation history
- serves the public badge and repository health API

## Core responsibilities

- API layer for repo lookups, attestation queries, and badge generation
- scanner worker and orchestration logic for branch-wide checks
- PostgreSQL-backed persistence for scan history and metadata
- idempotent processing for duplicate events and retries
- read-only repository analysis that never executes project code

## Local development

```bash
cd Backend
pnpm install
pnpm dev
```

The service is designed to run alongside the Assay web app and scanner tooling. It should be configured with repository and network settings that match the active Stellar environment.

## Environment and runtime notes

- use a PostgreSQL connection for persisted scan metadata and API queries
- configure the Stellar RPC and contract addresses for attestation verification
- keep the scanner rule-pack version pinned to the exact published version used during a scan
- store secrets in environment variables, never in the repo or browser-facing config

## Verification

This backend is part of the Assay monorepo and is considered aligned with the project README when its API output matches the repository status model: clean, stale, and findings.
