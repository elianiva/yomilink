# syntax=docker/dockerfile:1
# Multi-stage build for TanStack Start + Bun
# Uses Nitro preset 'bun' for container deployment

# Stage 1: Dependencies - Install and cache dependencies
FROM oven/bun:1.2-alpine AS deps
WORKDIR /app

# Copy package files first for better layer caching
COPY package.json bun.lock ./

# Install all dependencies (including dev for build)
RUN bun install --frozen-lockfile

# Stage 2: Builder - Build the application with Nitro bun preset
FROM oven/bun:1.2-alpine AS builder
WORKDIR /app

# Build target must be set for Bun container
ENV BUILD_TARGET=bun
ENV NODE_ENV=production

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/bun.lock ./bun.lock

# Copy source code
COPY . .

# Build the application with Nitro bun preset
# Output goes to .output/
RUN bun run build

# Stage 3: Production - Minimal runtime image
FROM oven/bun:1.2-alpine AS production

# Install security updates and create non-root user
RUN apk add --no-cache ca-certificates \
    && addgroup -g 1001 -S bun \
    && adduser -u 1001 -S bun -G bun

WORKDIR /app

# Copy built application from builder stage
# Nitro with bun preset outputs to .output/
COPY --from=builder --chown=bun:bun /app/.output ./.output
COPY --from=builder --chown=bun:bun /app/package.json ./package.json

# Create data directory for local SQLite (if using DATABASE_MODE=local)
RUN mkdir -p /app/data && chown -R bun:bun /app/data

# Switch to non-root user
USER bun

# Expose the application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD bun -e "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the Nitro server
# Nitro bun preset generates .output/server/index.mjs
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV NITRO_PORT=3000
ENV NITRO_HOST=0.0.0.0

CMD ["bun", "run", ".output/server/index.mjs"]
