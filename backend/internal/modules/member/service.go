package member

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
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

func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (MemberResponse, error) {
	row, err := s.q.GetMemberByID(ctx, common.PgUUID(id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return MemberResponse{}, common.NewNotFoundError("MEMBER_NOT_FOUND", "Member not found.")
		}
		return MemberResponse{}, err
	}
	return toResponse(row), nil
}

type ListFilter struct {
	Status *string
}

func (s *Service) List(ctx context.Context, q common.PageQuery, f ListFilter) (common.PageResponse[MemberResponse], error) {
	var statusParam *sqlc.MemberStatus
	if f.Status != nil {
		st := sqlc.MemberStatus(*f.Status)
		statusParam = &st
	}
	var searchParam *string
	if q.Search != "" {
		searchParam = &q.Search
	}
	rows, err := s.q.ListMembers(ctx, sqlc.ListMembersParams{
		Limit:  int32(q.Limit()),
		Offset: int32(q.Offset()),
		Status: statusParam,
		Search: searchParam,
	})
	if err != nil {
		return common.PageResponse[MemberResponse]{}, err
	}
	total, err := s.q.CountMembers(ctx, sqlc.CountMembersParams{Status: statusParam, Search: searchParam})
	if err != nil {
		return common.PageResponse[MemberResponse]{}, err
	}
	out := make([]MemberResponse, 0, len(rows))
	for _, r := range rows {
		out = append(out, toResponse(r))
	}
	return common.NewPage(out, q.Page, q.PageSize, total), nil
}

func (s *Service) Create(ctx context.Context, actor uuid.UUID, req CreateMemberRequest) (MemberResponse, error) {
	// Pre-check phone uniqueness so we return a nicer error than FK violation.
	if _, err := s.q.GetMemberByPhone(ctx, req.Phone); err == nil {
		return MemberResponse{}, common.NewConflictError("MEMBER_PHONE_DUPLICATE",
			"A member with this phone number already exists.")
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return MemberResponse{}, err
	}

	joining, err := time.Parse("2006-01-02", req.JoiningDate)
	if err != nil {
		return MemberResponse{}, common.NewBadRequestError("INVALID_DATE", "joiningDate must be YYYY-MM-DD")
	}
	var dob *time.Time
	if req.DateOfBirth != nil {
		t, err := time.Parse("2006-01-02", *req.DateOfBirth)
		if err != nil {
			return MemberResponse{}, common.NewBadRequestError("INVALID_DATE", "dateOfBirth must be YYYY-MM-DD")
		}
		if !t.Before(time.Now()) {
			return MemberResponse{}, common.NewBadRequestError("DOB_NOT_PAST", "dateOfBirth must be in the past.")
		}
		dob = &t
	}

	var created sqlc.Member
	err = pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		code, err := common.NextMemberCode(ctx, tx)
		if err != nil {
			return err
		}
		params := sqlc.InsertMemberParams{
			MemberCode:                   code,
			FirstName:                    req.FirstName,
			LastName:                     req.LastName,
			Phone:                        req.Phone,
			Email:                        strPtrOrNil(req.Email),
			Status:                       sqlc.MemberStatusACTIVE,
			JoiningDate:                  common.PgDate(joining),
			DateOfBirth:                  common.PgDate(deref(dob)),
			Gender:                       req.Gender,
			Address:                      req.Address,
			EmergencyContactName:         req.EmergencyContactName,
			EmergencyContactPhone:        req.EmergencyContactPhone,
			EmergencyContactRelationship: req.EmergencyContactRelationship,
		}
		m, err := s.q.WithTx(tx).InsertMember(ctx, params)
		if err != nil {
			if common.IsUniqueViolation(err) {
				return common.NewConflictError("MEMBER_PHONE_DUPLICATE",
					"A member with this phone number already exists.")
			}
			return err
		}
		created = m
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID:      actor,
			Action:      common.AuditCreate,
			EntityType:  common.EntityMember,
			EntityID:    common.UUIDFromPg(m.ID).String(),
			EntityName:  m.FirstName + " " + m.LastName,
			Description: fmt.Sprintf("Created member %s", m.MemberCode),
		})
	})
	if err != nil {
		return MemberResponse{}, err
	}
	return toResponse(created), nil
}

func (s *Service) Update(ctx context.Context, actor uuid.UUID, id uuid.UUID, req UpdateMemberRequest) (MemberResponse, error) {
	params := sqlc.UpdateMemberParams{
		ID:        common.PgUUID(id),
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Email:     req.Email,
		Gender:    req.Gender,
		Address:   req.Address,
		EcName:    req.EmergencyContactName,
		EcPhone:   req.EmergencyContactPhone,
		EcRel:     req.EmergencyContactRelationship,
	}
	if req.Status != nil {
		s := sqlc.MemberStatus(*req.Status)
		params.Status = &s
	}
	if req.DateOfBirth != nil {
		t, err := time.Parse("2006-01-02", *req.DateOfBirth)
		if err != nil {
			return MemberResponse{}, common.NewBadRequestError("INVALID_DATE", "dateOfBirth must be YYYY-MM-DD")
		}
		params.DateOfBirth = common.PgDate(t)
	}

	var updated sqlc.Member
	err := pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		m, err := s.q.WithTx(tx).UpdateMember(ctx, params)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return common.NewNotFoundError("MEMBER_NOT_FOUND", "Member not found.")
			}
			return err
		}
		updated = m
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID:      actor,
			Action:      common.AuditUpdate,
			EntityType:  common.EntityMember,
			EntityID:    common.UUIDFromPg(m.ID).String(),
			EntityName:  m.FirstName + " " + m.LastName,
			Description: "Updated member",
		})
	})
	if err != nil {
		return MemberResponse{}, err
	}
	return toResponse(updated), nil
}

func (s *Service) Delete(ctx context.Context, actor uuid.UUID, id uuid.UUID) error {
	return pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		existing, err := s.q.WithTx(tx).GetMemberByID(ctx, common.PgUUID(id))
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return common.NewNotFoundError("MEMBER_NOT_FOUND", "Member not found.")
			}
			return err
		}
		if err := s.q.WithTx(tx).DeleteMember(ctx, common.PgUUID(id)); err != nil {
			if common.IsForeignKeyViolation(err) {
				return common.NewConflictError("MEMBER_REFERENCED",
					"This member cannot be deleted because they have related records (memberships, payments, attendance).")
			}
			return err
		}
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID:      actor,
			Action:      common.AuditDelete,
			EntityType:  common.EntityMember,
			EntityID:    id.String(),
			EntityName:  existing.FirstName + " " + existing.LastName,
			Description: fmt.Sprintf("Deleted member %s", existing.MemberCode),
		})
	})
}

// Details returns the skeleton MemberDetail. Supplemental slices will be
// populated by later phases (membership, payment, attendance, trainer).
func (s *Service) Details(ctx context.Context, id uuid.UUID) (MemberDetail, error) {
	m, err := s.GetByID(ctx, id)
	if err != nil {
		return MemberDetail{}, err
	}
	return MemberDetail{
		Member:            m,
		MembershipHistory: []any{},
		PaymentHistory:    []any{},
		AttendanceHistory: []any{},
	}, nil
}

func toResponse(m sqlc.Member) MemberResponse {
	resp := MemberResponse{
		ID:                           common.UUIDFromPg(m.ID),
		MemberCode:                   m.MemberCode,
		FirstName:                    m.FirstName,
		LastName:                     m.LastName,
		Phone:                        m.Phone,
		Email:                        m.Email,
		Status:                       string(m.Status),
		JoiningDate:                  common.DateFromPg(m.JoiningDate).Format("2006-01-02"),
		Gender:                       m.Gender,
		Address:                      m.Address,
		EmergencyContactName:         m.EmergencyContactName,
		EmergencyContactPhone:        m.EmergencyContactPhone,
		EmergencyContactRelationship: m.EmergencyContactRelationship,
		CreatedAt:                    common.TimeFromPg(m.CreatedAt),
		UpdatedAt:                    common.TimeFromPg(m.UpdatedAt),
	}
	if m.DateOfBirth.Valid {
		s := m.DateOfBirth.Time.Format("2006-01-02")
		resp.DateOfBirth = &s
	}
	return resp
}

func strPtrOrNil(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func deref(t *time.Time) time.Time {
	if t == nil {
		return time.Time{}
	}
	return *t
}
