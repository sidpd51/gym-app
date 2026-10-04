package membership

import (
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type CreateRequest struct {
	MemberID  uuid.UUID `json:"memberId"  validate:"required"`
	PlanID    uuid.UUID `json:"planId"    validate:"required"`
	StartDate string    `json:"startDate" validate:"required,datetime=2006-01-02"`
}

type Response struct {
	ID        uuid.UUID       `json:"id"`
	MemberID  uuid.UUID       `json:"memberId"`
	PlanID    uuid.UUID       `json:"planId"`
	PlanName  string          `json:"planName"`
	StartDate string          `json:"startDate"`
	EndDate   string          `json:"endDate"`
	Amount    decimal.Decimal `json:"amount"`
	Status    string          `json:"status"`
	CreatedAt time.Time       `json:"createdAt"`
}
