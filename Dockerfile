# Unified Dockerfile for Synq (API Server or Worker)
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S synq -u 1001

# Change ownership of the app directory
RUN chown -R synq:nodejs /app
USER synq

# Expose both ports (API: 3000, Worker: 3001)
EXPOSE 3000 3001

# Set default service type
ENV SERVICE_TYPE=api

# Health check (dynamic based on service type)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD if [ "$SERVICE_TYPE" = "worker" ]; then \
        node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"; \
      else \
        node -e "require('http').get('http://localhost:3000/api/stats', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"; \
      fi

# Dynamic startup script
CMD if [ "$SERVICE_TYPE" = "worker" ]; then \
      node src/api/worker.js; \
    else \
      node src/api/app.js; \
    fi 