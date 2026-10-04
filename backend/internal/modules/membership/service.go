package membership

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

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
	row, err := s.q.GetMembershipByID(ctx, common.PgUUID(id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Response{}, common.NewNotFoundError("MEMBERSHIP_NOT_FOUND", "Membership not found.")
		}
		return Response{}, err
	}
	return toResponse(row), nil
}

type ListFilter struct {
	Status   *string
	MemberID *uuid.UUID
}

func (s *Service) List(ctx context.Context, q common.PageQuery, f ListFilter) (common.PageResponse[Response], error) {
	var statusParam *sqlc.MembershipStatus
	if f.Status != nil {
		st := sqlc.MembershipStatus(*f.Status)
		statusParam = &st
	}
	memberParam := pgtype.UUID{Valid: false}
	if f.MemberID != nil {
		memberParam = common.PgUUID(*f.MemberID)
	}

	rows, err := s.q.ListMemberships(ctx, sqlc.ListMembershipsParams{
		Limit:    int32(q.Limit()),
		Offset:   int32(q.Offset()),
		Status:   statusParam,
		MemberID: memberParam,
	})
	if err != nil {
		return common.PageResponse[Response]{}, err
	}
	total, err := s.q.CountMemberships(ctx, sqlc.CountMembershipsParams{
		Status:   statusParam,
		MemberID: memberParam,
	})
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
	start, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		return Response{}, common.NewBadRequestError("INVALID_DATE", "startDate must be YYYY-MM-DD")
	}

	// Load the plan to snapshot name + amount and compute end_date.
	plan, err := s.q.GetMembershipPlanByID(ctx, common.PgUUID(req.PlanID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Response{}, common.NewNotFoundError("PLAN_NOT_FOUND", "Plan not found.")
		}
		return Response{}, err
	}
	if plan.Status != sqlc.PlanStatusACTIVE {
		return Response{}, common.NewBusinessRuleError("PLAN_INACTIVE", "Cannot assign an INACTIVE plan.")
	}

	end := start.AddDate(0, 0, int(plan.DurationInDays)-1)

	var created sqlc.Membership
	err = pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		m, err := s.q.WithTx(tx).InsertMembership(ctx, sqlc.InsertMembershipParams{
			MemberID:  common.PgUUID(req.MemberID),
			PlanID:    common.PgUUID(req.PlanID),
			PlanName:  plan.Name,
			StartDate: common.PgDate(start),
			EndDate:   common.PgDate(end),
			Amount:    plan.Price,
			Status:    sqlc.MembershipStatusACTIVE,
		})
		if err != nil {
			if common.IsUniqueViolation(err) {
				return common.NewConflictError("MEMBERSHIP_ALREADY_ACTIVE",
					"This member already has an active membership.")
			}
			if common.IsForeignKeyViolation(err) {
				return common.NewBadRequestError("INVALID_REFERENCE", "Member or plan not found.")
			}
			return err
		}
		created = m
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID:      actor,
			Action:      common.AuditCreate,
			EntityType:  common.EntityMembership,
			EntityID:    common.UUIDFromPg(m.ID).String(),
			EntityName:  plan.Name,
			Description: fmt.Sprintf("Created membership (plan=%s)", plan.Name),
		})
	})
	if err != nil {
		return Response{}, err
	}
	return toResponse(created), nil
}

func toResponse(m sqlc.Membership) Response {
	return Response{
		ID:        common.UUIDFromPg(m.ID),
		MemberID:  common.UUIDFromPg(m.MemberID),
		PlanID:    common.UUIDFromPg(m.PlanID),
		PlanName:  m.PlanName,
		StartDate: common.DateFromPg(m.StartDate).Format("2006-01-02"),
		EndDate:   common.DateFromPg(m.EndDate).Format("2006-01-02"),
		Amount:    m.Amount,
		Status:    string(m.Status),
		CreatedAt: common.TimeFromPg(m.CreatedAt),
	}
}

