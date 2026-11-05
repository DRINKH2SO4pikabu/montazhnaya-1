# Security Policy

Montazhnaya_1 is a beta desktop application. Do not use it with sensitive or irreplaceable media without backups.

## Reporting a vulnerability

Please do not post exploitable vulnerability details in a public issue. Use this repository's **Private vulnerability reporting** feature from the Security tab (Report a vulnerability). This channel is enabled for the public repository. Do not send credentials or private media with a report unless they are strictly necessary and safe to share.

## Supported versions

Security fixes are currently considered for the latest public beta branch. Older snapshots may not receive patches.

## Logs and samples

Application logs may include local file paths, Windows usernames, imported media names and codec details. Redact them before sharing. Never upload private footage or credentials.

## Release gates

Before a public binary release, run locked dependency installation, network-backed `npm audit` for both app and release toolchain, Electron runtime verification, SBOM/license inventory, Windows Setup/Portable testing and malware scanning of release artifacts. A registry/network failure is a blocked audit, not a clean audit.
