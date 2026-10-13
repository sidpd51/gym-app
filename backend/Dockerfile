# Gym backend: migrations (goose) + server + seed in one image.
# Entrypoint runs `goose up` then starts the server, so
# `docker compose up` is a complete boot (no manual migrate step).
FROM golang:1.26-alpine AS builder

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -o /out/server ./cmd/server \
 && CGO_ENABLED=0 go build -o /out/seed ./cmd/seed \
 && go install github.com/pressly/goose/v3/cmd/goose@v3.29.0

FROM alpine:3.21

# postgresql-client provides pg_dump/psql for the backup service;
# tzdata for Asia/Kolkata scheduling; ca-certificates for good hygiene.
RUN apk add --no-cache postgresql-client tzdata ca-certificates
ENV TZ=Asia/Kolkata

WORKDIR /app
COPY --from=builder /out/server /out/seed /app/
COPY --from=builder /go/bin/goose /usr/local/bin/goose
COPY internal/db/migrations /app/migrations
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 8080
ENTRYPOINT ["/app/entrypoint.sh"]
