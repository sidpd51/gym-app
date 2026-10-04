package user

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/sidpd51/gym-backend/internal/db/sqlc"
)

// Repository wraps the sqlc Queries so services can accept it as an
// interface for testing. Callers that need transactions use `WithTx`.
type Repository struct {
	pool *pgxpool.Pool
	q    *sqlc.Queries
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool, q: sqlc.New(pool)}
}

// Q returns the pool-bound queries for read-only operations.
func (r *Repository) Q() *sqlc.Queries { return r.q }

// Pool exposes the underlying pool for callers that need to begin
// transactions (service layer).
func (r *Repository) Pool() *pgxpool.Pool { return r.pool }

// WithTx returns a Queries bound to the given transaction.
func (r *Repository) WithTx(tx pgx.Tx) *sqlc.Queries {
	return r.q.WithTx(tx)
}

// RunInTx opens a transaction and runs fn with Queries bound to it.
// Commit/rollback is handled by pgx.BeginFunc semantics.
func (r *Repository) RunInTx(ctx context.Context, fn func(q *sqlc.Queries, tx pgx.Tx) error) error {
	return pgx.BeginFunc(ctx, r.pool, func(tx pgx.Tx) error {
		return fn(r.q.WithTx(tx), tx)
	})
}
