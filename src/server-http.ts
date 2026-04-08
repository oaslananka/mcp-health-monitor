import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

import { createMonitorServer } from './app.js';
import { log } from './logging.js';
import { startScheduler, stopScheduler } from './scheduler.js';
import { MONITOR_VERSION } from './version.js';

const DEFAULT_PORT = Number(process.env.PORT ?? 3000);
const MAX_REQUEST_BODY_BYTES = 1024 * 1024;

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

type MonitorServer = {
  connect: (transport: Transport) => Promise<void>;
  close: () => Promise<void>;
};

type HttpServerOptions = {
  rateLimiter?: InMemoryRateLimiter;
  monitorFactory?: () => MonitorServer;
};

export class InMemoryRateLimiter {
  private readonly buckets = new Map<string, { count: number; windowStartedAt: number }>();

  constructor(
    private readonly limit = 60,
    private readonly windowMs = 60_000,
    private readonly now: () => number = () => Date.now()
  ) {}

  public check(key: string): RateLimitResult {
    const currentTime = this.now();
    const bucket = this.buckets.get(key);

    if (!bucket || currentTime - bucket.windowStartedAt >= this.windowMs) {
      this.buckets.set(key, {
        count: 1,
        windowStartedAt: currentTime
      });

      return {
        allowed: true,
        remaining: this.limit - 1,
        resetAt: currentTime + this.windowMs
      };
    }

    bucket.count += 1;

    return {
      allowed: bucket.count <= this.limit,
      remaining: Math.max(0, this.limit - bucket.count),
      resetAt: bucket.windowStartedAt + this.windowMs
    };
  }
}

function jsonResponse(
  res: http.ServerResponse,
  statusCode: number,
  payload: unknown,
  headers: Record<string, string> = {}
): void {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    ...headers
  });
  res.end(JSON.stringify(payload));
}

function getRequestPath(req: http.IncomingMessage): string {
  const requestUrl = new URL(req.url ?? '/', 'http://127.0.0.1');
  return requestUrl.pathname;
}

function isSchedulerEnabled(): boolean {
  return process.env.HEALTH_MONITOR_AUTO_CHECK === '1';
}

function isMainModule(): boolean {
  const currentFile = fileURLToPath(import.meta.url);
  const entryFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
  return currentFile === entryFile;
}

async function readRequestBody(req: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let totalLength = 0;

  return new Promise((resolve, reject) => {
    req.on('data', (chunk: Buffer) => {
      totalLength += chunk.length;

      if (totalLength > MAX_REQUEST_BODY_BYTES) {
        reject(new Error('payload_too_large'));
        return;
      }

      chunks.push(chunk);
    });

    req.on('error', reject);

    req.on('end', () => {
      const body = Buffer.concat(chunks).toString('utf8');

      if (body.length === 0) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('parse_error'));
      }
    });
  });
}

async function handleMcpRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  monitorFactory: () => MonitorServer
): Promise<void> {
  let parsedBody: unknown;

  try {
    parsedBody = await readRequestBody(req);
  } catch (error) {
    if (error instanceof Error && error.message === 'payload_too_large') {
      jsonResponse(res, 413, {
        jsonrpc: '2.0',
        error: { code: -32001, message: 'Payload too large' },
        id: null
      });
      return;
    }

    jsonResponse(res, 400, {
      jsonrpc: '2.0',
      error: { code: -32700, message: 'Parse error' },
      id: null
    });
    return;
  }

  const server = monitorFactory();
  const transport = new StreamableHTTPServerTransport();

  res.on('close', () => {
    void transport.close();
    void server.close();
  });

  try {
    await server.connect(transport as unknown as Transport);
    await transport.handleRequest(req, res, parsedBody);
  } catch (error) {
    log('error', 'Failed to handle HTTP MCP request', {
      error: error instanceof Error ? error.message : String(error)
    });

    if (!res.headersSent) {
      jsonResponse(res, 500, {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal error'
        },
        id: null
      });
    }
  }
}

export function createHttpServer(options: HttpServerOptions = {}): http.Server {
  const limiter = options.rateLimiter ?? new InMemoryRateLimiter();
  const monitorFactory = options.monitorFactory ?? createMonitorServer;

  return http.createServer((req, res) => {
    const pathName = getRequestPath(req);

    if (req.method === 'GET' && pathName === '/health') {
      jsonResponse(res, 200, { status: 'ok', version: MONITOR_VERSION });
      return;
    }

    if (pathName !== '/mcp') {
      jsonResponse(res, 404, { error: 'Not Found' });
      return;
    }

    if (req.method !== 'POST') {
      jsonResponse(res, 405, { error: 'Method Not Allowed' }, { Allow: 'POST' });
      return;
    }

    const clientIp = req.socket.remoteAddress ?? 'unknown';
    const rateLimit = limiter.check(clientIp);

    if (!rateLimit.allowed) {
      jsonResponse(
        res,
        429,
        { error: 'Too Many Requests' },
        {
          'Retry-After': Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000)).toString()
        }
      );
      return;
    }

    void handleMcpRequest(req, res, monitorFactory);
  });
}

export function startHttpServer(port = DEFAULT_PORT): http.Server {
  if (isSchedulerEnabled()) {
    startScheduler();
  }

  const server = createHttpServer({ monitorFactory: createMonitorServer });

  server.listen(port, () => {
    log('info', 'HTTP MCP server listening', { port });
  });

  server.on('close', () => {
    stopScheduler();
  });

  server.on('error', (error) => {
    log('error', 'Failed to start HTTP MCP server', {
      port,
      error: error.message
    });
    process.exit(1);
  });

  return server;
}

if (isMainModule()) {
  startHttpServer();
}
