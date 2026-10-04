-- name: GetTrainerByID :one
SELECT * FROM trainers WHERE id = $1;

-- name: ListTrainers :many
SELECT * FROM trainers
WHERE (sqlc.narg('status')::trainer_status IS NULL OR status = sqlc.narg('status')::trainer_status)
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountTrainers :one
SELECT COUNT(*) FROM trainers
WHERE (sqlc.narg('status')::trainer_status IS NULL OR status = sqlc.narg('status')::trainer_status);

-- name: InsertTrainer :one
INSERT INTO trainers (trainer_code, first_name, last_name, phone, email, specialization, joining_date, status)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: UpdateTrainer :one
UPDATE trainers
SET first_name     = COALESCE(sqlc.narg('first_name'), first_name),
    last_name      = COALESCE(sqlc.narg('last_name'),  last_name),
    phone          = COALESCE(sqlc.narg('phone'),      phone),
    email          = COALESCE(sqlc.narg('email'),      email),
    specialization = COALESCE(sqlc.narg('specialization'), specialization),
    status         = COALESCE(sqlc.narg('status')::trainer_status, status),
    updated_at     = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteTrainer :exec
DELETE FROM trainers WHERE id = $1;

-- name: GetActiveAssignmentForMember :one
SELECT * FROM member_trainer_assignments
WHERE member_id = $1 AND status = 'ACTIVE'
LIMIT 1;

-- name: EndAssignment :exec
UPDATE member_trainer_assignments
SET status = 'ENDED', end_date = CURRENT_DATE
WHERE id = $1;

-- name: InsertAssignment :one
INSERT INTO member_trainer_assignments (member_id, trainer_id, start_date, status)
VALUES ($1, $2, CURRENT_DATE, 'ACTIVE')
RETURNING *;

-- name: GetTrainerForMember :one
SELECT a.*, t.first_name AS trainer_first_name, t.last_name AS trainer_last_name
FROM member_trainer_assignments a
JOIN trainers t ON t.id = a.trainer_id
WHERE a.member_id = $1 AND a.status = 'ACTIVE'
LIMIT 1;
