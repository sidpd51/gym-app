#!/bin/sh
# Container boot: migrate first, then run the server.
# goose is idempotent — re-runs on restart are no-ops.
set -e

echo "entrypoint: running migrations..."
goose -dir /app/migrations postgres "$DATABASE_URL" up

echo "entrypoint: starting server..."
exec /app/server
