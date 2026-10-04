package common

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
)

// QueryRower is a narrow interface satisfied by both *pgxpool.Pool and
// pgx.Tx. Code-generation functions take this so callers can pass a
// transaction when the next code should be allocated inside a wider write.
type QueryRower interface {
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

type codePrefix struct {
	prefix   string
	sequence string
}

var (
	userCode      = codePrefix{"USR", "user_code_seq"}
	memberCode    = codePrefix{"MEM", "member_code_seq"}
	trainerCode   = codePrefix{"TRN", "trainer_code_seq"}
	leadCode      = codePrefix{"LEAD", "lead_code_seq"}
	expenseCode   = codePrefix{"EXP", "expense_code_seq"}
	itemCode      = codePrefix{"INV", "item_code_seq"}
	equipmentCode = codePrefix{"EQP", "equipment_code_seq"}
)

func nextCode(ctx context.Context, q QueryRower, c codePrefix) (string, error) {
	// Sequence names come from a closed set of package constants, not from
	// user input, so inlining is safe and avoids the regclass-cast dance.
	var n int64
	err := q.QueryRow(ctx, "SELECT nextval('"+c.sequence+"')").Scan(&n)
	if err != nil {
		return "", fmt.Errorf("nextval %s: %w", c.sequence, err)
	}
	return fmt.Sprintf("%s-%03d", c.prefix, n), nil
}

func NextUserCode(ctx context.Context, q QueryRower) (string, error) {
	return nextCode(ctx, q, userCode)
}

func NextMemberCode(ctx context.Context, q QueryRower) (string, error) {
	return nextCode(ctx, q, memberCode)
}

func NextTrainerCode(ctx context.Context, q QueryRower) (string, error) {
	return nextCode(ctx, q, trainerCode)
}

func NextLeadCode(ctx context.Context, q QueryRower) (string, error) {
	return nextCode(ctx, q, leadCode)
}

func NextExpenseCode(ctx context.Context, q QueryRower) (string, error) {
	return nextCode(ctx, q, expenseCode)
}

func NextInventoryItemCode(ctx context.Context, q QueryRower) (string, error) {
	return nextCode(ctx, q, itemCode)
}

func NextEquipmentCode(ctx context.Context, q QueryRower) (string, error) {
	return nextCode(ctx, q, equipmentCode)
}
