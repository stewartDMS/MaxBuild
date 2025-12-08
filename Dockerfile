# Multi-stage Dockerfile for MaxBuild API
# Optimized for both development and production deployments


# Base Stage - Common dependencies
# ============================================================================
FROM node:20-alpine AS base

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

# Install only production dependencies; use legacy-peer-deps
RUN npm ci --only=production --legacy-peer-deps && npm cache clean --force

# For Prisma + Alpine, ensure OpenSSL compatibility
RUN apk add --no-cache openssl1.1-compat

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/prisma ./prisma

COPY package*.json ./
COPY .env.example ./.env.example

RUN mkdir -p uploads && chmod 755 uploads

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

ENV NODE_ENV=production


CMD ["npm", "start"]

CMD ["npm", "start"]
87d20ad2f7cb1daf08399e7c10757ccb46284c75
