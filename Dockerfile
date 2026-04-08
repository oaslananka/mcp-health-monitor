FROM node:20-bookworm-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY tsconfig.build.json tsconfig.json jest.config.cjs ./
COPY src ./src
COPY mcp.json README.md LICENSE CHANGELOG.md ./

RUN npm ci
RUN npm run build

FROM node:20-bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
RUN npm prune --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/mcp.json ./mcp.json
COPY --from=builder /app/README.md ./README.md
COPY --from=builder /app/LICENSE ./LICENSE
COPY --from=builder /app/CHANGELOG.md ./CHANGELOG.md

RUN mkdir -p /data

ENV HEALTH_MONITOR_DB=/data/health.db
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('node:http').get('http://127.0.0.1:3000/health', res => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

EXPOSE 3000

CMD ["node", "dist/server-http.js"]
