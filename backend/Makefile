.PHONY: dev build test tidy fmt vet

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
