# syntax=docker/dockerfile:1

# ---- Build stage: compile the SPA with Bun ----
FROM oven/bun:1-alpine AS build
WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Build the static site. VITE_* vars are baked in at build time.
COPY . .
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN bun run build

# ---- Runtime stage: serve static files + proxy /api with nginx ----
FROM nginx:stable-alpine AS runtime

# nginx renders this template at startup, substituting ${API_TARGET}.
COPY docker/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

# Backend that /api/* is reverse-proxied to (override at runtime).
ENV API_TARGET=http://backend:8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/ >/dev/null 2>&1 || exit 1

# nginx:alpine's entrypoint runs envsubst on templates, then launches nginx.
