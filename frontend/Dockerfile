# Gym frontend: built SPA served by nginx.
# VITE_API_BASE_URL defaults to empty -> the app calls same-origin
# relative /api/* URLs, which nginx proxies to the backend below.
# No CORS, no extra ports for the browser.
FROM node:24-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
