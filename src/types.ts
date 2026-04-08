import { z } from 'zod/v3';

export const McpServerTypeSchema = z.enum(['http', 'stdio', 'sse']);
export const HealthStatusSchema = z.enum(['up', 'down', 'timeout', 'error']);
export const ListableStatusSchema = z.enum(['up', 'down', 'unknown']);
export const AlertFindingTypeSchema = z.enum([
  'down',
  'response_time',
  'uptime',
  'consecutive_failures'
]);

export const RegisterServerSchema = z.object({
  name: z.string().min(1).max(100).describe('Unique name for this MCP server'),
  type: McpServerTypeSchema.describe(
    'Transport type: http (Streamable HTTP), sse (legacy SSE), stdio'
  ),
  url: z
    .string()
    .url()
    .optional()
    .describe('URL for http/sse servers (e.g. https://mcp-ssh-tool.onrender.com/mcp)'),
  command: z
    .string()
    .optional()
    .describe('Command for stdio servers (e.g. npx mcp-debug-recorder)'),
  args: z.array(z.string()).default([]).describe('Args for stdio command'),
  tags: z.array(z.string()).default([]).describe('Tags for grouping'),
  alert_on_down: z.boolean().default(true).describe('Alert when server goes down'),
  check_interval_minutes: z.number().int().min(1).max(60).default(5)
});

export const CheckServerSchema = z.object({
  name: z.string().describe('Server name to check'),
  timeout_ms: z.number().int().min(1000).max(30000).default(5000)
});

export const CheckAllSchema = z.object({
  timeout_ms: z.number().int().min(1000).max(30000).default(5000),
  tags: z.array(z.string()).optional().describe('Filter by tags')
});

export const GetUptimeSchema = z.object({
  name: z.string().describe('Server name'),
  hours: z.number().int().min(1).max(720).default(24)
});

export const SetAlertSchema = z.object({
  name: z.string().describe('Server name'),
  max_response_time_ms: z.number().int().optional().describe('Alert if response time exceeds this'),
  min_uptime_percent: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .describe('Alert if uptime drops below this'),
  consecutive_failures_before_alert: z.number().int().min(1).max(10).default(3)
});

export const GetDashboardSchema = z.object({
  hours: z.number().int().min(1).max(168).default(24),
  include_tool_stats: z.boolean().default(true)
});

export const GetReportSchema = z.object({
  hours: z.number().int().min(1).max(168).default(24)
});

export const UnregisterSchema = z.object({
  name: z.string()
});

export const ListServersSchema = z.object({
  tags: z.array(z.string()).optional(),
  status: ListableStatusSchema.optional()
});

export const EmptySchema = z.object({});

export const RegisterAzurePipelineSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .describe('Friendly name for this pipeline group (e.g. "mcp-ssh-tool")'),
  organization: z.string().min(1),
  project: z.string().min(1),
  pipeline_names: z
    .array(z.string().min(1))
    .min(1)
    .describe('Azure pipeline names to monitor (e.g. ["mcp-ssh-tool CI", "mcp-ssh-tool Publish"])'),
  pat_token: z
    .string()
    .min(1)
    .describe('Azure DevOps PAT - stored as base64 encoding in the local DB')
});

export const CheckPipelineStatusSchema = z.object({
  group_name: z
    .string()
    .optional()
    .describe('Filter by group name (e.g. "mcp-ssh-tool"). Omit for all groups.')
});

export const RegisteredPipelineLogsSchema = z.object({
  group_name: z.string().describe('Pipeline group name'),
  pipeline_name: z.string().describe('Specific pipeline name (e.g. "mcp-ssh-tool CI")'),
  build_id: z
    .number()
    .int()
    .optional()
    .describe('Specific build ID. If omitted, fetches the latest build.'),
  failed_only: z.boolean().default(true).describe('Only return logs from failed steps')
});

export const CheckAllProjectsSchema = z.object({
  timeout_ms: z.number().int().min(1000).max(30000).default(5000)
});

export type McpServerType = z.infer<typeof McpServerTypeSchema>;
export type HealthStatus = z.infer<typeof HealthStatusSchema>;
export type RegisterServerInput = z.infer<typeof RegisterServerSchema>;
export type CheckServerInput = z.infer<typeof CheckServerSchema>;
export type CheckAllInput = z.infer<typeof CheckAllSchema>;
export type GetUptimeInput = z.infer<typeof GetUptimeSchema>;
export type SetAlertInput = z.infer<typeof SetAlertSchema>;
export type GetDashboardInput = z.infer<typeof GetDashboardSchema>;
export type GetReportInput = z.infer<typeof GetReportSchema>;
export type UnregisterInput = z.infer<typeof UnregisterSchema>;
export type ListServersInput = z.infer<typeof ListServersSchema>;
export type AlertFindingType = z.infer<typeof AlertFindingTypeSchema>;
export type RegisterAzurePipelineInput = z.infer<typeof RegisterAzurePipelineSchema>;
export type CheckPipelineStatusInput = z.infer<typeof CheckPipelineStatusSchema>;
export type RegisteredPipelineLogsInput = z.infer<typeof RegisteredPipelineLogsSchema>;
export type CheckAllProjectsInput = z.infer<typeof CheckAllProjectsSchema>;

export interface HealthRecord {
  id: number;
  server_name: string;
  timestamp: number;
  status: HealthStatus;
  response_time_ms: number | null;
  tool_count: number | null;
  error_message: string | null;
  tools_snapshot: string | null;
}

export interface RegisteredServer {
  name: string;
  type: McpServerType;
  url: string | null;
  command: string | null;
  args: string[];
  tags: string[];
  alert_on_down: boolean;
  check_interval_minutes: number;
  created_at: number;
  last_checked: number | null;
  last_status: HealthStatus | 'unknown';
  last_response_time_ms: number | null;
  consecutive_failures: number;
}

export interface ServerStatus {
  name: string;
  type: McpServerType;
  url?: string;
  command?: string;
  status: 'up' | 'down' | 'unknown';
  last_checked: number | null;
  last_response_time_ms: number | null;
  tool_count: number | null;
  uptime_24h_percent: number | null;
  consecutive_failures: number;
  tags: string[];
}

export interface DashboardReportEntry {
  name: string;
  current_status: RegisteredServer['last_status'];
  uptime_percent: number | null;
  avg_response_time_ms: number | null;
  p50_response_time_ms: number | null;
  p95_response_time_ms: number | null;
  total_checks: number;
  consecutive_failures: number;
  tool_count: number | null;
}

export interface AlertConfigRecord {
  server_name: string;
  max_response_time_ms: number | null;
  min_uptime_percent: number | null;
  consecutive_failures_before_alert: number;
}

export interface AlertFinding {
  type: AlertFindingType;
  message: string;
  actual: number | string;
  threshold: number | string;
}

export interface AlertEvaluation {
  has_alerts: boolean;
  findings: AlertFinding[];
}

export interface CheckResult {
  status: HealthStatus;
  response_time_ms: number | null;
  tool_count: number | null;
  error_message: string | null;
  tools: string[] | null;
}

export interface PipelineStatus {
  name: string;
  id: number;
  status: 'succeeded' | 'failed' | 'inProgress' | 'notStarted' | 'canceled' | 'unknown';
  result: string | null;
  build_number: string;
  source_branch: string;
  start_time: string | null;
  finish_time: string | null;
  requested_by: string;
  url: string;
}

export interface RegisteredAzurePipeline {
  id: number;
  group_name: string;
  organization: string;
  project: string;
  pipeline_name: string;
  pipeline_id: number | null;
  pat_token_encrypted: string;
  created_at: number;
}

export interface RecordedPipelineRun {
  id: number;
  group_name: string;
  pipeline_name: string;
  build_id: number;
  status: PipelineStatus['status'];
  result: string | null;
  build_number: string | null;
  start_time: string | null;
  finish_time: string | null;
  recorded_at: number;
}
