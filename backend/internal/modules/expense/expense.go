package expense

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

type CategoryRequest struct {
	Name        string  `json:"name"        validate:"required,min=1,max=100"`
	Description *string `json:"description"`
	Status      *string `json:"status"      validate:"omitempty,oneof=ACTIVE INACTIVE"`
}

type CategoryResponse struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Description *string   `json:"description"`
	Status      string    `json:"status"`
}

type ExpenseRequest struct {
	CategoryID    uuid.UUID       `json:"categoryId"    validate:"required"`
	Description   string          `json:"description"   validate:"required"`
	Amount        decimal.Decimal `json:"amount"        validate:"required"`
	ExpenseDate   string          `json:"expenseDate"   validate:"required,datetime=2006-01-02"`
	PaymentMethod string          `json:"paymentMethod" validate:"required,oneof=CASH UPI CARD BANK_TRANSFER"`
	Vendor        *string         `json:"vendor"        validate:"omitempty,max=100"`
	Notes         *string         `json:"notes"`
}

type ExpenseUpdateRequest struct {
	CategoryID    *uuid.UUID       `json:"categoryId"`
	Description   *string          `json:"description"`
	Amount        *decimal.Decimal `json:"amount"`
	ExpenseDate   *string          `json:"expenseDate"   validate:"omitempty,datetime=2006-01-02"`
	PaymentMethod *string          `json:"paymentMethod" validate:"omitempty,oneof=CASH UPI CARD BANK_TRANSFER"`
	Vendor        *string          `json:"vendor"`
	Notes         *string          `json:"notes"`
}

type ExpenseResponse struct {
	ID            uuid.UUID       `json:"id"`
	ExpenseCode   string          `json:"expenseCode"`
	CategoryID    uuid.UUID       `json:"categoryId"`
	Description   string          `json:"description"`
	Amount        decimal.Decimal `json:"amount"`
	ExpenseDate   string          `json:"expenseDate"`
	PaymentMethod string          `json:"paymentMethod"`
	Vendor        *string         `json:"vendor"`
	Notes         *string         `json:"notes"`
	CreatedAt     time.Time       `json:"createdAt"`
}

type Service struct {
	pool *pgxpool.Pool
	q    *sqlc.Queries
}

func NewService(pool *pgxpool.Pool) *Service { return &Service{pool: pool, q: sqlc.New(pool)} }

// --- categories ---

func (s *Service) ListCategories(ctx context.Context) ([]CategoryResponse, error) {
	rows, err := s.q.ListExpenseCategories(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]CategoryResponse, 0, len(rows))
	for _, r := range rows {
		out = append(out, catResponse(r))
	}
	return out, nil
}

func (s *Service) CreateCategory(ctx context.Context, actor uuid.UUID, req CategoryRequest) (CategoryResponse, error) {
	status := sqlc.CategoryStatusACTIVE
	if req.Status != nil {
		status = sqlc.CategoryStatus(*req.Status)
	}
	var out sqlc.ExpenseCategory
	err := pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		c, err := s.q.WithTx(tx).InsertExpenseCategory(ctx, sqlc.InsertExpenseCategoryParams{
			Name: req.Name, Description: req.Description, Status: status,
		})
		if err != nil {
			return err
		}
		out = c
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID: actor, Action: common.AuditCreate, EntityType: common.EntityExpense,
			EntityID: common.UUIDFromPg(c.ID).String(), EntityName: c.Name,
			Description: "Created expense category",
		})
	})
	if err != nil {
		return CategoryResponse{}, err
	}
	return catResponse(out), nil
}

func (s *Service) UpdateCategory(ctx context.Context, actor uuid.UUID, id uuid.UUID, req CategoryRequest) (CategoryResponse, error) {
	params := sqlc.UpdateExpenseCategoryParams{
		ID: common.PgUUID(id), Description: req.Description,
	}
	if req.Name != "" {
		n := req.Name
		params.Name = &n
	}
	if req.Status != nil {
		st := sqlc.CategoryStatus(*req.Status)
		params.Status = &st
	}
	var out sqlc.ExpenseCategory
	err := pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		c, err := s.q.WithTx(tx).UpdateExpenseCategory(ctx, params)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return common.NewNotFoundError("CATEGORY_NOT_FOUND", "Category not found.")
			}
			return err
		}
		out = c
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID: actor, Action: common.AuditUpdate, EntityType: common.EntityExpense,
			EntityID: common.UUIDFromPg(c.ID).String(), EntityName: c.Name,
			Description: "Updated expense category",
		})
	})
	if err != nil {
		return CategoryResponse{}, err
	}
	return catResponse(out), nil
}

func (s *Service) DeleteCategory(ctx context.Context, actor uuid.UUID, id uuid.UUID) error {
	return pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.q.WithTx(tx).DeleteExpenseCategory(ctx, common.PgUUID(id)); err != nil {
			if common.IsForeignKeyViolation(err) {
				return common.NewConflictError("CATEGORY_REFERENCED",
					"This category has expenses and cannot be deleted.")
			}
			return err
		}
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID: actor, Action: common.AuditDelete, EntityType: common.EntityExpense,
			EntityID: id.String(), Description: "Deleted expense category",
		})
	})
}

// --- expenses ---

func (s *Service) GetExpense(ctx context.Context, id uuid.UUID) (ExpenseResponse, error) {
	row, err := s.q.GetExpenseByID(ctx, common.PgUUID(id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ExpenseResponse{}, common.NewNotFoundError("EXPENSE_NOT_FOUND", "Expense not found.")
		}
		return ExpenseResponse{}, err
	}
	return expResponse(row), nil
}

type ListFilter struct {
	CategoryID *uuid.UUID
	From, To   *string
}

func (s *Service) ListExpenses(ctx context.Context, q common.PageQuery, f ListFilter) (common.PageResponse[ExpenseResponse], error) {
	catParam := pgtype.UUID{}
	if f.CategoryID != nil {
		catParam = common.PgUUID(*f.CategoryID)
	}
	fromParam, toParam := pgtype.Date{}, pgtype.Date{}
	if f.From != nil {
		t, err := time.Parse("2006-01-02", *f.From)
		if err != nil {
			return common.PageResponse[ExpenseResponse]{}, common.NewBadRequestError("INVALID_DATE", "fromDate must be YYYY-MM-DD")
		}
		fromParam = common.PgDate(t)
	}
	if f.To != nil {
		t, err := time.Parse("2006-01-02", *f.To)
		if err != nil {
			return common.PageResponse[ExpenseResponse]{}, common.NewBadRequestError("INVALID_DATE", "toDate must be YYYY-MM-DD")
		}
		toParam = common.PgDate(t)
	}
	rows, err := s.q.ListExpenses(ctx, sqlc.ListExpensesParams{
		Limit: int32(q.Limit()), Offset: int32(q.Offset()),
		CategoryID: catParam, FromDate: fromParam, ToDate: toParam,
	})
	if err != nil {
		return common.PageResponse[ExpenseResponse]{}, err
	}
	total, err := s.q.CountExpenses(ctx, sqlc.CountExpensesParams{
		CategoryID: catParam, FromDate: fromParam, ToDate: toParam,
	})
	if err != nil {
		return common.PageResponse[ExpenseResponse]{}, err
	}
	out := make([]ExpenseResponse, 0, len(rows))
	for _, r := range rows {
		out = append(out, expResponse(r))
	}
	return common.NewPage(out, q.Page, q.PageSize, total), nil
}

func (s *Service) CreateExpense(ctx context.Context, actor uuid.UUID, req ExpenseRequest) (ExpenseResponse, error) {
	if !req.Amount.IsPositive() {
		return ExpenseResponse{}, common.NewBadRequestError("INVALID_AMOUNT", "Amount must be greater than zero.")
	}
	ed, err := time.Parse("2006-01-02", req.ExpenseDate)
	if err != nil {
		return ExpenseResponse{}, common.NewBadRequestError("INVALID_DATE", "expenseDate must be YYYY-MM-DD")
	}
	// Verify category is ACTIVE.
	cat, err := s.q.GetExpenseCategoryByID(ctx, common.PgUUID(req.CategoryID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ExpenseResponse{}, common.NewNotFoundError("CATEGORY_NOT_FOUND", "Expense category not found.")
		}
		return ExpenseResponse{}, err
	}
	if cat.Status != sqlc.CategoryStatusACTIVE {
		return ExpenseResponse{}, common.NewBusinessRuleError("CATEGORY_INACTIVE", "Cannot use an inactive category.")
	}

	var created sqlc.Expense
	err = pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		code, err := common.NextExpenseCode(ctx, tx)
		if err != nil {
			return err
		}
		e, err := s.q.WithTx(tx).InsertExpense(ctx, sqlc.InsertExpenseParams{
			ExpenseCode:   code,
			CategoryID:    common.PgUUID(req.CategoryID),
			Description:   req.Description,
			Amount:        req.Amount,
			ExpenseDate:   common.PgDate(ed),
			PaymentMethod: sqlc.ExpensePaymentMethod(req.PaymentMethod),
			Vendor:        req.Vendor,
			Notes:         req.Notes,
		})
		if err != nil {
			return err
		}
		created = e
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID: actor, Action: common.AuditCreate, EntityType: common.EntityExpense,
			EntityID: common.UUIDFromPg(e.ID).String(),
			Description: fmt.Sprintf("Expense %s %s", req.Amount.String(), req.PaymentMethod),
		})
	})
	if err != nil {
		return ExpenseResponse{}, err
	}
	return expResponse(created), nil
}

func (s *Service) UpdateExpense(ctx context.Context, actor uuid.UUID, id uuid.UUID, req ExpenseUpdateRequest) (ExpenseResponse, error) {
	if req.Amount != nil && !req.Amount.IsPositive() {
		return ExpenseResponse{}, common.NewBadRequestError("INVALID_AMOUNT", "Amount must be greater than zero.")
	}
	params := sqlc.UpdateExpenseParams{
		ID:          common.PgUUID(id),
		Description: req.Description,
		Vendor:      req.Vendor,
		Notes:       req.Notes,
	}
	if req.CategoryID != nil {
		params.CategoryID = common.PgUUID(*req.CategoryID)
	}
	if req.Amount != nil {
		params.Amount = decimal.NullDecimal{Decimal: *req.Amount, Valid: true}
	}
	if req.ExpenseDate != nil {
		t, err := time.Parse("2006-01-02", *req.ExpenseDate)
		if err != nil {
			return ExpenseResponse{}, common.NewBadRequestError("INVALID_DATE", "expenseDate must be YYYY-MM-DD")
		}
		params.ExpenseDate = common.PgDate(t)
	}
	if req.PaymentMethod != nil {
		pm := sqlc.ExpensePaymentMethod(*req.PaymentMethod)
		params.PaymentMethod = &pm
	}
	var out sqlc.Expense
	err := pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		e, err := s.q.WithTx(tx).UpdateExpense(ctx, params)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return common.NewNotFoundError("EXPENSE_NOT_FOUND", "Expense not found.")
			}
			return err
		}
		out = e
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID: actor, Action: common.AuditUpdate, EntityType: common.EntityExpense,
			EntityID: common.UUIDFromPg(e.ID).String(),
			Description: "Updated expense",
		})
	})
	if err != nil {
		return ExpenseResponse{}, err
	}
	return expResponse(out), nil
}

func (s *Service) DeleteExpense(ctx context.Context, actor uuid.UUID, id uuid.UUID) error {
	return pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.q.WithTx(tx).DeleteExpense(ctx, common.PgUUID(id)); err != nil {
			return err
		}
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID: actor, Action: common.AuditDelete, EntityType: common.EntityExpense,
			EntityID: id.String(), Description: "Deleted expense",
		})
	})
}

func catResponse(c sqlc.ExpenseCategory) CategoryResponse {
	return CategoryResponse{
		ID: common.UUIDFromPg(c.ID), Name: c.Name, Description: c.Description, Status: string(c.Status),
	}
}

func expResponse(e sqlc.Expense) ExpenseResponse {
	return ExpenseResponse{
		ID:            common.UUIDFromPg(e.ID),
		ExpenseCode:   e.ExpenseCode,
		CategoryID:    common.UUIDFromPg(e.CategoryID),
		Description:   e.Description,
		Amount:        e.Amount,
		ExpenseDate:   common.DateFromPg(e.ExpenseDate).Format("2006-01-02"),
		PaymentMethod: string(e.PaymentMethod),
		Vendor:        e.Vendor,
		Notes:         e.Notes,
		CreatedAt:     common.TimeFromPg(e.CreatedAt),
	}
}

// --- Handler ---

type Handler struct{ svc *Service }

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

func (h *Handler) Mount(r chi.Router) {
	// Categories
	r.With(appmw.RequirePermission(common.PermExpensesView)).Get("/expense-categories", h.listCat)
	r.With(appmw.RequirePermission(common.PermExpensesCreate)).Post("/expense-categories", h.createCat)
	r.With(appmw.RequirePermission(common.PermExpensesEdit)).Patch("/expense-categories/{id}", h.updateCat)
	r.With(appmw.RequirePermission(common.PermExpensesDelete)).Delete("/expense-categories/{id}", h.deleteCat)
	// Expenses
	r.With(appmw.RequirePermission(common.PermExpensesView)).Get("/expenses", h.list)
	r.With(appmw.RequirePermission(common.PermExpensesView)).Get("/expenses/{id}", h.get)
	r.With(appmw.RequirePermission(common.PermExpensesCreate)).Post("/expenses", h.create)
	r.With(appmw.RequirePermission(common.PermExpensesEdit)).Patch("/expenses/{id}", h.update)
	r.With(appmw.RequirePermission(common.PermExpensesDelete)).Delete("/expenses/{id}", h.delete)
}

func (h *Handler) listCat(w http.ResponseWriter, r *http.Request) {
	out, err := h.svc.ListCategories(r.Context())
	if err != nil {
		render.Error(w, r, err)
		return
	}
	render.JSON(w, http.StatusOK, out)
}

func (h *Handler) createCat(w http.ResponseWriter, r *http.Request) {
	var req CategoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_JSON", "Invalid JSON."))
		return
	}
	if err := common.Validator().Struct(req); err != nil {
		render.Error(w, r, err)
		return
	}
	resp, err := h.svc.CreateCategory(r.Context(), appmw.ActorID(r.Context()), req)
	if err != nil {
		render.Error(w, r, err)
		return
	}
	render.JSON(w, http.StatusCreated, resp)
}

func (h *Handler) updateCat(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_UUID", "Invalid id."))
		return
	}
	var req CategoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_JSON", "Invalid JSON."))
		return
	}
	resp, err := h.svc.UpdateCategory(r.Context(), appmw.ActorID(r.Context()), id, req)
	if err != nil {
		render.Error(w, r, err)
		return
	}
	render.JSON(w, http.StatusOK, resp)
}

func (h *Handler) deleteCat(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_UUID", "Invalid id."))
		return
	}
	if err := h.svc.DeleteCategory(r.Context(), appmw.ActorID(r.Context()), id); err != nil {
		render.Error(w, r, err)
		return
	}
	render.NoContent(w)
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	q := common.ParsePageQuery(r)
	var f ListFilter
	if c := r.URL.Query().Get("categoryId"); c != "" {
		cid, err := uuid.Parse(c)
		if err != nil {
			render.Error(w, r, common.NewBadRequestError("INVALID_UUID", "Invalid categoryId."))
			return
		}
		f.CategoryID = &cid
	}
	if q.FromDate != "" {
		f.From = &q.FromDate
	}
	if q.ToDate != "" {
		f.To = &q.ToDate
	}
	page, err := h.svc.ListExpenses(r.Context(), q, f)
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
	resp, err := h.svc.GetExpense(r.Context(), id)
	if err != nil {
		render.Error(w, r, err)
		return
	}
	render.JSON(w, http.StatusOK, resp)
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	var req ExpenseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_JSON", "Invalid JSON."))
		return
	}
	if err := common.Validator().Struct(req); err != nil {
		render.Error(w, r, err)
		return
	}
	resp, err := h.svc.CreateExpense(r.Context(), appmw.ActorID(r.Context()), req)
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
	var req ExpenseUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_JSON", "Invalid JSON."))
		return
	}
	if err := common.Validator().Struct(req); err != nil {
		render.Error(w, r, err)
		return
	}
	resp, err := h.svc.UpdateExpense(r.Context(), appmw.ActorID(r.Context()), id, req)
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
	if err := h.svc.DeleteExpense(r.Context(), appmw.ActorID(r.Context()), id); err != nil {
		render.Error(w, r, err)
		return
	}
	render.NoContent(w)
}
