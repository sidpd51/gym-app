-- name: GetPaymentByID :one
SELECT * FROM payments WHERE id = $1;

-- name: ListPayments :many
SELECT * FROM payments
WHERE (sqlc.narg('status')::payment_status IS NULL OR status = sqlc.narg('status')::payment_status)
  AND (sqlc.narg('member_id')::uuid IS NULL OR member_id = sqlc.narg('member_id')::uuid)
  AND (sqlc.narg('from_date')::date IS NULL OR payment_date >= sqlc.narg('from_date')::date)
  AND (sqlc.narg('to_date')::date IS NULL OR payment_date <= sqlc.narg('to_date')::date)
ORDER BY payment_date DESC, created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountPayments :one
SELECT COUNT(*) FROM payments
WHERE (sqlc.narg('status')::payment_status IS NULL OR status = sqlc.narg('status')::payment_status)
  AND (sqlc.narg('member_id')::uuid IS NULL OR member_id = sqlc.narg('member_id')::uuid)
  AND (sqlc.narg('from_date')::date IS NULL OR payment_date >= sqlc.narg('from_date')::date)
  AND (sqlc.narg('to_date')::date IS NULL OR payment_date <= sqlc.narg('to_date')::date);

-- name: InsertPayment :one
INSERT INTO payments (member_id, membership_id, amount, payment_method, payment_date, status, reference, notes)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: ListPaymentsByMember :many
SELECT * FROM payments WHERE member_id = $1 ORDER BY payment_date DESC;

-- name: SumRevenueBetween :one
SELECT COALESCE(SUM(amount), 0)::numeric AS total
FROM payments
WHERE status = 'COMPLETED'
  AND payment_date >= $1
  AND payment_date <= $2;
