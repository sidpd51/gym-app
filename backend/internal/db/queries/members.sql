-- name: GetMemberByID :one
SELECT * FROM members WHERE id = $1;

-- name: GetMemberByPhone :one
SELECT * FROM members WHERE phone = $1;

-- name: InsertMember :one
INSERT INTO members (
    member_code, first_name, last_name, phone, email, status, joining_date,
    date_of_birth, gender, address,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relationship
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
) RETURNING *;

-- name: UpdateMember :one
UPDATE members
SET first_name                     = COALESCE(sqlc.narg('first_name'),     first_name),
    last_name                      = COALESCE(sqlc.narg('last_name'),      last_name),
    email                          = COALESCE(sqlc.narg('email'),          email),
    status                         = COALESCE(sqlc.narg('status')::member_status, status),
    date_of_birth                  = COALESCE(sqlc.narg('date_of_birth'),  date_of_birth),
    gender                         = COALESCE(sqlc.narg('gender'),         gender),
    address                        = COALESCE(sqlc.narg('address'),        address),
    emergency_contact_name         = COALESCE(sqlc.narg('ec_name'),        emergency_contact_name),
    emergency_contact_phone        = COALESCE(sqlc.narg('ec_phone'),       emergency_contact_phone),
    emergency_contact_relationship = COALESCE(sqlc.narg('ec_rel'),         emergency_contact_relationship),
    updated_at                     = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteMember :exec
DELETE FROM members WHERE id = $1;

-- name: ListMembers :many
SELECT * FROM members
WHERE (sqlc.narg('status')::member_status IS NULL OR status = sqlc.narg('status')::member_status)
  AND (sqlc.narg('search')::text IS NULL
       OR first_name ILIKE '%' || sqlc.narg('search')::text || '%'
       OR last_name  ILIKE '%' || sqlc.narg('search')::text || '%'
       OR phone      ILIKE '%' || sqlc.narg('search')::text || '%'
       OR member_code ILIKE '%' || sqlc.narg('search')::text || '%')
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountMembers :one
SELECT COUNT(*) FROM members
WHERE (sqlc.narg('status')::member_status IS NULL OR status = sqlc.narg('status')::member_status)
  AND (sqlc.narg('search')::text IS NULL
       OR first_name ILIKE '%' || sqlc.narg('search')::text || '%'
       OR last_name  ILIKE '%' || sqlc.narg('search')::text || '%'
       OR phone      ILIKE '%' || sqlc.narg('search')::text || '%'
       OR member_code ILIKE '%' || sqlc.narg('search')::text || '%');
