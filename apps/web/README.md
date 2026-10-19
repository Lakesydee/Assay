# Assay Web

Assay Web is the public dashboard for repository verification. It helps maintainers, contributors, and funding programs inspect repository safety, view findings, verify attestations, and browse the published rule pack.

## What this app does

- search for a repository and view its current status
- show findings, explanations, and remediation guidance
- verify on-chain clean attestations by repo and commit
- browse rule-pack metadata, severities, and references
- review rule submissions and governance status

## Stack

- Next.js
- React
- Tailwind CSS
- Stellar wallet integrations for verifier workflows

## Local development

From the repository root:

```bash
pnpm install
pnpm --filter @assay/web dev
```

The app runs on the default Next.js local port and is meant to work with the Assay API and the on-chain AttestationRegistry data.

## Primary routes

| Route | Purpose |
| --- | --- |
| `/` | search a repo and view badge status |
| `/repo/:owner/:name` | scan results, findings, and cleanup guidance |
| `/verify` | verify an attestation against a repo and commit |
| `/rules` | browse published rules and severity metadata |
| `/review` | inspect pending rule submissions |
| `/docs` | trust model and operational guidance |

## Notes

This app is intentionally read-only for verification, with all trust anchored in the published rule pack and on-chain attestations rather than a single backend-only status screen.
