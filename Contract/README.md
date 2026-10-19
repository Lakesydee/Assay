# Assay Contract Workspace

The Assay contract workspace contains the Soroban smart contracts that anchor repository safety data and governance on Stellar. These contracts support attestation verification, rule-pack publication, scanner authorization, and reviewer trust management.

## Contract set

| Contract | Purpose |
| --- | --- |
| `AttestationRegistry` | stores signed clean-scan attestations keyed by repo, commit, and rule-pack version |
| `RulePackRegistry` | publishes versioned rule-pack hashes and governance approvals |
| `ScannerAllowlist` | authorizes only trusted scanner keys to write attestations |
| `ReviewerRegistry` | tracks approved reviewers and accepted-rule counts |

## Why these contracts matter

Assay relies on public, tamper-evident evidence instead of a single private server saying a repo is safe. The on-chain layer makes the clean scan status verifiable by maintainers, contributors, and funding programs without trusting Assay operators alone.

## Local development

```bash
cd Contract
cargo test
cargo build --release
```

The contract workspace is intentionally designed to support reproducible deployment and auditability across Stellar testnet and mainnet environments.

## Governance and attestations

- a clean scan produces a signed attestation bound to a commit and rule-pack version
- published rules are versioned and hash-anchored
- stale attestations are detected when new rules would have caught historical issues
- scanner keys are allowlisted and rotated under explicit governance controls

## Notes

These contracts are the on-chain trust layer behind the Assay ecosystem. The backend and web layers read from them to render repo status, history, and badge state for end users.
