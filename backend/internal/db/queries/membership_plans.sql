-- name: GetMembershipPlanByID :one
SELECT * FROM membership_plans WHERE id = $1;

-- name: ListMembershipPlans :many
SELECT * FROM membership_plans
WHERE (sqlc.narg('status')::plan_status IS NULL OR status = sqlc.narg('status')::plan_status)
ORDER BY name ASC
LIMIT $1 OFFSET $2;

-- name: CountMembershipPlans :one
SELECT COUNT(*) FROM membership_plans
WHERE (sqlc.narg('status')::plan_status IS NULL OR status = sqlc.narg('status')::plan_status);

-- name: InsertMembershipPlan :one
INSERT INTO membership_plans (name, description, duration_in_days, price, status)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: UpdateMembershipPlan :one
UPDATE membership_plans
SET name             = COALESCE(sqlc.narg('name'), name),
    description      = COALESCE(sqlc.narg('description'), description),
    duration_in_days = COALESCE(sqlc.narg('duration_in_days'), duration_in_days),
    price            = COALESCE(sqlc.narg('price'), price),
    status           = COALESCE(sqlc.narg('status')::plan_status, status)
WHERE id = $1
RETURNING *;

-- name: DeleteMembershipPlan :exec
DELETE FROM membership_plans WHERE id = $1;
