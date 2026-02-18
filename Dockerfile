# Multi-stage build for AI Task Manager
# Rebuild: 2026-02-19 - Password fix deployment
# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source
COPY frontend/ ./
RUN npm run build

# Stage 2: Build and run backend
FROM python:3.11-slim AS backend

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    nginx \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./backend/

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/package.json ./frontend/package.json
COPY --from=frontend-builder /app/frontend/.env.production ./frontend/.env.production
COPY --from=frontend-builder /app/frontend/next.config.js ./

# Create nginx config for serving frontend and proxying API
RUN echo 'server { \
    listen 7860; \
    server_name _; \
    \
    # Serve Next.js static files \
    location /_next/static { \
        proxy_pass http://127.0.0.1:3000; \
        proxy_cache_valid 200 60m; \
    } \
    \
    location /static { \
        proxy_pass http://127.0.0.1:3000; \
    } \
    \
    # Proxy API requests to FastAPI backend \
    location /api { \
        proxy_pass http://127.0.0.1:8000; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
    } \
    \
    # Proxy auth endpoints \
    location /auth { \
        proxy_pass http://127.0.0.1:8000; \
        proxy_set_header Host $host; \
    } \
    \
    # Serve root from Next.js \
    location / { \
        proxy_pass http://127.0.0.1:3000; \
    } \
}' > /etc/nginx/sites-available/default

# Expose the port
EXPOSE 7860

# Start nginx and backend
CMD service nginx start && \
    cd /app/backend && \
    uvicorn app.main:app --host 0.0.0.0 --port 8000
