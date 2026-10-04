-- name: GetExpenseCategoryByID :one
SELECT * FROM expense_categories WHERE id = $1;

-- name: ListExpenseCategories :many
SELECT * FROM expense_categories ORDER BY name ASC;

-- name: InsertExpenseCategory :one
INSERT INTO expense_categories (name, description, status) VALUES ($1, $2, $3) RETURNING *;

-- name: UpdateExpenseCategory :one
UPDATE expense_categories
SET name        = COALESCE(sqlc.narg('name'), name),
    description = COALESCE(sqlc.narg('description'), description),
    status      = COALESCE(sqlc.narg('status')::category_status, status)
WHERE id = $1
RETURNING *;

-- name: DeleteExpenseCategory :exec
DELETE FROM expense_categories WHERE id = $1;

-- name: GetExpenseByID :one
SELECT * FROM expenses WHERE id = $1;

-- name: ListExpenses :many
SELECT * FROM expenses
WHERE (sqlc.narg('category_id')::uuid IS NULL OR category_id = sqlc.narg('category_id')::uuid)
  AND (sqlc.narg('from_date')::date IS NULL OR expense_date >= sqlc.narg('from_date')::date)
  AND (sqlc.narg('to_date')::date IS NULL OR expense_date <= sqlc.narg('to_date')::date)
ORDER BY expense_date DESC, created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountExpenses :one
SELECT COUNT(*) FROM expenses
WHERE (sqlc.narg('category_id')::uuid IS NULL OR category_id = sqlc.narg('category_id')::uuid)
  AND (sqlc.narg('from_date')::date IS NULL OR expense_date >= sqlc.narg('from_date')::date)
  AND (sqlc.narg('to_date')::date IS NULL OR expense_date <= sqlc.narg('to_date')::date);

-- name: InsertExpense :one
INSERT INTO expenses (
    expense_code, category_id, description, amount, expense_date, payment_method, vendor, notes
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: UpdateExpense :one
UPDATE expenses
SET category_id    = COALESCE(sqlc.narg('category_id'), category_id),
    description    = COALESCE(sqlc.narg('description'), description),
    amount         = COALESCE(sqlc.narg('amount'), amount),
    expense_date   = COALESCE(sqlc.narg('expense_date'), expense_date),
    payment_method = COALESCE(sqlc.narg('payment_method')::expense_payment_method, payment_method),
    vendor         = COALESCE(sqlc.narg('vendor'), vendor),
    notes          = COALESCE(sqlc.narg('notes'), notes)
WHERE id = $1
RETURNING *;

-- name: DeleteExpense :exec
DELETE FROM expenses WHERE id = $1;

-- name: SumExpensesBetween :one
SELECT COALESCE(SUM(amount), 0)::numeric AS total
FROM expenses
WHERE expense_date >= $1 AND expense_date <= $2;
