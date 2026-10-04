.PHONY: dev build test tidy fmt vet migrate-up migrate-down migrate-status sqlc db-up db-down db-logs

# -------- app --------
dev:
	go run ./cmd/server

build:
	go build -o bin/gym-backend ./cmd/server

test:
	go test ./...

tidy:
	go mod tidy

fmt:
	go fmt ./...

vet:
	go vet ./...

# -------- db (docker-compose) --------
db-up:
	docker compose up -d

db-down:
	docker compose down

db-logs:
	docker compose logs -f postgres

# -------- migrations (goose) --------
# Loads DATABASE_URL from .env if present.
MIGRATIONS_DIR := internal/db/migrations
ifneq (,$(wildcard .env))
include .env
export
endif

migrate-up:
	goose -dir $(MIGRATIONS_DIR) postgres "$(DATABASE_URL)" up

migrate-down:
	goose -dir $(MIGRATIONS_DIR) postgres "$(DATABASE_URL)" down

migrate-status:
	goose -dir $(MIGRATIONS_DIR) postgres "$(DATABASE_URL)" status

# -------- sqlc --------
sqlc:
	sqlc generate
