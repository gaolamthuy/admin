# syntax=docker/dockerfile:1
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN corepack enable pnpm

# Install dependencies — cache mount giữ pnpm store giữa các lần build (đỡ tải lại 1109 packages)
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application — chỉ vite build (typecheck tsc đã chạy ở máy dev trước khi push,
# trên VPS build tsc mất >10 phút không cần thiết)
RUN pnpm exec vite build

# Production stage
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]