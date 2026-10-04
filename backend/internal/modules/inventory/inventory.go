package inventory

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

type ItemRequest struct {
	Name         string  `json:"name"         validate:"required,min=1,max=100"`
	CategoryID   uuid.UUID `json:"categoryId" validate:"required"`
	Unit         string  `json:"unit"         validate:"required,max=20"`
	CurrentStock int32   `json:"currentStock" validate:"gte=0"`
	MinimumStock int32   `json:"minimumStock" validate:"gte=0"`
	Description  *string `json:"description"`
}

type ItemUpdate struct {
	Name         *string `json:"name"         validate:"omitempty,min=1,max=100"`
	Unit         *string `json:"unit"         validate:"omitempty,max=20"`
	MinimumStock *int32  `json:"minimumStock" validate:"omitempty,gte=0"`
	Description  *string `json:"description"`
}

type ItemResponse struct {
	ID           uuid.UUID `json:"id"`
	ItemCode     string    `json:"itemCode"`
	Name         string    `json:"name"`
	CategoryID   uuid.UUID `json:"categoryId"`
	Unit         string    `json:"unit"`
	CurrentStock int32     `json:"currentStock"`
	MinimumStock int32     `json:"minimumStock"`
	Status       string    `json:"status"`
	Description  *string   `json:"description"`
	CreatedAt    time.Time `json:"createdAt"`
}

type TransactionRequest struct {
	Type            string  `json:"type"            validate:"required,oneof=STOCK_IN STOCK_OUT ADJUSTMENT"`
	Quantity        int32   `json:"quantity"        validate:"required,gt=0"`
	TransactionDate string  `json:"transactionDate" validate:"required,datetime=2006-01-02"`
	Reference       *string `json:"reference"       validate:"omitempty,max=100"`
	Notes           *string `json:"notes"`
}

type TransactionResponse struct {
	ID              uuid.UUID `json:"id"`
	ItemID          uuid.UUID `json:"itemId"`
	Type            string    `json:"type"`
	Quantity        int32     `json:"quantity"`
	TransactionDate string    `json:"transactionDate"`
	Reference       *string   `json:"reference"`
	Notes           *string   `json:"notes"`
	CreatedAt       time.Time `json:"createdAt"`
}

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

type Service struct {
	pool *pgxpool.Pool
	q    *sqlc.Queries
}

func NewService(pool *pgxpool.Pool) *Service { return &Service{pool: pool, q: sqlc.New(pool)} }

func statusFor(current, minimum int32) sqlc.InventoryStatus {
	switch {
	case current <= 0:
		return sqlc.InventoryStatusOUTOFSTOCK
	case current <= minimum:
		return sqlc.InventoryStatusLOWSTOCK
	default:
		return sqlc.InventoryStatusINSTOCK
	}
}

// --- categories ---

func (s *Service) ListCategories(ctx context.Context) ([]CategoryResponse, error) {
	rows, err := s.q.ListInventoryCategories(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]CategoryResponse, 0, len(rows))
	for _, c := range rows {
		out = append(out, CategoryResponse{
			ID: common.UUIDFromPg(c.ID), Name: c.Name, Description: c.Description, Status: string(c.Status),
		})
	}
	return out, nil
}

func (s *Service) CreateCategory(ctx context.Context, actor uuid.UUID, req CategoryRequest) (CategoryResponse, error) {
	status := sqlc.CategoryStatusACTIVE
	if req.Status != nil {
		status = sqlc.CategoryStatus(*req.Status)
	}
	var out sqlc.InventoryCategory
	err := pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		c, err := s.q.WithTx(tx).InsertInventoryCategory(ctx, sqlc.InsertInventoryCategoryParams{
			Name: req.Name, Description: req.Description, Status: status,
		})
		if err != nil {
			return err
		}
		out = c
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID: actor, Action: common.AuditCreate, EntityType: common.EntityInventoryItem,
			EntityID: common.UUIDFromPg(c.ID).String(), EntityName: c.Name,
			Description: "Created inventory category",
		})
	})
	if err != nil {
		return CategoryResponse{}, err
	}
	return CategoryResponse{ID: common.UUIDFromPg(out.ID), Name: out.Name, Description: out.Description, Status: string(out.Status)}, nil
}

func (s *Service) UpdateCategory(ctx context.Context, actor uuid.UUID, id uuid.UUID, req CategoryRequest) (CategoryResponse, error) {
	params := sqlc.UpdateInventoryCategoryParams{ID: common.PgUUID(id), Description: req.Description}
	if req.Name != "" {
		n := req.Name
		params.Name = &n
	}
	if req.Status != nil {
		st := sqlc.CategoryStatus(*req.Status)
		params.Status = &st
	}
	var out sqlc.InventoryCategory
	err := pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		c, err := s.q.WithTx(tx).UpdateInventoryCategory(ctx, params)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return common.NewNotFoundError("CATEGORY_NOT_FOUND", "Category not found.")
			}
			return err
		}
		out = c
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID: actor, Action: common.AuditUpdate, EntityType: common.EntityInventoryItem,
			EntityID: common.UUIDFromPg(c.ID).String(), EntityName: c.Name,
			Description: "Updated inventory category",
		})
	})
	if err != nil {
		return CategoryResponse{}, err
	}
	return CategoryResponse{ID: common.UUIDFromPg(out.ID), Name: out.Name, Description: out.Description, Status: string(out.Status)}, nil
}

func (s *Service) DeleteCategory(ctx context.Context, actor uuid.UUID, id uuid.UUID) error {
	return pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.q.WithTx(tx).DeleteInventoryCategory(ctx, common.PgUUID(id)); err != nil {
			if common.IsForeignKeyViolation(err) {
				return common.NewConflictError("CATEGORY_REFERENCED", "This category has items and cannot be deleted.")
			}
			return err
		}
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID: actor, Action: common.AuditDelete, EntityType: common.EntityInventoryItem,
			EntityID: id.String(), Description: "Deleted inventory category",
		})
	})
}

// --- items ---

func (s *Service) GetItem(ctx context.Context, id uuid.UUID) (ItemResponse, error) {
	row, err := s.q.GetInventoryItemByID(ctx, common.PgUUID(id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ItemResponse{}, common.NewNotFoundError("ITEM_NOT_FOUND", "Item not found.")
		}
		return ItemResponse{}, err
	}
	return itemResponse(row), nil
}

type ItemFilter struct {
	Status     *string
	CategoryID *uuid.UUID
}

func (s *Service) ListItems(ctx context.Context, q common.PageQuery, f ItemFilter) (common.PageResponse[ItemResponse], error) {
	var statusParam *sqlc.InventoryStatus
	if f.Status != nil {
		st := sqlc.InventoryStatus(*f.Status)
		statusParam = &st
	}
	catParam := pgtype.UUID{}
	if f.CategoryID != nil {
		catParam = common.PgUUID(*f.CategoryID)
	}
	rows, err := s.q.ListInventoryItems(ctx, sqlc.ListInventoryItemsParams{
		Limit: int32(q.Limit()), Offset: int32(q.Offset()), Status: statusParam, CategoryID: catParam,
	})
	if err != nil {
		return common.PageResponse[ItemResponse]{}, err
	}
	total, err := s.q.CountInventoryItems(ctx, sqlc.CountInventoryItemsParams{Status: statusParam, CategoryID: catParam})
	if err != nil {
		return common.PageResponse[ItemResponse]{}, err
	}
	out := make([]ItemResponse, 0, len(rows))
	for _, r := range rows {
		out = append(out, itemResponse(r))
	}
	return common.NewPage(out, q.Page, q.PageSize, total), nil
}

func (s *Service) CreateItem(ctx context.Context, actor uuid.UUID, req ItemRequest) (ItemResponse, error) {
	var out sqlc.InventoryItem
	err := pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		code, err := common.NextInventoryItemCode(ctx, tx)
		if err != nil {
			return err
		}
		it, err := s.q.WithTx(tx).InsertInventoryItem(ctx, sqlc.InsertInventoryItemParams{
			ItemCode:     code,
			Name:         req.Name,
			CategoryID:   common.PgUUID(req.CategoryID),
			Unit:         req.Unit,
			CurrentStock: req.CurrentStock,
			MinimumStock: req.MinimumStock,
			Status:       statusFor(req.CurrentStock, req.MinimumStock),
			Description:  req.Description,
		})
		if err != nil {
			if common.IsForeignKeyViolation(err) {
				return common.NewBadRequestError("INVALID_REFERENCE", "Category not found.")
			}
			return err
		}
		out = it
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID: actor, Action: common.AuditCreate, EntityType: common.EntityInventoryItem,
			EntityID: common.UUIDFromPg(it.ID).String(), EntityName: it.Name,
			Description: fmt.Sprintf("Created item %s", it.ItemCode),
		})
	})
	if err != nil {
		return ItemResponse{}, err
	}
	return itemResponse(out), nil
}

func (s *Service) UpdateItem(ctx context.Context, actor uuid.UUID, id uuid.UUID, req ItemUpdate) (ItemResponse, error) {
	params := sqlc.UpdateInventoryItemParams{
		ID: common.PgUUID(id), Name: req.Name, Unit: req.Unit,
		MinimumStock: req.MinimumStock, Description: req.Description,
	}
	var out sqlc.InventoryItem
	err := pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		it, err := s.q.WithTx(tx).UpdateInventoryItem(ctx, params)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return common.NewNotFoundError("ITEM_NOT_FOUND", "Item not found.")
			}
			return err
		}
		out = it
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID: actor, Action: common.AuditUpdate, EntityType: common.EntityInventoryItem,
			EntityID: common.UUIDFromPg(it.ID).String(), EntityName: it.Name,
			Description: "Updated item",
		})
	})
	if err != nil {
		return ItemResponse{}, err
	}
	return itemResponse(out), nil
}

func (s *Service) DeleteItem(ctx context.Context, actor uuid.UUID, id uuid.UUID) error {
	return pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.q.WithTx(tx).DeleteInventoryItem(ctx, common.PgUUID(id)); err != nil {
			if common.IsForeignKeyViolation(err) {
				return common.NewConflictError("ITEM_REFERENCED", "This item has transactions and cannot be deleted.")
			}
			return err
		}
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID: actor, Action: common.AuditDelete, EntityType: common.EntityInventoryItem,
			EntityID: id.String(), Description: "Deleted item",
		})
	})
}

// --- transactions ---

func (s *Service) ListTransactions(ctx context.Context, itemID uuid.UUID) ([]TransactionResponse, error) {
	rows, err := s.q.ListInventoryTransactions(ctx, common.PgUUID(itemID))
	if err != nil {
		return nil, err
	}
	out := make([]TransactionResponse, 0, len(rows))
	for _, t := range rows {
		out = append(out, txResponse(t))
	}
	return out, nil
}

// RecordTransaction performs stock update + transaction insert atomically.
// SELECT FOR UPDATE serialises concurrent writers.
func (s *Service) RecordTransaction(ctx context.Context, actor uuid.UUID, itemID uuid.UUID, req TransactionRequest) (TransactionResponse, error) {
	td, err := time.Parse("2006-01-02", req.TransactionDate)
	if err != nil {
		return TransactionResponse{}, common.NewBadRequestError("INVALID_DATE", "transactionDate must be YYYY-MM-DD")
	}
	var out sqlc.InventoryTransaction
	err = pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		it, err := s.q.WithTx(tx).GetInventoryItemByIDForUpdate(ctx, common.PgUUID(itemID))
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return common.NewNotFoundError("ITEM_NOT_FOUND", "Item not found.")
			}
			return err
		}
		var newStock int32
		switch req.Type {
		case "STOCK_IN":
			newStock = it.CurrentStock + req.Quantity
		case "STOCK_OUT":
			if it.CurrentStock-req.Quantity < 0 {
				return common.NewBusinessRuleError("INVENTORY_INSUFFICIENT_STOCK",
					"Not enough stock to complete the STOCK_OUT.")
			}
			newStock = it.CurrentStock - req.Quantity
		case "ADJUSTMENT":
			// ADJUSTMENT sets stock to quantity (treats quantity as the new absolute level).
			newStock = req.Quantity
		}
		if err := s.q.WithTx(tx).UpdateInventoryItemStock(ctx, sqlc.UpdateInventoryItemStockParams{
			ID: common.PgUUID(itemID), CurrentStock: newStock, Status: statusFor(newStock, it.MinimumStock),
		}); err != nil {
			return err
		}
		txn, err := s.q.WithTx(tx).InsertInventoryTransaction(ctx, sqlc.InsertInventoryTransactionParams{
			ItemID:          common.PgUUID(itemID),
			Type:            sqlc.InventoryTransactionType(req.Type),
			Quantity:        req.Quantity,
			TransactionDate: common.PgDate(td),
			Reference:       req.Reference,
			Notes:           req.Notes,
		})
		if err != nil {
			return err
		}
		out = txn
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID: actor, Action: common.AuditCreate, EntityType: common.EntityInventoryItem,
			EntityID: itemID.String(), EntityName: it.Name,
			Description: fmt.Sprintf("Inventory %s qty=%d", req.Type, req.Quantity),
		})
	})
	if err != nil {
		return TransactionResponse{}, err
	}
	return txResponse(out), nil
}

func itemResponse(it sqlc.InventoryItem) ItemResponse {
	return ItemResponse{
		ID: common.UUIDFromPg(it.ID), ItemCode: it.ItemCode, Name: it.Name,
		CategoryID: common.UUIDFromPg(it.CategoryID), Unit: it.Unit,
		CurrentStock: it.CurrentStock, MinimumStock: it.MinimumStock, Status: string(it.Status),
		Description: it.Description, CreatedAt: common.TimeFromPg(it.CreatedAt),
	}
}

func txResponse(t sqlc.InventoryTransaction) TransactionResponse {
	return TransactionResponse{
		ID: common.UUIDFromPg(t.ID), ItemID: common.UUIDFromPg(t.ItemID), Type: string(t.Type),
		Quantity: t.Quantity, TransactionDate: common.DateFromPg(t.TransactionDate).Format("2006-01-02"),
		Reference: t.Reference, Notes: t.Notes, CreatedAt: common.TimeFromPg(t.CreatedAt),
	}
}

// --- Handler ---

type Handler struct{ svc *Service }

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

func (h *Handler) Mount(r chi.Router) {
	r.With(appmw.RequirePermission(common.PermInventoryView)).Get("/inventory-categories", h.listCat)
	r.With(appmw.RequirePermission(common.PermInventoryCreate)).Post("/inventory-categories", h.createCat)
	r.With(appmw.RequirePermission(common.PermInventoryEdit)).Patch("/inventory-categories/{id}", h.updateCat)
	r.With(appmw.RequirePermission(common.PermInventoryDelete)).Delete("/inventory-categories/{id}", h.deleteCat)

	r.With(appmw.RequirePermission(common.PermInventoryView)).Get("/inventory", h.listItems)
	r.With(appmw.RequirePermission(common.PermInventoryView)).Get("/inventory/{id}", h.getItem)
	r.With(appmw.RequirePermission(common.PermInventoryCreate)).Post("/inventory", h.createItem)
	r.With(appmw.RequirePermission(common.PermInventoryEdit)).Patch("/inventory/{id}", h.updateItem)
	r.With(appmw.RequirePermission(common.PermInventoryDelete)).Delete("/inventory/{id}", h.deleteItem)

	r.With(appmw.RequirePermission(common.PermInventoryView)).Get("/inventory/{id}/transactions", h.listTx)
	r.With(appmw.RequirePermission(common.PermInventoryEdit)).Post("/inventory/{id}/transactions", h.createTx)
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

func (h *Handler) listItems(w http.ResponseWriter, r *http.Request) {
	q := common.ParsePageQuery(r)
	var f ItemFilter
	if s := r.URL.Query().Get("status"); s != "" {
		f.Status = &s
	}
	if c := r.URL.Query().Get("categoryId"); c != "" {
		cid, err := uuid.Parse(c)
		if err != nil {
			render.Error(w, r, common.NewBadRequestError("INVALID_UUID", "Invalid categoryId."))
			return
		}
		f.CategoryID = &cid
	}
	page, err := h.svc.ListItems(r.Context(), q, f)
	if err != nil {
		render.Error(w, r, err)
		return
	}
	render.JSON(w, http.StatusOK, page)
}

func (h *Handler) getItem(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_UUID", "Invalid id."))
		return
	}
	resp, err := h.svc.GetItem(r.Context(), id)
	if err != nil {
		render.Error(w, r, err)
		return
	}
	render.JSON(w, http.StatusOK, resp)
}

func (h *Handler) createItem(w http.ResponseWriter, r *http.Request) {
	var req ItemRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_JSON", "Invalid JSON."))
		return
	}
	if err := common.Validator().Struct(req); err != nil {
		render.Error(w, r, err)
		return
	}
	resp, err := h.svc.CreateItem(r.Context(), appmw.ActorID(r.Context()), req)
	if err != nil {
		render.Error(w, r, err)
		return
	}
	render.JSON(w, http.StatusCreated, resp)
}

func (h *Handler) updateItem(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_UUID", "Invalid id."))
		return
	}
	var req ItemUpdate
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_JSON", "Invalid JSON."))
		return
	}
	if err := common.Validator().Struct(req); err != nil {
		render.Error(w, r, err)
		return
	}
	resp, err := h.svc.UpdateItem(r.Context(), appmw.ActorID(r.Context()), id, req)
	if err != nil {
		render.Error(w, r, err)
		return
	}
	render.JSON(w, http.StatusOK, resp)
}

func (h *Handler) deleteItem(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_UUID", "Invalid id."))
		return
	}
	if err := h.svc.DeleteItem(r.Context(), appmw.ActorID(r.Context()), id); err != nil {
		render.Error(w, r, err)
		return
	}
	render.NoContent(w)
}

func (h *Handler) listTx(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_UUID", "Invalid id."))
		return
	}
	out, err := h.svc.ListTransactions(r.Context(), id)
	if err != nil {
		render.Error(w, r, err)
		return
	}
	render.JSON(w, http.StatusOK, out)
}

func (h *Handler) createTx(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_UUID", "Invalid id."))
		return
	}
	var req TransactionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_JSON", "Invalid JSON."))
		return
	}
	if err := common.Validator().Struct(req); err != nil {
		render.Error(w, r, err)
		return
	}
	resp, err := h.svc.RecordTransaction(r.Context(), appmw.ActorID(r.Context()), id, req)
	if err != nil {
		render.Error(w, r, err)
		return
	}
	render.JSON(w, http.StatusCreated, resp)
}
