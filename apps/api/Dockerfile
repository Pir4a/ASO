# ---- Build Stage ----
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Install dependencies
RUN npm ci --workspace api

# Copy source code
COPY apps/api ./apps/api

# Build the application
RUN npm run build --workspace api

# ---- Production Stage ----
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Install production dependencies only
RUN npm ci --workspace api --omit=dev

# Copy built application
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "apps/api/dist/main.js"]
