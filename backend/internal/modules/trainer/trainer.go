package trainer

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/sidpd51/gym-backend/internal/common"
	"github.com/sidpd51/gym-backend/internal/common/render"
	"github.com/sidpd51/gym-backend/internal/db/sqlc"
	appmw "github.com/sidpd51/gym-backend/internal/middleware"
)

type CreateRequest struct {
	FirstName      string  `json:"firstName"      validate:"required,min=1,max=50"`
	LastName       string  `json:"lastName"       validate:"required,min=1,max=50"`
	Phone          string  `json:"phone"          validate:"required,max=20"`
	Email          *string `json:"email"          validate:"omitempty,email,max=255"`
	Specialization *string `json:"specialization" validate:"omitempty,max=100"`
	JoiningDate    string  `json:"joiningDate"    validate:"required,datetime=2006-01-02"`
}

type UpdateRequest struct {
	FirstName      *string `json:"firstName"      validate:"omitempty,min=1,max=50"`
	LastName       *string `json:"lastName"       validate:"omitempty,min=1,max=50"`
	Phone          *string `json:"phone"          validate:"omitempty,max=20"`
	Email          *string `json:"email"          validate:"omitempty,email,max=255"`
	Specialization *string `json:"specialization" validate:"omitempty,max=100"`
	Status         *string `json:"status"         validate:"omitempty,oneof=ACTIVE INACTIVE"`
}

type Response struct {
	ID             uuid.UUID `json:"id"`
	TrainerCode    string    `json:"trainerCode"`
	FirstName      string    `json:"firstName"`
	LastName       string    `json:"lastName"`
	Phone          string    `json:"phone"`
	Email          *string   `json:"email"`
	Specialization *string   `json:"specialization"`
	JoiningDate    string    `json:"joiningDate"`
	Status         string    `json:"status"`
	CreatedAt      time.Time `json:"createdAt"`
}

type AssignmentResponse struct {
	ID        uuid.UUID  `json:"id"`
	MemberID  uuid.UUID  `json:"memberId"`
	TrainerID uuid.UUID  `json:"trainerId"`
	StartDate string     `json:"startDate"`
	EndDate   *string    `json:"endDate"`
	Status    string     `json:"status"`
	CreatedAt time.Time  `json:"createdAt"`
}

type Service struct {
	pool *pgxpool.Pool
	q    *sqlc.Queries
}

func NewService(pool *pgxpool.Pool) *Service { return &Service{pool: pool, q: sqlc.New(pool)} }

func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (Response, error) {
	row, err := s.q.GetTrainerByID(ctx, common.PgUUID(id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Response{}, common.NewNotFoundError("TRAINER_NOT_FOUND", "Trainer not found.")
		}
		return Response{}, err
	}
	return toResponse(row), nil
}

type ListFilter struct {
	Status *string
}

func (s *Service) List(ctx context.Context, q common.PageQuery, f ListFilter) (common.PageResponse[Response], error) {
	var statusParam *sqlc.TrainerStatus
	if f.Status != nil {
		st := sqlc.TrainerStatus(*f.Status)
		statusParam = &st
	}
	rows, err := s.q.ListTrainers(ctx, sqlc.ListTrainersParams{Limit: int32(q.Limit()), Offset: int32(q.Offset()), Status: statusParam})
	if err != nil {
		return common.PageResponse[Response]{}, err
	}
	total, err := s.q.CountTrainers(ctx, statusParam)
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
	joining, err := time.Parse("2006-01-02", req.JoiningDate)
	if err != nil {
		return Response{}, common.NewBadRequestError("INVALID_DATE", "joiningDate must be YYYY-MM-DD")
	}
	var created sqlc.Trainer
	err = pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		code, err := common.NextTrainerCode(ctx, tx)
		if err != nil {
			return err
		}
		t, err := s.q.WithTx(tx).InsertTrainer(ctx, sqlc.InsertTrainerParams{
			TrainerCode:    code,
			FirstName:      req.FirstName,
			LastName:       req.LastName,
			Phone:          req.Phone,
			Email:          req.Email,
			Specialization: req.Specialization,
			JoiningDate:    common.PgDate(joining),
			Status:         sqlc.TrainerStatusACTIVE,
		})
		if err != nil {
			return err
		}
		created = t
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID: actor, Action: common.AuditCreate, EntityType: common.EntityTrainer,
			EntityID: common.UUIDFromPg(t.ID).String(), EntityName: t.FirstName + " " + t.LastName,
			Description: fmt.Sprintf("Created trainer %s", t.TrainerCode),
		})
	})
	if err != nil {
		return Response{}, err
	}
	return toResponse(created), nil
}

func (s *Service) Update(ctx context.Context, actor uuid.UUID, id uuid.UUID, req UpdateRequest) (Response, error) {
	params := sqlc.UpdateTrainerParams{
		ID:             common.PgUUID(id),
		FirstName:      req.FirstName,
		LastName:       req.LastName,
		Phone:          req.Phone,
		Email:          req.Email,
		Specialization: req.Specialization,
	}
	if req.Status != nil {
		st := sqlc.TrainerStatus(*req.Status)
		params.Status = &st
	}
	var updated sqlc.Trainer
	err := pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		t, err := s.q.WithTx(tx).UpdateTrainer(ctx, params)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return common.NewNotFoundError("TRAINER_NOT_FOUND", "Trainer not found.")
			}
			return err
		}
		updated = t
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID: actor, Action: common.AuditUpdate, EntityType: common.EntityTrainer,
			EntityID: common.UUIDFromPg(t.ID).String(), EntityName: t.FirstName + " " + t.LastName,
			Description: "Updated trainer",
		})
	})
	if err != nil {
		return Response{}, err
	}
	return toResponse(updated), nil
}

func (s *Service) Delete(ctx context.Context, actor uuid.UUID, id uuid.UUID) error {
	return pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		existing, err := s.q.WithTx(tx).GetTrainerByID(ctx, common.PgUUID(id))
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return common.NewNotFoundError("TRAINER_NOT_FOUND", "Trainer not found.")
			}
			return err
		}
		if err := s.q.WithTx(tx).DeleteTrainer(ctx, common.PgUUID(id)); err != nil {
			if common.IsForeignKeyViolation(err) {
				return common.NewConflictError("TRAINER_REFERENCED",
					"This trainer has active assignments and cannot be deleted.")
			}
			return err
		}
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID: actor, Action: common.AuditDelete, EntityType: common.EntityTrainer,
			EntityID: id.String(), EntityName: existing.FirstName + " " + existing.LastName,
			Description: fmt.Sprintf("Deleted trainer %s", existing.TrainerCode),
		})
	})
}

// Assign ends any active assignment for the member and creates a new one.
func (s *Service) Assign(ctx context.Context, actor uuid.UUID, memberID, trainerID uuid.UUID) (AssignmentResponse, error) {
	var out sqlc.MemberTrainerAssignment
	err := pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		existing, err := s.q.WithTx(tx).GetActiveAssignmentForMember(ctx, common.PgUUID(memberID))
		if err == nil {
			if err := s.q.WithTx(tx).EndAssignment(ctx, existing.ID); err != nil {
				return err
			}
		} else if !errors.Is(err, pgx.ErrNoRows) {
			return err
		}
		a, err := s.q.WithTx(tx).InsertAssignment(ctx, sqlc.InsertAssignmentParams{
			MemberID: common.PgUUID(memberID), TrainerID: common.PgUUID(trainerID),
		})
		if err != nil {
			if common.IsForeignKeyViolation(err) {
				return common.NewBadRequestError("INVALID_REFERENCE", "Member or trainer not found.")
			}
			return err
		}
		out = a
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID: actor, Action: common.AuditCreate, EntityType: common.EntityTrainer,
			EntityID:    trainerID.String(),
			Description: fmt.Sprintf("Assigned trainer to member %s", memberID),
		})
	})
	if err != nil {
		return AssignmentResponse{}, err
	}
	return assignmentResponse(out), nil
}

func (s *Service) GetAssignmentForMember(ctx context.Context, memberID uuid.UUID) (AssignmentResponse, error) {
	row, err := s.q.GetActiveAssignmentForMember(ctx, common.PgUUID(memberID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return AssignmentResponse{}, common.NewNotFoundError("ASSIGNMENT_NOT_FOUND", "No active trainer assignment for this member.")
		}
		return AssignmentResponse{}, err
	}
	return assignmentResponse(row), nil
}

func (s *Service) EndAssignment(ctx context.Context, actor uuid.UUID, memberID uuid.UUID) error {
	return pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		existing, err := s.q.WithTx(tx).GetActiveAssignmentForMember(ctx, common.PgUUID(memberID))
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return common.NewNotFoundError("ASSIGNMENT_NOT_FOUND", "No active trainer assignment for this member.")
			}
			return err
		}
		if err := s.q.WithTx(tx).EndAssignment(ctx, existing.ID); err != nil {
			return err
		}
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID: actor, Action: common.AuditDelete, EntityType: common.EntityTrainer,
			EntityID:    common.UUIDFromPg(existing.TrainerID).String(),
			Description: fmt.Sprintf("Ended trainer assignment for member %s", memberID),
		})
	})
}

func toResponse(t sqlc.Trainer) Response {
	return Response{
		ID:             common.UUIDFromPg(t.ID),
		TrainerCode:    t.TrainerCode,
		FirstName:      t.FirstName,
		LastName:       t.LastName,
		Phone:          t.Phone,
		Email:          t.Email,
		Specialization: t.Specialization,
		JoiningDate:    common.DateFromPg(t.JoiningDate).Format("2006-01-02"),
		Status:         string(t.Status),
		CreatedAt:      common.TimeFromPg(t.CreatedAt),
	}
}

func assignmentResponse(a sqlc.MemberTrainerAssignment) AssignmentResponse {
	resp := AssignmentResponse{
		ID:        common.UUIDFromPg(a.ID),
		MemberID:  common.UUIDFromPg(a.MemberID),
		TrainerID: common.UUIDFromPg(a.TrainerID),
		StartDate: common.DateFromPg(a.StartDate).Format("2006-01-02"),
		Status:    string(a.Status),
		CreatedAt: common.TimeFromPg(a.CreatedAt),
	}
	if a.EndDate.Valid {
		s := a.EndDate.Time.Format("2006-01-02")
		resp.EndDate = &s
	}
	return resp
}

// --- Handler ---

type Handler struct{ svc *Service }

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

func (h *Handler) Mount(r chi.Router) {
	r.With(appmw.RequirePermission(common.PermTrainersView)).Get("/trainers", h.list)
	r.With(appmw.RequirePermission(common.PermTrainersView)).Get("/trainers/{id}", h.get)
	r.With(appmw.RequirePermission(common.PermTrainersCreate)).Post("/trainers", h.create)
	r.With(appmw.RequirePermission(common.PermTrainersEdit)).Patch("/trainers/{id}", h.update)
	r.With(appmw.RequirePermission(common.PermTrainersDelete)).Delete("/trainers/{id}", h.delete)

	// Member → trainer assignment
	r.With(appmw.RequirePermission(common.PermMembersView)).Get("/members/{memberId}/trainer", h.getAssignment)
	r.With(appmw.RequirePermission(common.PermMembersEdit)).Post("/members/{memberId}/trainer", h.assign)
	r.With(appmw.RequirePermission(common.PermMembersEdit)).Delete("/members/{memberId}/trainer", h.endAssignment)
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	q := common.ParsePageQuery(r)
	var f ListFilter
	if s := r.URL.Query().Get("status"); s != "" {
		f.Status = &s
	}
	page, err := h.svc.List(r.Context(), q, f)
	if err != nil {
		render.Error(w, r, err)
		return
	}
	render.JSON(w, http.StatusOK, page)
}

func (h *Handler) get(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_UUID", "Invalid id."))
		return
	}
	resp, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		render.Error(w, r, err)
		return
	}
	render.JSON(w, http.StatusOK, resp)
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	var req CreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_JSON", "Invalid JSON."))
		return
	}
	if err := common.Validator().Struct(req); err != nil {
		render.Error(w, r, err)
		return
	}
	resp, err := h.svc.Create(r.Context(), appmw.ActorID(r.Context()), req)
	if err != nil {
		render.Error(w, r, err)
		return
	}
	render.JSON(w, http.StatusCreated, resp)
}

func (h *Handler) update(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_UUID", "Invalid id."))
		return
	}
	var req UpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_JSON", "Invalid JSON."))
		return
	}
	if err := common.Validator().Struct(req); err != nil {
		render.Error(w, r, err)
		return
	}
	resp, err := h.svc.Update(r.Context(), appmw.ActorID(r.Context()), id, req)
	if err != nil {
		render.Error(w, r, err)
		return
	}
	render.JSON(w, http.StatusOK, resp)
}

func (h *Handler) delete(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_UUID", "Invalid id."))
		return
	}
	if err := h.svc.Delete(r.Context(), appmw.ActorID(r.Context()), id); err != nil {
		render.Error(w, r, err)
		return
	}
	render.NoContent(w)
}

func (h *Handler) getAssignment(w http.ResponseWriter, r *http.Request) {
	memberID, err := uuid.Parse(chi.URLParam(r, "memberId"))
	if err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_UUID", "Invalid memberId."))
		return
	}
	resp, err := h.svc.GetAssignmentForMember(r.Context(), memberID)
	if err != nil {
		render.Error(w, r, err)
		return
	}
	render.JSON(w, http.StatusOK, resp)
}

type assignRequest struct {
	TrainerID uuid.UUID `json:"trainerId" validate:"required"`
}

func (h *Handler) assign(w http.ResponseWriter, r *http.Request) {
	memberID, err := uuid.Parse(chi.URLParam(r, "memberId"))
	if err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_UUID", "Invalid memberId."))
		return
	}
	var req assignRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_JSON", "Invalid JSON."))
		return
	}
	if err := common.Validator().Struct(req); err != nil {
		render.Error(w, r, err)
		return
	}
	resp, err := h.svc.Assign(r.Context(), appmw.ActorID(r.Context()), memberID, req.TrainerID)
	if err != nil {
		render.Error(w, r, err)
		return
	}
	render.JSON(w, http.StatusCreated, resp)
}

func (h *Handler) endAssignment(w http.ResponseWriter, r *http.Request) {
	memberID, err := uuid.Parse(chi.URLParam(r, "memberId"))
	if err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_UUID", "Invalid memberId."))
		return
	}
	if err := h.svc.EndAssignment(r.Context(), appmw.ActorID(r.Context()), memberID); err != nil {
		render.Error(w, r, err)
		return
	}
	render.NoContent(w)
}
