# Usage

## Register a Server

Register an HTTP MCP server:

```text
register_server name="mcp-ssh-tool" type="http" url="https://mcp-ssh-tool.onrender.com/mcp" tags=["devops","ssh"]
```

Register a stdio server:

```text
register_server name="local-debugger" type="stdio" command="npx mcp-debug-recorder" args=[] tags=["local","debug"]
```

## Run Health Checks

Check one server:

```text
check_server name="mcp-ssh-tool" timeout_ms=5000
```

Check all servers:

```text
check_all timeout_ms=5000
```

Filter by tag:

```text
check_all timeout_ms=5000 tags=["devops"]
```

## Inspect Uptime

```text
get_uptime name="mcp-ssh-tool" hours=24
```

## View the Dashboard

```text
get_dashboard hours=24 include_tool_stats=true
```

The dashboard includes:

- current status
- uptime percentage
- average response time
- consecutive failures
- current alert findings

## Configure Alerts

```text
set_alert name="mcp-ssh-tool" max_response_time_ms=500 min_uptime_percent=99 consecutive_failures_before_alert=2
```

Alert findings are surfaced by:

- `check_server`
- `check_all`
- `get_dashboard`

v1 only evaluates and reports alerts. It does not send outbound notifications.

## List or Remove Servers

```text
list_servers
list_servers tags=["ssh"]
unregister_server name="local-debugger"
```

## Monitor Statistics

```text
get_monitor_stats
```

This reports:

- total registered servers
- total health checks performed
- monitoring start time
- resolved database path

## Data Storage

Default database path:

```text
~/.mcp-health-monitor/health.db
```

Override path with:

```bash
HEALTH_MONITOR_DB=/custom/path/health.db
```
