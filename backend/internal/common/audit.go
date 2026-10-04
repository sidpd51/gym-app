package common

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

// AuditAction mirrors the audit_action enum.
type AuditAction string

const (
	AuditCreate AuditAction = "CREATE"
	AuditUpdate AuditAction = "UPDATE"
	AuditDelete AuditAction = "DELETE"
	AuditLogin  AuditAction = "LOGIN"
	AuditLogout AuditAction = "LOGOUT"
	AuditView   AuditAction = "VIEW"
	AuditExport AuditAction = "EXPORT"
)

// AuditEntityType mirrors audit_entity_type enum.
type AuditEntityType string

const (
	EntityUser                 AuditEntityType = "USER"
	EntityMember               AuditEntityType = "MEMBER"
	EntityMembershipPlan       AuditEntityType = "MEMBERSHIP_PLAN"
	EntityMembership           AuditEntityType = "MEMBERSHIP"
	EntityPayment              AuditEntityType = "PAYMENT"
	EntityAttendance           AuditEntityType = "ATTENDANCE"
	EntityTrainer              AuditEntityType = "TRAINER"
	EntityLead                 AuditEntityType = "LEAD"
	EntityExpense              AuditEntityType = "EXPENSE"
	EntityInventoryItem        AuditEntityType = "INVENTORY_ITEM"
	EntityEquipment            AuditEntityType = "EQUIPMENT"
	EntityEquipmentMaintenance AuditEntityType = "EQUIPMENT_MAINTENANCE"
	EntityNotification         AuditEntityType = "NOTIFICATION"
	EntitySettings             AuditEntityType = "SETTINGS"
)

// AuditStatus mirrors audit_status enum.
type AuditStatus string

const (
	AuditSuccess AuditStatus = "SUCCESS"
	AuditFailed  AuditStatus = "FAILED"
)

// AuditEntry is the payload passed to AuditLog / AuditLogWithPool.
type AuditEntry struct {
	UserID      uuid.UUID
	Action      AuditAction
	EntityType  AuditEntityType
	EntityID    string
	EntityName  string
	Description string
	Status      AuditStatus
	Metadata    map[string]any
}

// Execer is the narrow interface shared by pgx.Tx and *pgxpool.Pool.
type Execer interface {
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
}

const auditInsertSQL = `
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, entity_name, description, status, metadata)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
`

// AuditLog inserts an audit record using the provided transaction. Call this
// from inside a pgx.BeginTxFunc so the audit write participates in the same
// transaction as the primary operation.
func AuditLog(ctx context.Context, tx pgx.Tx, entry AuditEntry) error {
	return insertAudit(ctx, tx, entry)
}

// AuditLogWithPool opens a one-shot connection and writes an audit record
// outside any outer transaction. Use this for actions where there is no
// primary write to piggyback on (failed login, logout).
func AuditLogWithPool(ctx context.Context, pool *pgxpool.Pool, entry AuditEntry) error {
	return insertAudit(ctx, pool, entry)
}

func insertAudit(ctx context.Context, w Execer, entry AuditEntry) error {
	if entry.Status == "" {
		entry.Status = AuditSuccess
	}

	var metadataJSON []byte
	if len(entry.Metadata) > 0 {
		raw, err := json.Marshal(entry.Metadata)
		if err != nil {
			return fmt.Errorf("marshal audit metadata: %w", err)
		}
		metadataJSON = raw
	}

	_, err := w.Exec(ctx, auditInsertSQL,
		entry.UserID,
		string(entry.Action),
		string(entry.EntityType),
		nullIfEmpty(entry.EntityID),
		nullIfEmpty(entry.EntityName),
		entry.Description,
		string(entry.Status),
		metadataJSON,
	)
	if err != nil {
		return fmt.Errorf("insert audit log: %w", err)
	}
	return nil
}

func nullIfEmpty(s string) any {
	if s == "" {
		return nil
	}
	return s
}
