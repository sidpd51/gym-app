-- name: SearchMembers :many
SELECT id, member_code, first_name, last_name, phone
FROM members
WHERE first_name ILIKE '%' || $1 || '%'
   OR last_name  ILIKE '%' || $1 || '%'
   OR phone      ILIKE '%' || $1 || '%'
   OR member_code ILIKE '%' || $1 || '%'
LIMIT 5;

-- name: SearchTrainers :many
SELECT id, trainer_code, first_name, last_name, phone
FROM trainers
WHERE first_name ILIKE '%' || $1 || '%'
   OR last_name  ILIKE '%' || $1 || '%'
   OR phone      ILIKE '%' || $1 || '%'
   OR trainer_code ILIKE '%' || $1 || '%'
LIMIT 5;

-- name: SearchLeads :many
SELECT id, lead_code, name, phone
FROM leads
WHERE name  ILIKE '%' || $1 || '%'
   OR phone ILIKE '%' || $1 || '%'
   OR lead_code ILIKE '%' || $1 || '%'
LIMIT 5;
