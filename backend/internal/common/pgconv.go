package common

import (
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// PgUUID wraps a Go uuid.UUID into pgtype.UUID.
func PgUUID(id uuid.UUID) pgtype.UUID {
	return pgtype.UUID{Bytes: id, Valid: true}
}

// UUIDFromPg unwraps a pgtype.UUID. Returns the zero UUID if invalid.
func UUIDFromPg(p pgtype.UUID) uuid.UUID {
	if !p.Valid {
		return uuid.Nil
	}
	return uuid.UUID(p.Bytes)
}

// PgText wraps a non-empty string into pgtype.Text; empty strings become NULL.
func PgText(s string) pgtype.Text {
	if s == "" {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: s, Valid: true}
}

// PgTextPtr wraps a *string into pgtype.Text.
func PgTextPtr(s *string) pgtype.Text {
	if s == nil {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: *s, Valid: true}
}

// TextOrEmpty returns the inner string or "" if NULL.
func TextOrEmpty(p pgtype.Text) string {
	if !p.Valid {
		return ""
	}
	return p.String
}

// TextOrNil returns a *string pointer, nil when NULL.
func TextOrNil(p pgtype.Text) *string {
	if !p.Valid {
		return nil
	}
	s := p.String
	return &s
}

// PgTimestamp wraps a time.Time.
func PgTimestamp(t time.Time) pgtype.Timestamptz {
	return pgtype.Timestamptz{Time: t, Valid: true}
}

// TimePtrFromPg returns *time.Time or nil when NULL.
func TimePtrFromPg(p pgtype.Timestamptz) *time.Time {
	if !p.Valid {
		return nil
	}
	t := p.Time
	return &t
}

// TimeFromPg returns the zero time if NULL.
func TimeFromPg(p pgtype.Timestamptz) time.Time {
	if !p.Valid {
		return time.Time{}
	}
	return p.Time
}

// PgDate wraps a time.Time into pgtype.Date (date-only, zero if t is zero).
func PgDate(t time.Time) pgtype.Date {
	if t.IsZero() {
		return pgtype.Date{Valid: false}
	}
	return pgtype.Date{Time: t, Valid: true}
}

// DateFromPg returns a time.Time (midnight UTC) or zero if NULL.
func DateFromPg(p pgtype.Date) time.Time {
	if !p.Valid {
		return time.Time{}
	}
	return p.Time
}
