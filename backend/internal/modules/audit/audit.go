package audit

import (
	"context"
	"encoding/json"
	"errors"
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

type Response struct {
	ID          uuid.UUID       `json:"id"`
	Timestamp   time.Time       `json:"timestamp"`
	UserID      uuid.UUID       `json:"userId"`
	Action      string          `json:"action"`
	EntityType  string          `json:"entityType"`
	EntityID    *string         `json:"entityId"`
	EntityName  *string         `json:"entityName"`
	Description string          `json:"description"`
	Status      string          `json:"status"`
	Metadata    json.RawMessage `json:"metadata,omitempty"`
}

type Service struct {
	pool *pgxpool.Pool
	q    *sqlc.Queries
}

func NewService(pool *pgxpool.Pool) *Service { return &Service{pool: pool, q: sqlc.New(pool)} }

type Filter struct {
	Action     *string
	EntityType *string
	UserID     *uuid.UUID
	Status     *string
	From, To   *string
}

func (s *Service) List(ctx context.Context, q common.PageQuery, f Filter) (common.PageResponse[Response], error) {
	var actionParam *sqlc.AuditAction
	if f.Action != nil {
		a := sqlc.AuditAction(*f.Action)
		actionParam = &a
	}
	var entityParam *sqlc.AuditEntityType
	if f.EntityType != nil {
		e := sqlc.AuditEntityType(*f.EntityType)
		entityParam = &e
	}
	var statusParam *sqlc.AuditStatus
	if f.Status != nil {
		st := sqlc.AuditStatus(*f.Status)
		statusParam = &st
	}
	userParam := pgtype.UUID{}
	if f.UserID != nil {
		userParam = common.PgUUID(*f.UserID)
	}
	fromParam, toParam := pgtype.Timestamptz{}, pgtype.Timestamptz{}
	if f.From != nil {
		t, err := time.Parse("2006-01-02", *f.From)
		if err != nil {
			return common.PageResponse[Response]{}, common.NewBadRequestError("INVALID_DATE", "from must be YYYY-MM-DD")
		}
		fromParam = common.PgTimestamp(t)
	}
	if f.To != nil {
		t, err := time.Parse("2006-01-02", *f.To)
		if err != nil {
			return common.PageResponse[Response]{}, common.NewBadRequestError("INVALID_DATE", "to must be YYYY-MM-DD")
		}
		toParam = common.PgTimestamp(t.Add(24*time.Hour - time.Second))
	}

	rows, err := s.q.ListAuditLogs(ctx, sqlc.ListAuditLogsParams{
		Limit: int32(q.Limit()), Offset: int32(q.Offset()),
		Action: actionParam, EntityType: entityParam, UserID: userParam, Status: statusParam,
		From: fromParam, To: toParam,
	})
	if err != nil {
		return common.PageResponse[Response]{}, err
	}
	total, err := s.q.CountAuditLogs(ctx, sqlc.CountAuditLogsParams{
		Action: actionParam, EntityType: entityParam, UserID: userParam, Status: statusParam,
		From: fromParam, To: toParam,
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

func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (Response, error) {
	row, err := s.q.GetAuditLogByID(ctx, common.PgUUID(id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Response{}, common.NewNotFoundError("AUDIT_NOT_FOUND", "Audit log not found.")
		}
		return Response{}, err
	}
	return toResponse(row), nil
}

func toResponse(a sqlc.AuditLog) Response {
	return Response{
		ID: common.UUIDFromPg(a.ID), Timestamp: common.TimeFromPg(a.Timestamp),
		UserID: common.UUIDFromPg(a.UserID),
		Action: string(a.Action), EntityType: string(a.EntityType),
		EntityID: a.EntityID, EntityName: a.EntityName, Description: a.Description,
		Status: string(a.Status), Metadata: a.Metadata,
	}
}

// --- Handler ---

type Handler struct{ svc *Service }

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

func (h *Handler) Mount(r chi.Router) {
	r.With(appmw.RequirePermission(common.PermAuditLogsView)).Get("/audit-logs", h.list)
	r.With(appmw.RequirePermission(common.PermAuditLogsView)).Get("/audit-logs/{id}", h.get)
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	q := common.ParsePageQuery(r)
	var f Filter
	qp := r.URL.Query()
	if v := qp.Get("action"); v != "" {
		f.Action = &v
	}
	if v := qp.Get("entityType"); v != "" {
		f.EntityType = &v
	}
	if v := qp.Get("userId"); v != "" {
		uid, err := uuid.Parse(v)
		if err != nil {
			render.Error(w, r, common.NewBadRequestError("INVALID_UUID", "Invalid userId."))
			return
		}
		f.UserID = &uid
	}
	if v := qp.Get("status"); v != "" {
		f.Status = &v
	}
	if q.FromDate != "" {
		f.From = &q.FromDate
	}
	if q.ToDate != "" {
		f.To = &q.ToDate
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
