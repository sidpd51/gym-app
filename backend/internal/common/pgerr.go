package common

import (
	"errors"

	"github.com/jackc/pgx/v5/pgconn"
)

// PgErrorCode returns the SQLSTATE code from a pgx error, or "" if the error
// is not a *pgconn.PgError.
func PgErrorCode(err error) string {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code
	}
	return ""
}

// PgConstraintName returns the constraint name that triggered a pgx error.
// Empty string if the error is not a *pgconn.PgError.
func PgConstraintName(err error) string {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.ConstraintName
	}
	return ""
}

// IsUniqueViolation returns true if the error is a Postgres unique_violation
// (23505). Services check this before mapping to a domain conflict error.
func IsUniqueViolation(err error) bool {
	return PgErrorCode(err) == "23505"
}

// IsForeignKeyViolation returns true for Postgres foreign_key_violation (23503).
func IsForeignKeyViolation(err error) bool {
	return PgErrorCode(err) == "23503"
}

// IsCheckViolation returns true for Postgres check_violation (23514).
func IsCheckViolation(err error) bool {
	return PgErrorCode(err) == "23514"
}
