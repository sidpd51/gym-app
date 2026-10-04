package lead

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
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/sidpd51/gym-backend/internal/common"
	"github.com/sidpd51/gym-backend/internal/common/render"
	"github.com/sidpd51/gym-backend/internal/db/sqlc"
	appmw "github.com/sidpd51/gym-backend/internal/middleware"
)

type CreateRequest struct {
	Name             string     `json:"name"              validate:"required,min=1,max=100"`
	Phone            string     `json:"phone"             validate:"required,max=20"`
	Email            *string    `json:"email"             validate:"omitempty,email,max=255"`
	Source           *string    `json:"source"            validate:"omitempty,oneof=WALK_IN PHONE WEBSITE REFERRAL SOCIAL_MEDIA OTHER"`
	InterestedPlanID *uuid.UUID `json:"interestedPlanId"`
	Notes            *string    `json:"notes"`
	NextFollowUpDate *string    `json:"nextFollowUpDate"  validate:"omitempty,datetime=2006-01-02"`
}

type UpdateRequest struct {
	Name             *string    `json:"name"              validate:"omitempty,min=1,max=100"`
	Phone            *string    `json:"phone"             validate:"omitempty,max=20"`
	Email            *string    `json:"email"             validate:"omitempty,email,max=255"`
	Source           *string    `json:"source"            validate:"omitempty,oneof=WALK_IN PHONE WEBSITE REFERRAL SOCIAL_MEDIA OTHER"`
	InterestedPlanID *uuid.UUID `json:"interestedPlanId"`
	Status           *string    `json:"status"            validate:"omitempty,oneof=NEW CONTACTED INTERESTED FOLLOW_UP CONVERTED LOST"`
	Notes            *string    `json:"notes"`
	LastFollowUpDate *string    `json:"lastFollowUpDate"  validate:"omitempty,datetime=2006-01-02"`
	NextFollowUpDate *string    `json:"nextFollowUpDate"  validate:"omitempty,datetime=2006-01-02"`
}

type ConvertRequest struct {
	// Additional fields required to create the member record from the lead.
	FirstName   string `json:"firstName"   validate:"required,min=1,max=50"`
	LastName    string `json:"lastName"    validate:"required,min=1,max=50"`
	JoiningDate string `json:"joiningDate" validate:"required,datetime=2006-01-02"`
	Phone       string `json:"phone"       validate:"required,len=10,numeric"`
}

type Response struct {
	ID                uuid.UUID  `json:"id"`
	LeadCode          string     `json:"leadCode"`
	Name              string     `json:"name"`
	Phone             string     `json:"phone"`
	Email             *string    `json:"email"`
	Source            *string    `json:"source"`
	InterestedPlanID  *uuid.UUID `json:"interestedPlanId"`
	Status            string     `json:"status"`
	Notes             *string    `json:"notes"`
	LastFollowUpDate  *string    `json:"lastFollowUpDate"`
	NextFollowUpDate  *string    `json:"nextFollowUpDate"`
	ConvertedMemberID *uuid.UUID `json:"convertedMemberId"`
	CreatedAt         time.Time  `json:"createdAt"`
}

type Service struct {
	pool *pgxpool.Pool
	q    *sqlc.Queries
}

func NewService(pool *pgxpool.Pool) *Service { return &Service{pool: pool, q: sqlc.New(pool)} }

func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (Response, error) {
	row, err := s.q.GetLeadByID(ctx, common.PgUUID(id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Response{}, common.NewNotFoundError("LEAD_NOT_FOUND", "Lead not found.")
		}
		return Response{}, err
	}
	return toResponse(row), nil
}

type ListFilter struct {
	Status *string
}

func (s *Service) List(ctx context.Context, q common.PageQuery, f ListFilter) (common.PageResponse[Response], error) {
	var statusParam *sqlc.LeadStatus
	if f.Status != nil {
		st := sqlc.LeadStatus(*f.Status)
		statusParam = &st
	}
	rows, err := s.q.ListLeads(ctx, sqlc.ListLeadsParams{Limit: int32(q.Limit()), Offset: int32(q.Offset()), Status: statusParam})
	if err != nil {
		return common.PageResponse[Response]{}, err
	}
	total, err := s.q.CountLeads(ctx, statusParam)
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
	var sourceParam *sqlc.LeadSource
	if req.Source != nil {
		src := sqlc.LeadSource(*req.Source)
		sourceParam = &src
	}
	var planID pgtype.UUID
	if req.InterestedPlanID != nil {
		planID = common.PgUUID(*req.InterestedPlanID)
	}
	var nextFollowUp pgtype.Date
	if req.NextFollowUpDate != nil {
		t, err := time.Parse("2006-01-02", *req.NextFollowUpDate)
		if err != nil {
			return Response{}, common.NewBadRequestError("INVALID_DATE", "nextFollowUpDate must be YYYY-MM-DD")
		}
		nextFollowUp = common.PgDate(t)
	}

	var created sqlc.Lead
	err := pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		code, err := common.NextLeadCode(ctx, tx)
		if err != nil {
			return err
		}
		l, err := s.q.WithTx(tx).InsertLead(ctx, sqlc.InsertLeadParams{
			LeadCode:          code,
			Name:              req.Name,
			Phone:             req.Phone,
			Email:             req.Email,
			Source:            sourceParam,
			InterestedPlanID:  planID,
			Status:            sqlc.LeadStatusNEW,
			Notes:             req.Notes,
			NextFollowUpDate:  nextFollowUp,
		})
		if err != nil {
			return err
		}
		created = l
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID: actor, Action: common.AuditCreate, EntityType: common.EntityLead,
			EntityID: common.UUIDFromPg(l.ID).String(), EntityName: l.Name,
			Description: fmt.Sprintf("Created lead %s", l.LeadCode),
		})
	})
	if err != nil {
		return Response{}, err
	}
	return toResponse(created), nil
}

func (s *Service) Update(ctx context.Context, actor uuid.UUID, id uuid.UUID, req UpdateRequest) (Response, error) {
	params := sqlc.UpdateLeadParams{
		ID:    common.PgUUID(id),
		Name:  req.Name,
		Phone: req.Phone,
		Email: req.Email,
		Notes: req.Notes,
	}
	if req.Source != nil {
		s := sqlc.LeadSource(*req.Source)
		params.Source = &s
	}
	if req.Status != nil {
		s := sqlc.LeadStatus(*req.Status)
		params.Status = &s
	}
	if req.InterestedPlanID != nil {
		params.InterestedPlanID = common.PgUUID(*req.InterestedPlanID)
	}
	if req.LastFollowUpDate != nil {
		t, err := time.Parse("2006-01-02", *req.LastFollowUpDate)
		if err != nil {
			return Response{}, common.NewBadRequestError("INVALID_DATE", "lastFollowUpDate must be YYYY-MM-DD")
		}
		params.LastFollowUpDate = common.PgDate(t)
	}
	if req.NextFollowUpDate != nil {
		t, err := time.Parse("2006-01-02", *req.NextFollowUpDate)
		if err != nil {
			return Response{}, common.NewBadRequestError("INVALID_DATE", "nextFollowUpDate must be YYYY-MM-DD")
		}
		params.NextFollowUpDate = common.PgDate(t)
	}

	var out sqlc.Lead
	err := pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		l, err := s.q.WithTx(tx).UpdateLead(ctx, params)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return common.NewNotFoundError("LEAD_NOT_FOUND", "Lead not found.")
			}
			return err
		}
		out = l
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID: actor, Action: common.AuditUpdate, EntityType: common.EntityLead,
			EntityID: common.UUIDFromPg(l.ID).String(), EntityName: l.Name,
			Description: "Updated lead",
		})
	})
	if err != nil {
		return Response{}, err
	}
	return toResponse(out), nil
}

func (s *Service) Delete(ctx context.Context, actor uuid.UUID, id uuid.UUID) error {
	return pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		existing, err := s.q.WithTx(tx).GetLeadByID(ctx, common.PgUUID(id))
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return common.NewNotFoundError("LEAD_NOT_FOUND", "Lead not found.")
			}
			return err
		}
		if err := s.q.WithTx(tx).DeleteLead(ctx, common.PgUUID(id)); err != nil {
			return err
		}
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID: actor, Action: common.AuditDelete, EntityType: common.EntityLead,
			EntityID: id.String(), EntityName: existing.Name,
			Description: fmt.Sprintf("Deleted lead %s", existing.LeadCode),
		})
	})
}

// Convert turns a lead into a member in a single transaction. The lead's
// status becomes CONVERTED and converted_member_id is set to the new member.
func (s *Service) Convert(ctx context.Context, actor uuid.UUID, leadID uuid.UUID, req ConvertRequest) (uuid.UUID, error) {
	joining, err := time.Parse("2006-01-02", req.JoiningDate)
	if err != nil {
		return uuid.Nil, common.NewBadRequestError("INVALID_DATE", "joiningDate must be YYYY-MM-DD")
	}

	var newMemberID uuid.UUID
	err = pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		lead, err := s.q.WithTx(tx).GetLeadByID(ctx, common.PgUUID(leadID))
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return common.NewNotFoundError("LEAD_NOT_FOUND", "Lead not found.")
			}
			return err
		}
		if lead.Status == sqlc.LeadStatusCONVERTED {
			return common.NewConflictError("LEAD_ALREADY_CONVERTED", "This lead has already been converted.")
		}
		code, err := common.NextMemberCode(ctx, tx)
		if err != nil {
			return err
		}
		member, err := s.q.WithTx(tx).InsertMember(ctx, sqlc.InsertMemberParams{
			MemberCode:  code,
			FirstName:   req.FirstName,
			LastName:    req.LastName,
			Phone:       req.Phone,
			Email:       lead.Email,
			Status:      sqlc.MemberStatusACTIVE,
			JoiningDate: common.PgDate(joining),
		})
		if err != nil {
			if common.IsUniqueViolation(err) {
				return common.NewConflictError("MEMBER_PHONE_DUPLICATE",
					"A member with this phone number already exists.")
			}
			return err
		}
		newMemberID = common.UUIDFromPg(member.ID)
		if err := s.q.WithTx(tx).MarkLeadConverted(ctx, sqlc.MarkLeadConvertedParams{
			ID:                common.PgUUID(leadID),
			ConvertedMemberID: common.PgUUID(newMemberID),
		}); err != nil {
			return err
		}
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID: actor, Action: common.AuditUpdate, EntityType: common.EntityLead,
			EntityID: leadID.String(), EntityName: lead.Name,
			Description: fmt.Sprintf("Converted lead %s to member %s", lead.LeadCode, member.MemberCode),
		})
	})
	return newMemberID, err
}

func toResponse(l sqlc.Lead) Response {
	resp := Response{
		ID:        common.UUIDFromPg(l.ID),
		LeadCode:  l.LeadCode,
		Name:      l.Name,
		Phone:     l.Phone,
		Email:     l.Email,
		Status:    string(l.Status),
		Notes:     l.Notes,
		CreatedAt: common.TimeFromPg(l.CreatedAt),
	}
	if l.Source != nil {
		s := string(*l.Source)
		resp.Source = &s
	}
	if l.InterestedPlanID.Valid {
		p := common.UUIDFromPg(l.InterestedPlanID)
		resp.InterestedPlanID = &p
	}
	if l.LastFollowUpDate.Valid {
		s := l.LastFollowUpDate.Time.Format("2006-01-02")
		resp.LastFollowUpDate = &s
	}
	if l.NextFollowUpDate.Valid {
		s := l.NextFollowUpDate.Time.Format("2006-01-02")
		resp.NextFollowUpDate = &s
	}
	if l.ConvertedMemberID.Valid {
		m := common.UUIDFromPg(l.ConvertedMemberID)
		resp.ConvertedMemberID = &m
	}
	return resp
}

// --- Handler ---

type Handler struct{ svc *Service }

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

func (h *Handler) Mount(r chi.Router) {
	r.With(appmw.RequirePermission(common.PermLeadsView)).Get("/leads", h.list)
	r.With(appmw.RequirePermission(common.PermLeadsView)).Get("/leads/{id}", h.get)
	r.With(appmw.RequirePermission(common.PermLeadsCreate)).Post("/leads", h.create)
	r.With(appmw.RequirePermission(common.PermLeadsEdit)).Patch("/leads/{id}", h.update)
	r.With(appmw.RequirePermission(common.PermLeadsDelete)).Delete("/leads/{id}", h.delete)
	r.With(appmw.RequirePermission(common.PermLeadsEdit)).Post("/leads/{id}/convert", h.convert)
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

func (h *Handler) convert(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_UUID", "Invalid id."))
		return
	}
	var req ConvertRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_JSON", "Invalid JSON."))
		return
	}
	if err := common.Validator().Struct(req); err != nil {
		render.Error(w, r, err)
		return
	}
	memberID, err := h.svc.Convert(r.Context(), appmw.ActorID(r.Context()), id, req)
	if err != nil {
		render.Error(w, r, err)
		return
	}
	render.JSON(w, http.StatusCreated, map[string]any{"memberId": memberID})
}
