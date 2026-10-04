package user

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"

	"github.com/sidpd51/gym-backend/internal/common"
	"github.com/sidpd51/gym-backend/internal/db/sqlc"
)

const bcryptCost = 12

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// Pool exposes the underlying pool for audit writes outside a service tx
// (used by the auth handler for login/logout bookkeeping).
func (s *Service) Pool() *pgxpool.Pool { return s.repo.Pool() }

func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (UserResponse, error) {
	row, err := s.repo.Q().GetUserByID(ctx, common.PgUUID(id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return UserResponse{}, common.NewNotFoundError("USER_NOT_FOUND", "User not found.")
		}
		return UserResponse{}, err
	}
	return toUserResponse(row), nil
}

func (s *Service) GetByEmail(ctx context.Context, email string) (sqlc.User, error) {
	return s.repo.Q().GetUserByEmail(ctx, email)
}

func (s *Service) VerifyPassword(hash, plain string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(plain))
}

func (s *Service) MarkLoggedIn(ctx context.Context, id uuid.UUID) error {
	return s.repo.Q().UpdateUserLastLogin(ctx, common.PgUUID(id))
}

// ListFilter captures the role/status filters that aren't part of
// common.PageQuery. Parsed by the handler and passed through.
type ListFilter struct {
	Role   *common.Role
	Status *string
}

func (s *Service) List(ctx context.Context, q common.PageQuery, f ListFilter) (common.PageResponse[UserResponse], error) {
	var roleParam *sqlc.UserRole
	var statusParam *sqlc.UserStatus
	if f.Role != nil {
		r := sqlc.UserRole(*f.Role)
		roleParam = &r
	}
	if f.Status != nil {
		st := sqlc.UserStatus(*f.Status)
		statusParam = &st
	}

	rows, err := s.repo.Q().ListUsers(ctx, sqlc.ListUsersParams{
		Limit:  int32(q.Limit()),
		Offset: int32(q.Offset()),
		Role:   roleParam,
		Status: statusParam,
	})
	if err != nil {
		return common.PageResponse[UserResponse]{}, err
	}
	total, err := s.repo.Q().CountUsers(ctx, sqlc.CountUsersParams{
		Role:   roleParam,
		Status: statusParam,
	})
	if err != nil {
		return common.PageResponse[UserResponse]{}, err
	}
	out := make([]UserResponse, 0, len(rows))
	for _, r := range rows {
		out = append(out, toListResponse(r))
	}
	return common.NewPage(out, q.Page, q.PageSize, total), nil
}

func (s *Service) Create(ctx context.Context, actor uuid.UUID, req CreateUserRequest) (UserResponse, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcryptCost)
	if err != nil {
		return UserResponse{}, fmt.Errorf("hash password: %w", err)
	}

	var created sqlc.User
	err = s.repo.RunInTx(ctx, func(q *sqlc.Queries, tx pgx.Tx) error {
		code, err := common.NextUserCode(ctx, tx)
		if err != nil {
			return err
		}
		u, err := q.InsertUser(ctx, sqlc.InsertUserParams{
			UserCode:     code,
			FirstName:    req.FirstName,
			LastName:     req.LastName,
			Email:        strings.ToLower(req.Email),
			Phone:        strPtrOrNil(req.Phone),
			Role:         sqlc.UserRole(req.Role),
			Status:       sqlc.UserStatusACTIVE,
			PasswordHash: string(hash),
		})
		if err != nil {
			if common.IsUniqueViolation(err) {
				return common.NewConflictError("USER_EMAIL_DUPLICATE", "A user with this email already exists.")
			}
			return err
		}
		created = u
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID:      actor,
			Action:      common.AuditCreate,
			EntityType:  common.EntityUser,
			EntityID:    common.UUIDFromPg(u.ID).String(),
			EntityName:  u.FirstName + " " + u.LastName,
			Description: fmt.Sprintf("Created user %s (%s)", u.Email, u.Role),
		})
	})
	if err != nil {
		return UserResponse{}, err
	}
	return toUserResponse(created), nil
}

func (s *Service) Update(ctx context.Context, actor uuid.UUID, id uuid.UUID, req UpdateUserRequest) (UserResponse, error) {
	params := sqlc.UpdateUserParams{
		ID:        common.PgUUID(id),
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Phone:     req.Phone,
	}
	if req.Role != nil {
		r := sqlc.UserRole(*req.Role)
		params.Role = &r
	}
	if req.Status != nil {
		st := sqlc.UserStatus(*req.Status)
		params.Status = &st
	}

	var out sqlc.User
	err := s.repo.RunInTx(ctx, func(q *sqlc.Queries, tx pgx.Tx) error {
		u, err := q.UpdateUser(ctx, params)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return common.NewNotFoundError("USER_NOT_FOUND", "User not found.")
			}
			return err
		}
		out = u
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID:      actor,
			Action:      common.AuditUpdate,
			EntityType:  common.EntityUser,
			EntityID:    common.UUIDFromPg(u.ID).String(),
			EntityName:  u.FirstName + " " + u.LastName,
			Description: "Updated user profile",
		})
	})
	if err != nil {
		return UserResponse{}, err
	}
	return toUserResponse(out), nil
}

func (s *Service) UpdateProfile(ctx context.Context, actor uuid.UUID, req UpdateProfileRequest) (UserResponse, error) {
	if req.NewPassword != nil {
		existing, err := s.repo.Q().GetUserByID(ctx, common.PgUUID(actor))
		if err != nil {
			return UserResponse{}, err
		}
		if req.CurrentPassword == nil {
			return UserResponse{}, common.NewBadRequestError("PROFILE_CURRENT_PASSWORD_REQUIRED",
				"Current password is required to set a new password.")
		}
		if err := s.VerifyPassword(existing.PasswordHash, *req.CurrentPassword); err != nil {
			return UserResponse{}, common.NewBadRequestError("PROFILE_CURRENT_PASSWORD_INVALID",
				"Current password is incorrect.")
		}
	}

	params := sqlc.UpdateUserProfileParams{
		ID:        common.PgUUID(actor),
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Phone:     req.Phone,
	}

	var updated sqlc.User
	err := s.repo.RunInTx(ctx, func(q *sqlc.Queries, tx pgx.Tx) error {
		u, err := q.UpdateUserProfile(ctx, params)
		if err != nil {
			return err
		}
		if req.NewPassword != nil {
			hash, hashErr := bcrypt.GenerateFromPassword([]byte(*req.NewPassword), bcryptCost)
			if hashErr != nil {
				return fmt.Errorf("hash password: %w", hashErr)
			}
			if err := q.UpdateUserPasswordHash(ctx, sqlc.UpdateUserPasswordHashParams{
				ID:           common.PgUUID(actor),
				PasswordHash: string(hash),
			}); err != nil {
				return err
			}
		}
		updated = u
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID:      actor,
			Action:      common.AuditUpdate,
			EntityType:  common.EntityUser,
			EntityID:    actor.String(),
			EntityName:  u.FirstName + " " + u.LastName,
			Description: "Updated own profile",
		})
	})
	if err != nil {
		return UserResponse{}, err
	}
	return toUserResponse(updated), nil
}

func (s *Service) Delete(ctx context.Context, actor uuid.UUID, id uuid.UUID) error {
	if actor == id {
		return common.NewBusinessRuleError("USER_SELF_DELETE_FORBIDDEN",
			"You cannot delete your own account.")
	}
	return s.repo.RunInTx(ctx, func(q *sqlc.Queries, tx pgx.Tx) error {
		existing, err := q.GetUserByID(ctx, common.PgUUID(id))
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return common.NewNotFoundError("USER_NOT_FOUND", "User not found.")
			}
			return err
		}
		if err := q.DeleteUser(ctx, common.PgUUID(id)); err != nil {
			if common.IsForeignKeyViolation(err) {
				return common.NewConflictError("USER_REFERENCED",
					"This user is referenced by audit logs and cannot be deleted.")
			}
			return err
		}
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID:      actor,
			Action:      common.AuditDelete,
			EntityType:  common.EntityUser,
			EntityID:    id.String(),
			EntityName:  existing.FirstName + " " + existing.LastName,
			Description: fmt.Sprintf("Deleted user %s", existing.Email),
		})
	})
}

func strPtrOrNil(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// UserResponseFromSqlc converts a sqlc.User to the public DTO. Exported for
// the auth module which fetches sqlc.User directly during login.
func UserResponseFromSqlc(u sqlc.User) UserResponse {
	return toUserResponse(u)
}

func toUserResponse(u sqlc.User) UserResponse {
	return UserResponse{
		ID:          common.UUIDFromPg(u.ID),
		UserCode:    u.UserCode,
		FirstName:   u.FirstName,
		LastName:    u.LastName,
		Email:       u.Email,
		Phone:       u.Phone,
		Role:        common.Role(u.Role),
		Status:      string(u.Status),
		LastLoginAt: common.TimePtrFromPg(u.LastLoginAt),
		CreatedAt:   common.TimeFromPg(u.CreatedAt),
	}
}

func toListResponse(u sqlc.ListUsersRow) UserResponse {
	return UserResponse{
		ID:          common.UUIDFromPg(u.ID),
		UserCode:    u.UserCode,
		FirstName:   u.FirstName,
		LastName:    u.LastName,
		Email:       u.Email,
		Phone:       u.Phone,
		Role:        common.Role(u.Role),
		Status:      string(u.Status),
		LastLoginAt: common.TimePtrFromPg(u.LastLoginAt),
		CreatedAt:   common.TimeFromPg(u.CreatedAt),
	}
}
