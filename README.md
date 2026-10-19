# Assay

**A supply-chain malware scanner for Stellar and Soroban repositories, with on-chain "scanned clean" attestations that maintainers, contributors, and funding programs can verify.**

Assay scans every branch of a repo for known malware campaigns and wallet-draining code, explains each finding in plain language, and, when a commit is clean, anchors a signed attestation on Stellar. Anyone can check that attestation before they merge a PR, clone a repo, or fund a project.

![License: MIT](https://img.shields.io/badge/License-MIT-green) ![Network: Stellar](https://img.shields.io/badge/Network-Stellar-blue) ![Contracts: Soroban](https://img.shields.io/badge/Contracts-Soroban-purple) ![Monorepo: pnpm](https://img.shields.io/badge/Monorepo-pnpm-orange) ![Build: Turborepo](https://img.shields.io/badge/Build-Turborepo-red)

---

## What is Assay?

An *assay* is the test that proves what a piece of metal is actually made of. Assay does the same for code: it checks a repository and tells you, with evidence, whether it is what it claims to be.

### The problem

In 2026 a malware campaign publicly tracked as **PolinRider** spread through thousands of open-source repositories on GitHub. It:

- hides code in places nobody reads (fake font files, `dist/setup.js`, hundreds of blank lines before appended code in config files)
- auto-runs through `.vscode/tasks.json` with `runOn: folderOpen`, or a `preinstall` script in `package.json`
- ships look-alike Tailwind and PostCSS packages
- can rewrite git history so the malicious changes look like part of an ordinary commit
- spreads through its victims, because a compromised developer machine infects every repo it touches

Stellar developers are an especially attractive target: seed phrases, wallet extensions, keystores, and `.env` secrets often sit on the same machine as the code.

Maintainers are asked to check everything they merge, but today they have no purpose-built tool to do it. They are left to grep for strings from a blog post. Contributors and funding programs have no way to know whether a repo is safe.

| Gap today | Assay's answer |
|---|---|
| Maintainers must manually search for indicators from a write-up | A scanner with a maintained, versioned **rule pack** that runs automatically in CI |
| Malware hides in every branch and in rewritten history | Scans **all branches** and checks history for suspicious rewrites |
| Findings from generic tools are cryptic | **Plain-language explanations** and concrete remediation steps |
| No way to prove a repo was checked | **On-chain attestations** tied to a commit and a rule-pack version |
| Funding programs and contributors cannot gauge repo safety | A public **Assay badge** and API anyone can query |
| New variants appear faster than tools update | A **community-governed rule pack**, updated without a new release |

---

## Core Features

### Scanner
- Branch-wide scanning, including nested folders (`apps/`, `frontend/`, `client/`, `web/`)
- Detects known indicator files, hidden code in config files, malicious lifecycle scripts, auto-run editor tasks, suspicious dependencies, and known code markers
- Wallet-theft heuristics: code that reads `.env` files, keystores, browser wallet storage, or anything resembling a seed phrase and sends it over the network
- History checks: force-pushed or rewritten commits, commits with mismatched authorship or dates, and new binary or font files slipped into otherwise unrelated commits
- **Never executes repository code.** Assay only reads files and parses them. It does not install dependencies or run scripts.

### AI Assistant (Assay Explain)
| Feature | What it does |
|---|---|
| **Finding Explainer** | Describes each finding in plain language: what it is, why it is dangerous, and where it came from |
| **Remediation Guide** | Produces a step-by-step cleanup plan for the specific findings, including credentials to rotate |
| **Variant Triage** | Flags files that look unusual but match no rule, ranked by how suspicious they appear, for human review |
| **Rule Drafting** | Suggests candidate detection rules from a new malware write-up for maintainers to review |

AI output is always advisory. A finding is only ever raised by a deterministic rule, and a human reviews every new rule before it goes live.

### Unique Feature 1: On-chain Clean Attestation
When a scan of a commit comes back clean, Assay produces an attestation containing the repository, commit hash, tree hash, rule-pack version, and timestamp. It is signed with the scanner's Stellar key and written to the `AttestationRegistry` contract.

- Anyone can verify an attestation without trusting Assay's servers
- An attestation covers one commit and one rule-pack version, so it is never a blanket guarantee
- If the rule pack later gains rules that would have caught something, old attestations are marked **stale** and the repo is re-scanned
- Repos display a live badge: `Assay: clean at <commit>` / `stale` / `findings`

### Unique Feature 2: Community-Governed Rule Pack
Malware evolves quickly, so the rules live outside the scanner and are updated on their own schedule.

- Maintainers and security researchers propose rules through the `RulePackRegistry` contract
- A rule needs approval from a threshold of approved reviewers before it is published
- Each published rule pack is versioned and hash-anchored, so a scan result always names the exact rule pack used
- Reviewers who contribute accepted rules earn recognition on a public leaderboard

---

## Monorepo Structure

```
assay/
├── packages/
│   ├── contracts/      # @assay/contracts  - Soroban smart contracts (Rust)
│   ├── scanner/        # @assay/scanner    - Core detection engine (TypeScript)
│   ├── rules/          # @assay/rules      - Versioned rule pack (YAML + fixtures)
│   ├── action/         # @assay/action     - GitHub Action
│   ├── cli/            # @assay/cli        - Command-line scanner
│   ├── explain/        # @assay/explain    - AI explanation and triage service
│   ├── api/            # @assay/api        - Public REST API and badge service
│   └── web/            # @assay/web        - Dashboard, verifier, and rule review portal (Next.js)
├── docs/               # Threat model, rule authoring guide, attestation format, API reference
├── fixtures/           # Safe, inert samples that imitate malware indicators for testing
├── scripts/            # Testnet bootstrap, deploy helpers
├── audits/             # Smart contract audit reports
├── pnpm-workspace.yaml
├── turbo.json
└── README.md           <- you are here
```

---

## Packages

### @assay/contracts
Soroban smart contracts in Rust, deployable to Stellar Testnet and Mainnet.

| Contract | Purpose |
|---|---|
| `AttestationRegistry` | Stores signed clean-scan attestations keyed by (repo, commit, rule-pack version) and exposes verification and staleness checks |
| `RulePackRegistry` | Holds published rule-pack hashes and versions, and enforces threshold approval for changes |
| `ScannerAllowlist` | The set of scanner keys allowed to write attestations, managed by multisig |
| `ReviewerRegistry` | Approved rule reviewers and their accepted-rule counts |

```
packages/contracts/
├── src/
│   ├── attestation_registry.rs
│   ├── rule_pack_registry.rs
│   ├── scanner_allowlist.rs
│   └── reviewer_registry.rs
├── tests/
├── Cargo.toml
└── README.md
```
**Stack:** Rust, Soroban SDK, Stellar CLI

### @assay/scanner
The detection engine used by the CLI, the Action, and the API. Rules are data, so the engine stays small.

```
packages/scanner/
├── src/
│   ├── walker.ts           # Branch and file traversal (read-only)
│   ├── matchers/
│   │   ├── indicator_files.ts   # Known filenames and paths
│   │   ├── config_tail.ts       # Hidden code after exports / long blank runs
│   │   ├── lifecycle.ts         # package.json scripts, preinstall hooks
│   │   ├── editor_tasks.ts      # .vscode tasks and settings
│   │   ├── dependencies.ts      # Known-bad and look-alike packages
│   │   ├── markers.ts           # Known code and string markers
│   │   └── wallet_access.ts     # Seed phrase / keystore / .env exfiltration patterns
│   ├── history.ts          # Rewritten history and suspicious commit checks
│   ├── report.ts           # SARIF and JSON output
│   └── attest.ts           # Build and sign attestation payloads
├── package.json
└── README.md
```
**Stack:** TypeScript, isomorphic-git, tree-sitter for safe parsing, @stellar/stellar-sdk

### @assay/rules
The rule pack: one YAML file per rule, plus an inert fixture for each.

```yaml
id: AS-CFG-004
title: Appended code after config export
severity: high
category: config_tail
description: Code appears after the default export in a build config, separated by an unusually long blank run.
applies_to:
  - "**/postcss.config.*"
  - "**/tailwind.config.*"
  - "**/next.config.*"
  - "**/vite.config.*"
detect:
  blank_run_min: 40
  code_after_export: true
references:
  - docs/rules/AS-CFG-004.md
```

```
packages/rules/
├── rules/                  # One YAML per rule
├── fixtures/               # Inert examples that should and should not trigger
├── schema.json
└── CHANGELOG.md
```

### @assay/action
A GitHub Action that runs on push and pull request, scans all branches, comments findings on the PR, and optionally writes an attestation.

```yaml
name: Assay
on: [push, pull_request]
jobs:
  assay:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: assay-org/assay-action@v1
        with:
          fail-on: high
          attest: true
```

### @assay/cli
```bash
assay scan .                       # Scan the current repo, all branches
assay scan . --branch feature/x    # One branch
assay verify <repo> <commit>       # Check an on-chain attestation
assay rules update                 # Pull the latest published rule pack
assay explain <finding-id>         # Plain-language explanation
```

### @assay/explain
The AI layer. Takes structured findings from the scanner (never raw secrets) and returns explanations, remediation plans, and variant triage rankings.

```
packages/explain/
├── src/
│   ├── explainer.ts       # Finding -> plain-language explanation
│   ├── remediation.ts     # Findings -> ordered cleanup plan
│   ├── triage.ts          # Rank unmatched, unusual files
│   └── rule_drafter.ts    # Write-up -> candidate rule YAML (for human review)
├── prompts/
└── package.json
```
**Stack:** TypeScript, LLM API. Secrets found in a scan are redacted before anything is sent to a model.

### @assay/api
```
GET   /v1/repos/:owner/:name                    Current status: clean / stale / findings
GET   /v1/repos/:owner/:name/attestations       Attestation history
GET   /v1/attestations/:id                      One attestation, with on-chain proof
GET   /v1/badge/:owner/:name.svg                Live badge
GET   /v1/rulepack/latest                       Current rule-pack version and hash
GET   /v1/rulepack/:version                     A specific published rule pack
POST  /v1/scan                                  Request a scan (authenticated)
POST  /v1/explain                               Explain a finding (authenticated)
```
**Stack:** Node.js, Fastify, PostgreSQL, Redis, @stellar/stellar-sdk

### @assay/web
| Route | Description |
|---|---|
| `/` | Search a repo, see its status and badge |
| `/repo/:owner/:name` | Findings, attestation history, and cleanup plan |
| `/verify` | Paste a repo and commit to verify an attestation on-chain |
| `/rules` | Browse the rule pack and each rule's severity and references |
| `/rules/propose` | Submit a candidate rule with fixtures |
| `/review` | Reviewer queue for pending rules |
| `/docs` | Threat model and guides |

**Stack:** Next.js 14, TailwindCSS, @stellar/stellar-sdk, Freighter / LOBSTR / xBull wallet support

---

## How It Works

```
Maintainer / CI              Assay Scanner                  Stellar Ledger
     │                            │                               │
     ├─ push / PR ───────────────▶ fetch rule pack ─────────────▶ RulePackRegistry (read)
     │                            ├─ scan all branches (read-only)
     │                            ├─ check history for rewrites
     │◀─ findings + explanation ──┤
     │                            │
     │   (if clean)               ├─ sign attestation ───────────▶ AttestationRegistry.write()
     │◀─ badge: clean @ commit ───┤                               │
                                                                   │
Contributor / funder                                               │
     ├─ verify repo + commit ────────────────────────────────────▶ AttestationRegistry.verify()

Rule reviewers
     ├─ propose rule ────────────────────────────────────────────▶ RulePackRegistry.propose()
     ├─ approve (threshold) ─────────────────────────────────────▶ RulePackRegistry.publish()
     └─ old attestations flagged stale when a new rule would have caught something
```

---

## Why Stellar?

- **Cheap, fast writes.** Attesting every clean commit is only viable with near-zero fees.
- **Public, tamper-evident proof.** A badge anyone can verify on-chain is worth more than one on a README.
- **Soroban governance.** Rule approval, scanner allowlists, and staleness logic are open and auditable.
- **Built for this community.** Stellar and Soroban repos are exactly the ones targeted for wallet theft, and Wave and other programs can query attestations directly.

---

## Threat Model and Honest Limits

Assay is a defence layer, not a guarantee.

- A clean attestation means *no rule in the stated rule-pack version matched at that commit*. It does not mean the repo is provably safe.
- Novel malware that matches no rule will pass until a rule is written. Variant Triage helps, but it only flags candidates for human review.
- Assay does not replace securing your own machine. If a developer machine is compromised, rotate credentials first, then clean the repo, as the campaign write-ups advise.
- The scanner never runs repo code, so it cannot be infected by what it scans. Parsing is done with sandboxed, memory-safe parsers.
- Attestations are signed by allowlisted scanner keys. Key rotation and revocation are handled by `ScannerAllowlist`, with multisig control.

Full details are in `docs/threat-model.md`.

---

## Getting Started

### Prerequisites
- Node.js 20 or later
- pnpm 9 or later
- Rust stable and the Stellar CLI
- A funded Stellar Testnet account (`stellar keys generate --fund`)
- Optional: LLM API key for `@assay/explain`

### Install
```bash
git clone https://github.com/your-org/assay.git
cd assay
pnpm install
cp .env.example .env     # add Stellar keys (+ optional LLM key)
```

### Scan a repo with the CLI
```bash
pnpm --filter @assay/cli build
node packages/cli/dist/index.js scan ../path-to-your-repo
```

### Run in development
```bash
pnpm dev                                  # everything via Turborepo
pnpm --filter @assay/web dev              # web app only
pnpm --filter @assay/api dev              # API only
```

### Test
```bash
cd packages/contracts && cargo test
pnpm turbo test
pnpm turbo lint
```

### Deploy contracts to Testnet
```bash
cd packages/contracts
stellar contract build
bash ../../scripts/deploy_testnet.sh
```

---

## Roadmap

| Phase | Milestone |
|---|---|
| 1 | Scanner core, initial rule pack covering the PolinRider indicators, CLI |
| 2 | GitHub Action, PR comments, SARIF output |
| 3 | `AttestationRegistry` and `ScannerAllowlist` contracts on Testnet, badge service |
| 4 | `RulePackRegistry` governance, reviewer portal, staleness logic |
| 5 | Assay Explain (AI), VS Code extension, Mainnet launch, audit |

---

## Planned Issues for Contributors

Assay is built to give contributors scoped, well-defined work every sprint.

| Type | Examples |
|---|---|
| **Detection rules** | Add a rule for a new indicator, write its inert fixtures, add positive and negative tests |
| **Bug fixes** | False positives on legitimate config files, branch traversal edge cases, history parsing on large repos |
| **New features** | PR comment formatting, SARIF export, rule-pack auto-update, VS Code extension, GitLab support |
| **Smart contracts** | Contract tests, staleness logic, threshold-approval edge cases, storage and fee optimisations |
| **Testing** | Fixture coverage, fuzzing the config-tail matcher, end-to-end Action tests |
| **Documentation** | Rule authoring guide, threat model, API reference, maintainer cleanup playbook |
| **Good first issues** | Typos, README examples, badge styles, CLI help text, new fixture files |

Every issue has a description, acceptance criteria, and a pointer to the relevant files.

---

## Security

- Contract audit: pending, with reports to be published in `audits/`
- Fixtures contain **inert** text that imitates indicators. They never contain working malicious code, and contributions that do will be rejected.
- Secrets discovered during a scan are redacted from all logs, reports, and AI requests
- Responsible disclosure: `security@your-domain.example`

---

## Contributing

```bash
git checkout -b feat/your-feature
pnpm turbo test
pnpm turbo lint
# open a PR against main
```
See `CONTRIBUTING.md`, `docs/rule-authoring.md`, and `docs/architecture.md`.

---

## License

MIT, 2026 Assay Contributors

---

*Built on Stellar. Powered by Soroban. Know what your code is made of.*