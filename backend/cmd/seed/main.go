// Seed inserts an initial OWNER user if the users table is empty.
// Run after migrations on a fresh install, or any time the DB is reset.
//
// Env vars:
//   DATABASE_URL   (required)
//   SEED_EMAIL     (required)
//   SEED_PASSWORD  (required, ≥ 8 chars)
//   SEED_FIRST_NAME (optional, default "Owner")
//   SEED_LAST_NAME  (optional, default "Admin")
//
// Idempotent: if any users already exist, prints a notice and exits 0.
package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"

	"github.com/sidpd51/gym-backend/internal/common"
	"github.com/sidpd51/gym-backend/internal/db/sqlc"
)

const bcryptCost = 12

func main() {
	// Load .env if present (does not override already-set env vars).
	_ = godotenv.Load()

	log := slog.New(slog.NewTextHandler(os.Stdout, nil))

	databaseURL := os.Getenv("DATABASE_URL")
	email := strings.ToLower(os.Getenv("SEED_EMAIL"))
	password := os.Getenv("SEED_PASSWORD")
	firstName := envOr("SEED_FIRST_NAME", "Owner")
	lastName := envOr("SEED_LAST_NAME", "Admin")

	if databaseURL == "" || email == "" || password == "" {
		log.Error("missing required env: DATABASE_URL, SEED_EMAIL, SEED_PASSWORD")
		os.Exit(1)
	}
	if len(password) < 8 {
		log.Error("SEED_PASSWORD must be at least 8 characters")
		os.Exit(1)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		log.Error("open pool", slog.Any("err", err))
		os.Exit(1)
	}
	defer pool.Close()

	q := sqlc.New(pool)

	// Bail out if a user with this email already exists.
	if _, err := q.GetUserByEmail(ctx, email); err == nil {
		log.Info("seed skipped: user already exists", slog.String("email", email))
		return
	} else if !errors.Is(err, pgx.ErrNoRows) {
		log.Error("probe existing user", slog.Any("err", err))
		os.Exit(1)
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcryptCost)
	if err != nil {
		log.Error("hash password", slog.Any("err", err))
		os.Exit(1)
	}

	err = pgx.BeginFunc(ctx, pool, func(tx pgx.Tx) error {
		code, err := common.NextUserCode(ctx, tx)
		if err != nil {
			return err
		}
		_, err = q.WithTx(tx).InsertUser(ctx, sqlc.InsertUserParams{
			UserCode:     code,
			FirstName:    firstName,
			LastName:     lastName,
			Email:        email,
			Phone:        nil,
			Role:         sqlc.UserRoleOWNER,
			Status:       sqlc.UserStatusACTIVE,
			PasswordHash: string(hash),
		})
		return err
	})
	if err != nil {
		log.Error("insert owner user", slog.Any("err", err))
		os.Exit(1)
	}

	fmt.Printf("seeded OWNER user: %s\n", email)
}

func envOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
