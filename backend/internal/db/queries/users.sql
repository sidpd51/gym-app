-- name: GetUserByID :one
SELECT id, user_code, first_name, last_name, email, phone, role, status,
       password_hash, last_login_at, created_at
FROM users
WHERE id = $1;

-- name: GetUserByEmail :one
SELECT id, user_code, first_name, last_name, email, phone, role, status,
       password_hash, last_login_at, created_at
FROM users
WHERE lower(email) = lower($1);

-- name: InsertUser :one
INSERT INTO users (user_code, first_name, last_name, email, phone, role, status, password_hash)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id, user_code, first_name, last_name, email, phone, role, status,
          password_hash, last_login_at, created_at;

-- name: UpdateUser :one
UPDATE users
SET first_name = COALESCE(sqlc.narg('first_name'), first_name),
    last_name  = COALESCE(sqlc.narg('last_name'),  last_name),
    phone      = COALESCE(sqlc.narg('phone'),      phone),
    role       = COALESCE(sqlc.narg('role'),       role),
    status     = COALESCE(sqlc.narg('status'),     status)
WHERE id = $1
RETURNING id, user_code, first_name, last_name, email, phone, role, status,
          password_hash, last_login_at, created_at;

-- name: UpdateUserPasswordHash :exec
UPDATE users SET password_hash = $2 WHERE id = $1;

-- name: UpdateUserLastLogin :exec
UPDATE users SET last_login_at = NOW() WHERE id = $1;

-- name: DeleteUser :exec
DELETE FROM users WHERE id = $1;

-- name: ListUsers :many
SELECT id, user_code, first_name, last_name, email, phone, role, status,
       last_login_at, created_at
FROM users
WHERE (sqlc.narg('role')::user_role IS NULL OR role = sqlc.narg('role')::user_role)
  AND (sqlc.narg('status')::user_status IS NULL OR status = sqlc.narg('status')::user_status)
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountUsers :one
SELECT COUNT(*)
FROM users
WHERE (sqlc.narg('role')::user_role IS NULL OR role = sqlc.narg('role')::user_role)
  AND (sqlc.narg('status')::user_status IS NULL OR status = sqlc.narg('status')::user_status);

-- name: UpdateUserProfile :one
UPDATE users
SET first_name = COALESCE(sqlc.narg('first_name'), first_name),
    last_name  = COALESCE(sqlc.narg('last_name'),  last_name),
    phone      = COALESCE(sqlc.narg('phone'),      phone)
WHERE id = $1
RETURNING id, user_code, first_name, last_name, email, phone, role, status,
          password_hash, last_login_at, created_at;
