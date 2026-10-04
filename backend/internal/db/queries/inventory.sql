-- name: GetInventoryCategoryByID :one
SELECT * FROM inventory_categories WHERE id = $1;

-- name: ListInventoryCategories :many
SELECT * FROM inventory_categories ORDER BY name ASC;

-- name: InsertInventoryCategory :one
INSERT INTO inventory_categories (name, description, status) VALUES ($1, $2, $3) RETURNING *;

-- name: UpdateInventoryCategory :one
UPDATE inventory_categories
SET name = COALESCE(sqlc.narg('name'), name),
    description = COALESCE(sqlc.narg('description'), description),
    status = COALESCE(sqlc.narg('status')::category_status, status)
WHERE id = $1
RETURNING *;

-- name: DeleteInventoryCategory :exec
DELETE FROM inventory_categories WHERE id = $1;

-- name: GetInventoryItemByID :one
SELECT * FROM inventory_items WHERE id = $1;

-- name: GetInventoryItemByIDForUpdate :one
SELECT * FROM inventory_items WHERE id = $1 FOR UPDATE;

-- name: ListInventoryItems :many
SELECT * FROM inventory_items
WHERE (sqlc.narg('status')::inventory_status IS NULL OR status = sqlc.narg('status')::inventory_status)
  AND (sqlc.narg('category_id')::uuid IS NULL OR category_id = sqlc.narg('category_id')::uuid)
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountInventoryItems :one
SELECT COUNT(*) FROM inventory_items
WHERE (sqlc.narg('status')::inventory_status IS NULL OR status = sqlc.narg('status')::inventory_status)
  AND (sqlc.narg('category_id')::uuid IS NULL OR category_id = sqlc.narg('category_id')::uuid);

-- name: InsertInventoryItem :one
INSERT INTO inventory_items (
    item_code, name, category_id, unit, current_stock, minimum_stock, status, description
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: UpdateInventoryItemStock :exec
UPDATE inventory_items
SET current_stock = $2, status = $3, updated_at = NOW()
WHERE id = $1;

-- name: UpdateInventoryItem :one
UPDATE inventory_items
SET name          = COALESCE(sqlc.narg('name'), name),
    unit          = COALESCE(sqlc.narg('unit'), unit),
    minimum_stock = COALESCE(sqlc.narg('minimum_stock'), minimum_stock),
    description   = COALESCE(sqlc.narg('description'), description),
    updated_at    = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteInventoryItem :exec
DELETE FROM inventory_items WHERE id = $1;

-- name: ListInventoryTransactions :many
SELECT * FROM inventory_transactions WHERE item_id = $1 ORDER BY transaction_date DESC, created_at DESC;

-- name: InsertInventoryTransaction :one
INSERT INTO inventory_transactions (item_id, type, quantity, transaction_date, reference, notes)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;
