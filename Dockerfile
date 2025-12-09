# Multi-stage Dockerfile for MaxBuild API
# Robust and Prisma-compatible (Debian base gives maximum compatibility)

# ============================================================================
# Base Stage - Common dependencies
# ============================================================================
FROM node:20-slim AS base

LABEL maintainer="MaxBuild Team"
LABEL description="MaxBuild API - AI-Powered Tender Automation System"
LABEL version="1.0.0"

WORKDIR /app

COPY package*.json ./

# ============================================================================
# Development Stage
# ============================================================================
FROM base AS development

# Install all dependencies (including devDependencies)
RUN npm ci --legacy-peer-deps

COPY . .

RUN npx prisma generate || echo "⚠️  Prisma generate skipped (will be done at runtime)"

EXPOSE 3000

ENV NODE_ENV=development

CMD ["npm", "run", "dev"]

# ============================================================================
# Build Stage - Compile TypeScript
# ============================================================================
FROM base AS build

RUN npm ci --legacy-peer-deps

COPY . .

RUN npx prisma generate

RUN npm run build

# ============================================================================
# Production Stage - Optimized for deployment
# ============================================================================
FROM base AS production

# Install system dependencies for Prisma (OpenSSL 1.1/3)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install only production dependencies
RUN npm ci --only=production --legacy-peer-deps && npm cache clean --force

# Copy only what's needed for runtime
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/prisma ./prisma

COPY package*.json ./
COPY .env.example ./.env.example

RUN mkdir -p uploads && chmod 755 uploads

# Create a non-root user for security
RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nodejs && \
    chown -R nodejs:nodejs /app

# Create npm log directory with proper permissions to prevent npm errors
RUN mkdir -p /home/nodejs/.npm/_logs && chown -R nodejs:nodejs /home/nodejs/.npm

# Use nodejs user for production (change to 'root' if debugging file permission issues)
USER nodejs

EXPOSE 3000

ENV NODE_ENV=production

# Run with verbose logging to capture detailed npm and application output
CMD ["npm", "start", "--loglevel=verbose"]