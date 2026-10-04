-- name: ListNotifications :many
SELECT * FROM notification_records
WHERE (sqlc.narg('status')::notification_status IS NULL OR status = sqlc.narg('status')::notification_status)
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountNotifications :one
SELECT COUNT(*) FROM notification_records
WHERE (sqlc.narg('status')::notification_status IS NULL OR status = sqlc.narg('status')::notification_status);

-- name: InsertNotification :one
INSERT INTO notification_records (member_id, membership_id, type, channel, status, message)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- Members whose active membership expires within the next N days (IST).
-- name: FindMembershipsExpiringWithin :many
SELECT m.id         AS membership_id,
       m.end_date   AS end_date,
       mb.id        AS member_id,
       mb.first_name,
       mb.last_name,
       mb.phone
FROM memberships m
JOIN members mb ON mb.id = m.member_id
WHERE m.status = 'ACTIVE'
  AND m.end_date >= (NOW() AT TIME ZONE 'Asia/Kolkata')::date
  AND m.end_date <= ((NOW() AT TIME ZONE 'Asia/Kolkata')::date + $1::int);

-- name: FindExpiredMemberships :many
SELECT m.id       AS membership_id,
       m.end_date AS end_date,
       mb.id      AS member_id,
       mb.first_name,
       mb.last_name,
       mb.phone
FROM memberships m
JOIN members mb ON mb.id = m.member_id
WHERE m.status = 'EXPIRED'
   OR (m.status = 'ACTIVE' AND m.end_date < (NOW() AT TIME ZONE 'Asia/Kolkata')::date);
