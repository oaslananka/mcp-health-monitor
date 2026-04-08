# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.x     | Yes       |

## Reporting a Vulnerability

Use GitHub Private Vulnerability Reporting for this repository.

- Do not open a public GitHub issue for suspected security vulnerabilities.
- Include a clear impact summary, affected version, reproduction steps, and any proposed mitigation.

## Current Sensitive Data Handling

- Azure DevOps PAT tokens are stored as base64 in the local SQLite database in v1.x.
- MCP server URLs, commands, and tags are stored locally in SQLite.
- Webhook delivery is not shipped in v1.0.x.

For implementation details and storage notes, see `docs/security.md`.
