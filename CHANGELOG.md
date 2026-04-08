# Changelog

All notable changes to this project will be documented in this file.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [Unreleased]

## [1.0.1] - 2026-04-08

### Added

- Database migration system for safe schema upgrades
- Markdown `get_report` tool for copy-pasteable health reporting
- P50 and P95 latency reporting in uptime and dashboard responses
- Optional scheduler for background checks through `HEALTH_MONITOR_AUTO_CHECK=1`
- `/health` HTTP endpoint plus in-memory rate limiting for the HTTP server
- Integration tests, scheduler tests, migration tests, retry tests, and HTTP server tests
- `SECURITY.md` with private vulnerability reporting guidance
- `ROADMAP.md`, `.env.example`, and `renovate.json` for repo governance and maintenance
- Internal webhook delivery helper with optional HMAC-SHA256 signing
- Official `server.json` manifest for MCP Registry publication

### Changed

- Switched HTTP serving to native `node:http`
- Removed `node-fetch` in favor of the Node 20 global fetch API
- Replaced per-server N+1 query patterns with aggregated registry reads
- Split TypeScript config into build and workspace/test variants
- Migrated linting to ESLint 9 flat config
- Updated publish metadata, Docker flow, and Azure/GitHub CI definitions
- Prepublish validation now enforces coverage with `npm run test:coverage`
- README and security documentation now use explicit GitHub-facing policy links
- Webhook docs now distinguish the internal helper from the still-planned public webhook tooling
- Registry-facing `mcpName` now uses the GitHub-auth namespace form `io.github.oaslananka/mcp-health-monitor`

### Security

- Clarified that Azure DevOps PAT storage is base64 encoding, not encryption
- Moved vulnerability disclosure policy to `SECURITY.md` and removed public issue guidance

## [1.0.0] - 2026-04-07

### Added

- Initial release: `register_server`, `check_server`, `check_all`, `get_uptime`, `get_dashboard`
- Azure DevOps pipeline monitoring: `register_azure_pipelines`, `check_pipeline_status`, `get_pipeline_logs`
- SQLite-backed health history with WAL mode
- Multi-transport support: Streamable HTTP, SSE, and stdio
- Alert thresholds for response time, uptime percentage, and consecutive failures
- Unit test suite, Docker packaging, and CI definitions
