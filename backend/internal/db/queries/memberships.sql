-- name: GetMembershipByID :one
SELECT * FROM memberships WHERE id = $1;

-- name: ListMemberships :many
SELECT * FROM memberships
WHERE (sqlc.narg('status')::membership_status IS NULL OR status = sqlc.narg('status')::membership_status)
  AND (sqlc.narg('member_id')::uuid IS NULL OR member_id = sqlc.narg('member_id')::uuid)
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountMemberships :one
SELECT COUNT(*) FROM memberships
WHERE (sqlc.narg('status')::membership_status IS NULL OR status = sqlc.narg('status')::membership_status)
  AND (sqlc.narg('member_id')::uuid IS NULL OR member_id = sqlc.narg('member_id')::uuid);

-- name: InsertMembership :one
INSERT INTO memberships (member_id, plan_id, plan_name, start_date, end_date, amount, status)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: ListMembershipsByMember :many
SELECT * FROM memberships
WHERE member_id = $1
ORDER BY created_at DESC;

-- name: ExpireOverdueMemberships :execrows
UPDATE memberships
SET status = 'EXPIRED'
WHERE status = 'ACTIVE' AND end_date < CURRENT_DATE;
