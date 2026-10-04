-- name: InsertAttendance :one
INSERT INTO attendance (member_id, membership_id, attendance_date, check_in_time)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: ListAttendance :many
SELECT * FROM attendance
WHERE (sqlc.narg('member_id')::uuid IS NULL OR member_id = sqlc.narg('member_id')::uuid)
  AND (sqlc.narg('from_date')::date IS NULL OR attendance_date >= sqlc.narg('from_date')::date)
  AND (sqlc.narg('to_date')::date IS NULL OR attendance_date <= sqlc.narg('to_date')::date)
ORDER BY attendance_date DESC, check_in_time DESC
LIMIT $1 OFFSET $2;

-- name: CountAttendance :one
SELECT COUNT(*) FROM attendance
WHERE (sqlc.narg('member_id')::uuid IS NULL OR member_id = sqlc.narg('member_id')::uuid)
  AND (sqlc.narg('from_date')::date IS NULL OR attendance_date >= sqlc.narg('from_date')::date)
  AND (sqlc.narg('to_date')::date IS NULL OR attendance_date <= sqlc.narg('to_date')::date);

-- name: ListAttendanceByMember :many
SELECT * FROM attendance WHERE member_id = $1 ORDER BY attendance_date DESC LIMIT 50;

-- name: GetActiveMembershipForMember :one
SELECT * FROM memberships
WHERE member_id = $1 AND status = 'ACTIVE'
ORDER BY end_date DESC
LIMIT 1;

-- name: GetGymSettings :one
SELECT * FROM gym_settings WHERE id = 1;
