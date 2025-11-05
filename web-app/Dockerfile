# Frontend Dockerfile (Multi-stage build)
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY web-app/package*.json ./web-app/

# Install dependencies
WORKDIR /app/web-app
RUN npm ci

# Copy source files
WORKDIR /app
COPY web-app/ ./web-app/

# Build the app
WORKDIR /app/web-app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /app/web-app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

