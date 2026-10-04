package plan

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/shopspring/decimal"

	"github.com/sidpd51/gym-backend/internal/common"
	"github.com/sidpd51/gym-backend/internal/db/sqlc"
)

type Service struct {
	pool *pgxpool.Pool
	q    *sqlc.Queries
}

func NewService(pool *pgxpool.Pool) *Service {
	return &Service{pool: pool, q: sqlc.New(pool)}
}

func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (Response, error) {
	row, err := s.q.GetMembershipPlanByID(ctx, common.PgUUID(id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Response{}, common.NewNotFoundError("PLAN_NOT_FOUND", "Membership plan not found.")
		}
		return Response{}, err
	}
	return toResponse(row), nil
}

type ListFilter struct {
	Status *string
}

func (s *Service) List(ctx context.Context, q common.PageQuery, f ListFilter) (common.PageResponse[Response], error) {
	var statusParam *sqlc.PlanStatus
	if f.Status != nil {
		st := sqlc.PlanStatus(*f.Status)
		statusParam = &st
	}
	rows, err := s.q.ListMembershipPlans(ctx, sqlc.ListMembershipPlansParams{
		Limit: int32(q.Limit()), Offset: int32(q.Offset()), Status: statusParam,
	})
	if err != nil {
		return common.PageResponse[Response]{}, err
	}
	total, err := s.q.CountMembershipPlans(ctx, statusParam)
	if err != nil {
		return common.PageResponse[Response]{}, err
	}
	out := make([]Response, 0, len(rows))
	for _, r := range rows {
		out = append(out, toResponse(r))
	}
	return common.NewPage(out, q.Page, q.PageSize, total), nil
}

func (s *Service) Create(ctx context.Context, actor uuid.UUID, req CreateRequest) (Response, error) {
	if !req.Price.IsPositive() {
		return Response{}, common.NewBadRequestError("INVALID_PRICE", "Price must be greater than zero.")
	}
	status := sqlc.PlanStatusACTIVE
	if req.Status != nil {
		status = sqlc.PlanStatus(*req.Status)
	}
	var created sqlc.MembershipPlan
	err := pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		p, err := s.q.WithTx(tx).InsertMembershipPlan(ctx, sqlc.InsertMembershipPlanParams{
			Name:           req.Name,
			Description:    req.Description,
			DurationInDays: req.DurationInDays,
			Price:          req.Price,
			Status:         status,
		})
		if err != nil {
			return err
		}
		created = p
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID:      actor,
			Action:      common.AuditCreate,
			EntityType:  common.EntityMembershipPlan,
			EntityID:    common.UUIDFromPg(p.ID).String(),
			EntityName:  p.Name,
			Description: fmt.Sprintf("Created plan %q", p.Name),
		})
	})
	if err != nil {
		return Response{}, err
	}
	return toResponse(created), nil
}

func (s *Service) Update(ctx context.Context, actor uuid.UUID, id uuid.UUID, req UpdateRequest) (Response, error) {
	if req.Price != nil && !req.Price.IsPositive() {
		return Response{}, common.NewBadRequestError("INVALID_PRICE", "Price must be greater than zero.")
	}
	params := sqlc.UpdateMembershipPlanParams{
		ID:             common.PgUUID(id),
		Name:           req.Name,
		Description:    req.Description,
		DurationInDays: req.DurationInDays,
	}
	if req.Price != nil {
		params.Price = decimal.NullDecimal{Decimal: *req.Price, Valid: true}
	}
	if req.Status != nil {
		st := sqlc.PlanStatus(*req.Status)
		params.Status = &st
	}
	var updated sqlc.MembershipPlan
	err := pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		p, err := s.q.WithTx(tx).UpdateMembershipPlan(ctx, params)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return common.NewNotFoundError("PLAN_NOT_FOUND", "Membership plan not found.")
			}
			return err
		}
		updated = p
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID:      actor,
			Action:      common.AuditUpdate,
			EntityType:  common.EntityMembershipPlan,
			EntityID:    common.UUIDFromPg(p.ID).String(),
			EntityName:  p.Name,
			Description: "Updated plan",
		})
	})
	if err != nil {
		return Response{}, err
	}
	return toResponse(updated), nil
}

func (s *Service) Delete(ctx context.Context, actor uuid.UUID, id uuid.UUID) error {
	return pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		existing, err := s.q.WithTx(tx).GetMembershipPlanByID(ctx, common.PgUUID(id))
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return common.NewNotFoundError("PLAN_NOT_FOUND", "Plan not found.")
			}
			return err
		}
		if err := s.q.WithTx(tx).DeleteMembershipPlan(ctx, common.PgUUID(id)); err != nil {
			if common.IsForeignKeyViolation(err) {
				return common.NewConflictError("PLAN_REFERENCED",
					"This plan cannot be deleted because memberships reference it.")
			}
			return err
		}
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID:      actor,
			Action:      common.AuditDelete,
			EntityType:  common.EntityMembershipPlan,
			EntityID:    id.String(),
			EntityName:  existing.Name,
			Description: fmt.Sprintf("Deleted plan %q", existing.Name),
		})
	})
}

func toResponse(p sqlc.MembershipPlan) Response {
	return Response{
		ID:             common.UUIDFromPg(p.ID),
		Name:           p.Name,
		Description:    p.Description,
		DurationInDays: p.DurationInDays,
		Price:          p.Price,
		Status:         string(p.Status),
		CreatedAt:      common.TimeFromPg(p.CreatedAt),
	}
}
