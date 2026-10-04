-- name: GetAuditLogByID :one
SELECT * FROM audit_logs WHERE id = $1;

-- name: ListAuditLogs :many
SELECT * FROM audit_logs
WHERE (sqlc.narg('action')::audit_action IS NULL OR action = sqlc.narg('action')::audit_action)
  AND (sqlc.narg('entity_type')::audit_entity_type IS NULL OR entity_type = sqlc.narg('entity_type')::audit_entity_type)
  AND (sqlc.narg('user_id')::uuid IS NULL OR user_id = sqlc.narg('user_id')::uuid)
  AND (sqlc.narg('status')::audit_status IS NULL OR status = sqlc.narg('status')::audit_status)
  AND (sqlc.narg('from')::timestamptz IS NULL OR timestamp >= sqlc.narg('from')::timestamptz)
  AND (sqlc.narg('to')::timestamptz IS NULL OR timestamp <= sqlc.narg('to')::timestamptz)
ORDER BY timestamp DESC
LIMIT $1 OFFSET $2;

-- name: CountAuditLogs :one
SELECT COUNT(*) FROM audit_logs
WHERE (sqlc.narg('action')::audit_action IS NULL OR action = sqlc.narg('action')::audit_action)
  AND (sqlc.narg('entity_type')::audit_entity_type IS NULL OR entity_type = sqlc.narg('entity_type')::audit_entity_type)
  AND (sqlc.narg('user_id')::uuid IS NULL OR user_id = sqlc.narg('user_id')::uuid)
  AND (sqlc.narg('status')::audit_status IS NULL OR status = sqlc.narg('status')::audit_status)
  AND (sqlc.narg('from')::timestamptz IS NULL OR timestamp >= sqlc.narg('from')::timestamptz)
  AND (sqlc.narg('to')::timestamptz IS NULL OR timestamp <= sqlc.narg('to')::timestamptz);
