#!/bin/sh
# Container boot: migrate first, then run the server. Migrations are
# idempotent — re-runs on restart are no-ops.
set -e

echo "entrypoint: running migrations..."
node dist/scripts/migrate.js up "$MIGRATIONS_DIR"

echo "entrypoint: starting server..."
exec node dist/server.js
