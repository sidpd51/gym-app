package plan

import (
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type CreateRequest struct {
	Name           string          `json:"name"           validate:"required,min=1,max=100"`
	Description    *string         `json:"description"`
	DurationInDays int32           `json:"durationInDays" validate:"required,gte=1"`
	Price          decimal.Decimal `json:"price"          validate:"required"`
	Status         *string         `json:"status"         validate:"omitempty,oneof=ACTIVE INACTIVE"`
}

type UpdateRequest struct {
	Name           *string          `json:"name"           validate:"omitempty,min=1,max=100"`
	Description    *string          `json:"description"`
	DurationInDays *int32           `json:"durationInDays" validate:"omitempty,gte=1"`
	Price          *decimal.Decimal `json:"price"`
	Status         *string          `json:"status"         validate:"omitempty,oneof=ACTIVE INACTIVE"`
}

type Response struct {
	ID             uuid.UUID       `json:"id"`
	Name           string          `json:"name"`
	Description    *string         `json:"description"`
	DurationInDays int32           `json:"durationInDays"`
	Price          decimal.Decimal `json:"price"`
	Status         string          `json:"status"`
	CreatedAt      time.Time       `json:"createdAt"`
}
