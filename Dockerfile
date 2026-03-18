# syntax=docker/dockerfile:1
# Multi-stage build for TanStack Start + Node.js with Vite+
# Uses Nitro preset 'node-server' for container deployment

# Stage 1: Base - Install vp CLI
FROM node:22-alpine AS base
RUN apk add --no-cache curl ca-certificates \
    && curl -fsSL https://vite.plus | bash
ENV PATH="/root/.local/share/vite-plus/bin:${PATH}"

# Stage 2: Dependencies - Install and cache dependencies
FROM base AS deps
WORKDIR /app

# Copy package files first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install all dependencies (including dev for build) using vp
RUN vp install --frozen-lockfile

# Stage 3: Builder - Build the application with Nitro node-server preset
FROM base AS builder
WORKDIR /app

# Build target must be set for Node container
ENV BUILD_TARGET=node
ENV NODE_ENV=production

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Copy source code
COPY . .

# Build the application with vp
# Output goes to .output/
RUN vp build && cp instrument.server.mjs .output/server

# Stage 4: Production - Minimal runtime image
FROM node:22-alpine AS production

# Install security updates
RUN apk add --no-cache ca-certificates curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs \
    && adduser -u 1001 -S nodejs -G nodejs

# Install vp CLI as nodejs user for production (for migrations, etc)
USER nodejs
RUN curl -fsSL https://vite.plus | bash
ENV PATH="/home/nodejs/.local/share/vite-plus/bin:${PATH}"

WORKDIR /app

# Copy built application from builder stage
# Nitro with node-server preset outputs to .output/
COPY --from=builder --chown=nodejs:nodejs /app/.output ./.output
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

# Create data directory for local SQLite (if using DATABASE_MODE=local)
RUN mkdir -p /app/data

# Expose the application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the Nitro server
# Nitro node-server preset generates .output/server/index.mjs
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV NITRO_PORT=3000
ENV NITRO_HOST=0.0.0.0

CMD ["node", ".output/server/index.mjs"]
