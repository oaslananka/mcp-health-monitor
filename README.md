# mcp-health-monitor

> MCP server health monitoring, uptime tracking, Azure DevOps pipeline status,
> and alert evaluation through natural-language tools.

[![npm version](https://img.shields.io/npm/v/mcp-health-monitor)](https://www.npmjs.com/package/mcp-health-monitor)
[![npm downloads](https://img.shields.io/npm/dm/mcp-health-monitor)](https://www.npmjs.com/package/mcp-health-monitor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)

## What This Does

`mcp-health-monitor` keeps a registry of the MCP servers you care about, performs real MCP
handshakes against them, records health history in SQLite, and reports uptime, latency, and
alert thresholds back through MCP tools. It also tracks Azure DevOps pipelines so app health
and delivery health can be checked from the same place.

## Quick Start

Run the monitor over stdio:

```bash
npx -y mcp-health-monitor
```

Example Claude Desktop or VS Code MCP entry:

```json
{
  "name": "mcp-health-monitor",
  "version": "1.0.2",
  "mcpName": "io.github.oaslananka/mcp-health-monitor",
  "description": "Monitor MCP server health, uptime, response times, and Azure DevOps pipelines",
  "transport": "stdio",
  "command": "npx",
  "args": ["-y", "mcp-health-monitor"]
}
```

## Tools Reference

| Tool | Purpose | Typical prompt |
| ---- | ------- | -------------- |
| `register_server` | Save an MCP server to monitor | `Register https://example.com/mcp as prod-gateway` |
| `check_server` | Run a live health check for one server | `Check prod-gateway now` |
| `check_all` | Check all registered servers | `Check all my MCP servers` |
| `get_uptime` | Return uptime plus latency stats | `Show 24h uptime for prod-gateway` |
| `get_dashboard` | Return JSON dashboard data | `Give me a 24h dashboard` |
| `get_report` | Return a Markdown report | `Generate a Markdown health report for 24h` |
| `list_servers` | Show registered servers | `List all monitored servers` |
| `unregister_server` | Remove a server | `Stop monitoring local-debugger` |
| `set_alert` | Configure thresholds | `Alert if prod-gateway exceeds 500ms or drops below 99% uptime` |
| `get_monitor_stats` | Show monitor-level stats | `How many checks has the monitor recorded?` |
| `register_azure_pipelines` | Register Azure pipeline groups | `Track CI and Publish pipelines for my repo` |
| `check_pipeline_status` | Read latest Azure pipeline runs | `Check pipeline status for my release group` |
| `get_pipeline_logs` | Fetch Azure build logs | `Show the failed logs for the latest Publish build` |
| `check_all_projects` | Combine MCP and Azure health | `Check all projects` |

## Azure DevOps Integration

Register a pipeline group with an org, project, pipeline names, and a PAT:

```text
register_azure_pipelines name="mcp-health-monitor" organization="oaslananka" project="open-source" pipeline_names=["mcp-health-monitor CI","mcp-health-monitor Publish"] pat_token="..."
```

PAT tokens are stored as base64 in the local SQLite database for v1.0. This is encoding, not
encryption. See [credential storage notes](https://github.com/oaslananka/mcp-health-monitor/blob/main/docs/security.md).

## Alert Configuration

Use `set_alert` to configure one server:

| Field | Meaning |
| ----- | ------- |
| `max_response_time_ms` | Alert when a check exceeds this latency |
| `min_uptime_percent` | Alert when the selected uptime window drops below this value |
| `consecutive_failures_before_alert` | Alert after this many non-up results in a row |

Alerts are evaluated inline by `check_server`, `check_all`, and `get_dashboard`. Webhook delivery
is planned for v1.1, and no webhook MCP tool is shipped in v1.0.x.

## Data Storage

- Default database path: `~/.mcp-health-monitor/health.db`
- Override path: `HEALTH_MONITOR_DB=/custom/path/health.db`
- Optional background scheduler: `HEALTH_MONITOR_AUTO_CHECK=1`
- HTTP server health endpoint: `GET /health`
- Example configuration: [`.env.example`](https://github.com/oaslananka/mcp-health-monitor/blob/main/.env.example)

The DB uses WAL mode on file-backed databases and applies schema migrations automatically on
startup.

## Docker

Build and run:

```bash
docker build -t mcp-health-monitor .
docker run --rm -p 3000:3000 -e HEALTH_MONITOR_AUTO_CHECK=1 mcp-health-monitor
```

Then check:

```bash
curl http://localhost:3000/health
```

## Development

```bash
npm install
npm run build
npm test
npm run test:integration
npm run lint
npm run lint:test
npm run format:check
```

Use `npx --yes -p node@20.19.0 -p npm@10.8.2 npm <command>` on workstations where the default
Node runtime is newer than the project target.

## Architecture

High-level module map:

- `src/app.ts`: MCP tool registration and response formatting
- `src/checker.ts`: Live MCP connectivity probes with retry/backoff
- `src/registry.ts`: SQLite read/write paths for servers, checks, and pipeline records
- `src/db.ts` + `src/migrations.ts`: Connection setup and schema upgrades
- `src/server-http.ts` + `src/mcp.ts`: HTTP and stdio entrypoints
- `src/scheduler.ts`: Optional background auto-check loop

More detail lives in [architecture.md](https://github.com/oaslananka/mcp-health-monitor/blob/main/docs/architecture.md).

## Roadmap

Detailed milestone planning lives in [ROADMAP.md](https://github.com/oaslananka/mcp-health-monitor/blob/main/ROADMAP.md).

- [x] v1.0: Core monitoring, uptime, alerts, Azure pipelines, Markdown reports
- [ ] v1.1: Webhook notifications for Slack, Discord, and custom endpoints
- [ ] v1.2: Multi-provider pipeline and generic HTTP monitoring
- [ ] v2.0: Encrypted PAT storage and multi-user support

## Security

Read [SECURITY.md](https://github.com/oaslananka/mcp-health-monitor/blob/main/SECURITY.md) for vulnerability reporting and [docs/security.md](https://github.com/oaslananka/mcp-health-monitor/blob/main/docs/security.md) for implementation-specific storage details.

## Contributing

See [contributing.md](https://github.com/oaslananka/mcp-health-monitor/blob/main/docs/contributing.md) for setup, standards, and PR expectations.

## License

MIT
