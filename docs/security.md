# Security

## Disclosure Policy

Use GitHub Private Vulnerability Reporting for this repository. Do not open a public issue for
suspected security vulnerabilities. The supported disclosure policy lives in `SECURITY.md`.

## PAT Token Storage

Azure DevOps PAT tokens are stored as base64 in the local SQLite database.
Base64 is encoding, not encryption. Anyone with filesystem access to the DB can decode the token.

Mitigations:

- Use minimal-scope PATs, ideally read-only build access
- Store the DB in a protected path with OS-level file permissions
- Rotate PATs regularly
- Treat local workstation backups as sensitive if they include the monitor DB

Planned improvement:

- v2.0 will add AES-256-GCM encryption through a `HEALTH_MONITOR_ENCRYPTION_KEY` environment variable
