-- name: GetEquipmentCategoryByID :one
SELECT * FROM equipment_categories WHERE id = $1;

-- name: ListEquipmentCategories :many
SELECT * FROM equipment_categories ORDER BY name ASC;

-- name: InsertEquipmentCategory :one
INSERT INTO equipment_categories (name, description, status) VALUES ($1, $2, $3) RETURNING *;

-- name: UpdateEquipmentCategory :one
UPDATE equipment_categories
SET name = COALESCE(sqlc.narg('name'), name),
    description = COALESCE(sqlc.narg('description'), description),
    status = COALESCE(sqlc.narg('status')::category_status, status)
WHERE id = $1
RETURNING *;

-- name: DeleteEquipmentCategory :exec
DELETE FROM equipment_categories WHERE id = $1;

-- name: GetEquipmentByID :one
SELECT * FROM equipment WHERE id = $1;

-- name: ListEquipment :many
SELECT * FROM equipment
WHERE (sqlc.narg('status')::equipment_status IS NULL OR status = sqlc.narg('status')::equipment_status)
  AND (sqlc.narg('category_id')::uuid IS NULL OR category_id = sqlc.narg('category_id')::uuid)
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountEquipment :one
SELECT COUNT(*) FROM equipment
WHERE (sqlc.narg('status')::equipment_status IS NULL OR status = sqlc.narg('status')::equipment_status)
  AND (sqlc.narg('category_id')::uuid IS NULL OR category_id = sqlc.narg('category_id')::uuid);

-- name: InsertEquipment :one
INSERT INTO equipment (
    equipment_code, name, category_id, brand, model, serial_number,
    purchase_date, purchase_cost, location, status, notes
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING *;

-- name: UpdateEquipment :one
UPDATE equipment
SET name          = COALESCE(sqlc.narg('name'), name),
    brand         = COALESCE(sqlc.narg('brand'), brand),
    model         = COALESCE(sqlc.narg('model'), model),
    serial_number = COALESCE(sqlc.narg('serial_number'), serial_number),
    location      = COALESCE(sqlc.narg('location'), location),
    status        = COALESCE(sqlc.narg('status')::equipment_status, status),
    notes         = COALESCE(sqlc.narg('notes'), notes),
    updated_at    = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteEquipment :exec
DELETE FROM equipment WHERE id = $1;

-- name: ListEquipmentMaintenance :many
SELECT * FROM equipment_maintenance WHERE equipment_id = $1 ORDER BY maintenance_date DESC;

-- name: InsertEquipmentMaintenance :one
INSERT INTO equipment_maintenance (
    equipment_id, maintenance_date, maintenance_type, description, cost, performed_by, next_maintenance_date, notes
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;
