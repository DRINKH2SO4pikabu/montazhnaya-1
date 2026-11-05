# Security Policy

Montazhnaya_1 is a beta desktop application. Do not use it with sensitive or irreplaceable media without backups.

## Reporting a vulnerability

Please do not post exploitable vulnerability details in a public issue. Once the repository is created, maintainers should enable **Settings → Code security and analysis → Private vulnerability reporting**. Until that feature is enabled, contact the maintainer through the private contact listed on the repository profile. Do not invent or publish a personal email address in this file.

## Supported versions

Security fixes are currently considered for the latest public beta branch. Older snapshots may not receive patches.

## Logs and samples

Application logs may include local file paths, Windows usernames, imported media names and codec details. Redact them before sharing. Never upload private footage or credentials.

## Release gates

Before a public binary release, run locked dependency installation, network-backed `npm audit` for both app and release toolchain, Electron runtime verification, SBOM/license inventory, Windows Setup/Portable testing and malware scanning of release artifacts. A registry/network failure is a blocked audit, not a clean audit.
