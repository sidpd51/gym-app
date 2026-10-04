package payment

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
	"github.com/shopspring/decimal"

	"github.com/sidpd51/gym-backend/internal/common"
	"github.com/sidpd51/gym-backend/internal/common/render"
	"github.com/sidpd51/gym-backend/internal/db/sqlc"
	appmw "github.com/sidpd51/gym-backend/internal/middleware"
)

type CreateRequest struct {
	MemberID      uuid.UUID        `json:"memberId"      validate:"required"`
	MembershipID  *uuid.UUID       `json:"membershipId"`
	Amount        decimal.Decimal  `json:"amount"        validate:"required"`
	PaymentMethod string           `json:"paymentMethod" validate:"required,oneof=CASH UPI CARD BANK_TRANSFER"`
	PaymentDate   string           `json:"paymentDate"   validate:"required,datetime=2006-01-02"`
	Status        *string          `json:"status"        validate:"omitempty,oneof=COMPLETED PENDING REFUNDED"`
	Reference     *string          `json:"reference"     validate:"omitempty,max=100"`
	Notes         *string          `json:"notes"`
}

type Response struct {
	ID            uuid.UUID       `json:"id"`
	MemberID      uuid.UUID       `json:"memberId"`
	MembershipID  *uuid.UUID      `json:"membershipId"`
	Amount        decimal.Decimal `json:"amount"`
	PaymentMethod string          `json:"paymentMethod"`
	PaymentDate   string          `json:"paymentDate"`
	Status        string          `json:"status"`
	Reference     *string         `json:"reference"`
	Notes         *string         `json:"notes"`
	CreatedAt     time.Time       `json:"createdAt"`
}

type Service struct {
	pool *pgxpool.Pool
	q    *sqlc.Queries
}

func NewService(pool *pgxpool.Pool) *Service { return &Service{pool: pool, q: sqlc.New(pool)} }

func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (Response, error) {
	row, err := s.q.GetPaymentByID(ctx, common.PgUUID(id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Response{}, common.NewNotFoundError("PAYMENT_NOT_FOUND", "Payment not found.")
		}
		return Response{}, err
	}
	return toResponse(row), nil
}

type ListFilter struct {
	Status   *string
	MemberID *uuid.UUID
	From     *string
	To       *string
}

func (s *Service) List(ctx context.Context, q common.PageQuery, f ListFilter) (common.PageResponse[Response], error) {
	var statusParam *sqlc.PaymentStatus
	if f.Status != nil {
		st := sqlc.PaymentStatus(*f.Status)
		statusParam = &st
	}
	memberParam := pgtype.UUID{}
	if f.MemberID != nil {
		memberParam = common.PgUUID(*f.MemberID)
	}
	fromParam, toParam := pgtype.Date{}, pgtype.Date{}
	if f.From != nil {
		t, err := time.Parse("2006-01-02", *f.From)
		if err != nil {
			return common.PageResponse[Response]{}, common.NewBadRequestError("INVALID_DATE", "fromDate must be YYYY-MM-DD")
		}
		fromParam = common.PgDate(t)
	}
	if f.To != nil {
		t, err := time.Parse("2006-01-02", *f.To)
		if err != nil {
			return common.PageResponse[Response]{}, common.NewBadRequestError("INVALID_DATE", "toDate must be YYYY-MM-DD")
		}
		toParam = common.PgDate(t)
	}
	rows, err := s.q.ListPayments(ctx, sqlc.ListPaymentsParams{
		Limit:    int32(q.Limit()), Offset: int32(q.Offset()),
		Status:   statusParam, MemberID: memberParam, FromDate: fromParam, ToDate: toParam,
	})
	if err != nil {
		return common.PageResponse[Response]{}, err
	}
	total, err := s.q.CountPayments(ctx, sqlc.CountPaymentsParams{
		Status: statusParam, MemberID: memberParam, FromDate: fromParam, ToDate: toParam,
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
	if !req.Amount.IsPositive() {
		return Response{}, common.NewBadRequestError("INVALID_AMOUNT", "Amount must be greater than zero.")
	}
	pd, err := time.Parse("2006-01-02", req.PaymentDate)
	if err != nil {
		return Response{}, common.NewBadRequestError("INVALID_DATE", "paymentDate must be YYYY-MM-DD")
	}
	status := sqlc.PaymentStatusCOMPLETED
	if req.Status != nil {
		status = sqlc.PaymentStatus(*req.Status)
	}
	var membership pgtype.UUID
	if req.MembershipID != nil {
		membership = common.PgUUID(*req.MembershipID)
	}

	var created sqlc.Payment
	err = pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		p, err := s.q.WithTx(tx).InsertPayment(ctx, sqlc.InsertPaymentParams{
			MemberID:      common.PgUUID(req.MemberID),
			MembershipID:  membership,
			Amount:        req.Amount,
			PaymentMethod: sqlc.PaymentMethod(req.PaymentMethod),
			PaymentDate:   common.PgDate(pd),
			Status:        status,
			Reference:     req.Reference,
			Notes:         req.Notes,
		})
		if err != nil {
			if common.IsForeignKeyViolation(err) {
				return common.NewBadRequestError("INVALID_REFERENCE", "Member or membership not found.")
			}
			return err
		}
		created = p
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID:      actor,
			Action:      common.AuditCreate,
			EntityType:  common.EntityPayment,
			EntityID:    common.UUIDFromPg(p.ID).String(),
			Description: fmt.Sprintf("Payment %s %s", req.Amount.String(), req.PaymentMethod),
		})
	})
	if err != nil {
		return Response{}, err
	}
	return toResponse(created), nil
}

func toResponse(p sqlc.Payment) Response {
	resp := Response{
		ID:            common.UUIDFromPg(p.ID),
		MemberID:      common.UUIDFromPg(p.MemberID),
		Amount:        p.Amount,
		PaymentMethod: string(p.PaymentMethod),
		PaymentDate:   common.DateFromPg(p.PaymentDate).Format("2006-01-02"),
		Status:        string(p.Status),
		Reference:     p.Reference,
		Notes:         p.Notes,
		CreatedAt:     common.TimeFromPg(p.CreatedAt),
	}
	if p.MembershipID.Valid {
		mid := common.UUIDFromPg(p.MembershipID)
		resp.MembershipID = &mid
	}
	return resp
}

// --- Handler ----------------------------------------------------------------

type Handler struct{ svc *Service }

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

func (h *Handler) Mount(r chi.Router) {
	r.With(appmw.RequirePermission(common.PermPaymentsView)).Get("/payments", h.list)
	r.With(appmw.RequirePermission(common.PermPaymentsView)).Get("/payments/{id}", h.get)
	r.With(appmw.RequirePermission(common.PermPaymentsRecord)).Post("/payments", h.create)
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	q := common.ParsePageQuery(r)
	var f ListFilter
	if s := r.URL.Query().Get("status"); s != "" {
		f.Status = &s
	}
	if m := r.URL.Query().Get("memberId"); m != "" {
		mid, err := uuid.Parse(m)
		if err != nil {
			render.Error(w, r, common.NewBadRequestError("INVALID_UUID", "Invalid memberId."))
			return
		}
		f.MemberID = &mid
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
