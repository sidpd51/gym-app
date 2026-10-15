# Gym backend (Fastify): migrations + server + seed in one image.
# Entrypoint runs migrations then starts the server, so `docker compose up`
# is a complete boot (no manual migrate step).
FROM node:20-alpine AS builder
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM node:20-alpine
# postgresql-client provides pg_dump/psql for the backup service;
# tzdata for Asia/Kolkata scheduling.
RUN apk add --no-cache postgresql-client tzdata
ENV TZ=Asia/Kolkata NODE_ENV=production MIGRATIONS_DIR=/app/migrations
WORKDIR /app
COPY --from=builder /src/node_modules ./node_modules
COPY --from=builder /src/dist ./dist
COPY package.json ./
COPY migrations ./migrations
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh
EXPOSE 8080
ENTRYPOINT ["/app/entrypoint.sh"]
