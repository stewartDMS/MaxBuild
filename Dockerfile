# Multi-stage Dockerfile for MaxBuild API
# Optimized for both development and production deployments

# ============================================================================
# Base Stage - Common dependencies
# ============================================================================
FROM node:20-alpine AS base

# Add labels for better container management
LABEL maintainer="MaxBuild Team"
LABEL description="MaxBuild API - AI-Powered Tender Automation System"
LABEL version="1.0.0"

# Install basic utilities and bash for debugging
RUN apk add --no-cache \
    bash \
    curl \
    tini

# Use tini to handle signals properly
ENTRYPOINT ["/sbin/tini", "--"]

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# ============================================================================
# Development Stage
# ============================================================================
FROM base AS development

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate || echo "⚠️  Prisma generate skipped (will be done at runtime)"

# Expose port
EXPOSE 3000

# Set NODE_ENV
ENV NODE_ENV=development

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start development server with hot-reload
CMD ["npm", "run", "dev"]

# ============================================================================
# Build Stage - Compile TypeScript
# ============================================================================
FROM base AS build

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code and configuration
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript to JavaScript
RUN npm run build

# ============================================================================
# Production Stage - Optimized for deployment
# ============================================================================
FROM base AS production

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/prisma ./prisma

# Copy necessary runtime files
COPY package*.json ./
COPY .env.example ./.env.example

# Create uploads directory
RUN mkdir -p uploads && chmod 755 uploads

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Set NODE_ENV
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start production server
CMD ["npm", "start"]
