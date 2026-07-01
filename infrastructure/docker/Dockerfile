# ── TeacherAI Production Dockerfile ──────────────────────────────────────
# Multi-stage build: deps → builder → runner
# Node 20 Alpine for minimal image size

# ── Stage 1: Base ─────────────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN apk add --no-cache \
  libc6-compat \
  openssl \
  openssl-dev \
  ca-certificates \
  dumb-init
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# ── Stage 2: Dependencies ─────────────────────────────────────────────────
FROM base AS deps
COPY package*.json turbo.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/database/package*.json ./packages/database/
COPY packages/types/package*.json ./packages/types/
# Install all deps (including devDeps needed for build)
RUN npm ci --include=dev

# ── Stage 3: Builder ──────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN cd packages/database && npx prisma generate

# Build Next.js with standalone output for Docker
ENV BUILD_STANDALONE=true
RUN cd apps/web && npm run build

# ── Stage 4: Runner ───────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Install only runtime dependencies
RUN apk add --no-cache libc6-compat openssl ca-certificates dumb-init

# Copy standalone Next.js build
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./public

# Copy Prisma schema for migrations
COPY --from=builder /app/packages/database/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000 \
    HOSTNAME="0.0.0.0" \
    NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
