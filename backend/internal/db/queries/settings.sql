-- name: UpdateGymSettings :one
UPDATE gym_settings
SET gym_name                                = COALESCE(sqlc.narg('gym_name'),                                gym_name),
    phone                                   = COALESCE(sqlc.narg('phone'),                                   phone),
    email                                   = COALESCE(sqlc.narg('email'),                                   email),
    address                                 = COALESCE(sqlc.narg('address'),                                 address),
    currency                                = COALESCE(sqlc.narg('currency'),                                currency),
    timezone                                = COALESCE(sqlc.narg('timezone'),                                timezone),
    date_format                             = COALESCE(sqlc.narg('date_format'),                             date_format),
    membership_grace_period_days            = COALESCE(sqlc.narg('membership_grace_period_days'),            membership_grace_period_days),
    attendance_start_time                   = COALESCE(sqlc.narg('attendance_start_time'),                   attendance_start_time),
    attendance_end_time                     = COALESCE(sqlc.narg('attendance_end_time'),                     attendance_end_time),
    allow_attendance_for_expired_membership = COALESCE(sqlc.narg('allow_attendance_for_expired_membership'), allow_attendance_for_expired_membership)
WHERE id = 1
RETURNING *;
