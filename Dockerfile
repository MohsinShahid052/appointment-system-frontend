# ── Stage 1: build ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Copy manifests first for better layer caching
COPY package.json package-lock.json ./

RUN npm ci

# Copy source and build
# REACT_APP_API_URL is injected at build time via docker-compose build args
COPY public/ ./public/
COPY src/ ./src/

ARG REACT_APP_API_URL=http://localhost:5000/api
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

# ── Stage 2: serve with nginx ──────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy the CRA production build
COPY --from=build /app/build /usr/share/nginx/html

# Custom nginx config — handles client-side routing (React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
