# Assay Mobile

Assay Mobile is the mobile companion for repository safety checks and wallet-security awareness. It gives users a lightweight way to monitor scan status, review repo health, and stay informed when a project is clean, stale, or requires attention.

## What this app is for

- viewing the latest repository status and scanning badge
- checking whether a repo is clean, stale, or has findings
- surfacing wallet-related and security-sensitive alerts
- supporting a secure, developer-friendly workflow alongside the web dashboard

## Stack

- Expo
- React Native
- Expo Router
- Secure storage for local session and preference handling

## Local development

```bash
cd apps/mobile
pnpm install
pnpm dev
```

This app is designed to work as a companion to the Assay web and backend services, not as a standalone scanner. The mobile experience is focused on status visibility, alerts, and secure onboarding flows.

## Security notes

- never store secrets in app configuration or source code
- use secure storage for any local, user-scoped data
- always treat network and wallet details as security-sensitive material

## Build notes

The project uses Expo configuration and EAS profiles for app builds. Use standard Expo commands for local development, preview builds, and production packaging when deployment is required.
