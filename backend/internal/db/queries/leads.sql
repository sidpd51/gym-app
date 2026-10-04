-- name: GetLeadByID :one
SELECT * FROM leads WHERE id = $1;

-- name: ListLeads :many
SELECT * FROM leads
WHERE (sqlc.narg('status')::lead_status IS NULL OR status = sqlc.narg('status')::lead_status)
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountLeads :one
SELECT COUNT(*) FROM leads
WHERE (sqlc.narg('status')::lead_status IS NULL OR status = sqlc.narg('status')::lead_status);

-- name: InsertLead :one
INSERT INTO leads (
    lead_code, name, phone, email, source, interested_plan_id, status, notes,
    last_follow_up_date, next_follow_up_date
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *;

-- name: UpdateLead :one
UPDATE leads
SET name                = COALESCE(sqlc.narg('name'),                name),
    phone               = COALESCE(sqlc.narg('phone'),               phone),
    email               = COALESCE(sqlc.narg('email'),               email),
    source              = COALESCE(sqlc.narg('source')::lead_source, source),
    interested_plan_id  = COALESCE(sqlc.narg('interested_plan_id'),  interested_plan_id),
    status              = COALESCE(sqlc.narg('status')::lead_status, status),
    notes               = COALESCE(sqlc.narg('notes'),               notes),
    last_follow_up_date = COALESCE(sqlc.narg('last_follow_up_date'), last_follow_up_date),
    next_follow_up_date = COALESCE(sqlc.narg('next_follow_up_date'), next_follow_up_date)
WHERE id = $1
RETURNING *;

-- name: DeleteLead :exec
DELETE FROM leads WHERE id = $1;

-- name: MarkLeadConverted :exec
UPDATE leads SET status = 'CONVERTED', converted_member_id = $2 WHERE id = $1;
