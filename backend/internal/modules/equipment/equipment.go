package equipment

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
	ID uuid.UUID `json:"id"`
	Name string `json:"name"`
	Description *string `json:"description"`
	Status string `json:"status"`
}

type EquipmentRequest struct {
	Name          string           `json:"name"          validate:"required,min=1,max=100"`
	CategoryID    uuid.UUID        `json:"categoryId"    validate:"required"`
	Brand         *string          `json:"brand"         validate:"omitempty,max=100"`
	Model         *string          `json:"model"         validate:"omitempty,max=100"`
	SerialNumber  *string          `json:"serialNumber"  validate:"omitempty,max=100"`
	PurchaseDate  *string          `json:"purchaseDate"  validate:"omitempty,datetime=2006-01-02"`
	PurchaseCost  *decimal.Decimal `json:"purchaseCost"`
	Location      *string          `json:"location"      validate:"omitempty,max=100"`
	Status        *string          `json:"status"        validate:"omitempty,oneof=ACTIVE UNDER_MAINTENANCE OUT_OF_SERVICE RETIRED"`
	Notes         *string          `json:"notes"`
}

type EquipmentUpdate struct {
	Name         *string `json:"name"         validate:"omitempty,min=1,max=100"`
	Brand        *string `json:"brand"        validate:"omitempty,max=100"`
	Model        *string `json:"model"        validate:"omitempty,max=100"`
	SerialNumber *string `json:"serialNumber" validate:"omitempty,max=100"`
	Location     *string `json:"location"     validate:"omitempty,max=100"`
	Status       *string `json:"status"       validate:"omitempty,oneof=ACTIVE UNDER_MAINTENANCE OUT_OF_SERVICE RETIRED"`
	Notes        *string `json:"notes"`
}

type EquipmentResponse struct {
	ID            uuid.UUID        `json:"id"`
	EquipmentCode string           `json:"equipmentCode"`
	Name          string           `json:"name"`
	CategoryID    uuid.UUID        `json:"categoryId"`
	Brand         *string          `json:"brand"`
	Model         *string          `json:"model"`
	SerialNumber  *string          `json:"serialNumber"`
	PurchaseDate  *string          `json:"purchaseDate"`
	PurchaseCost  *decimal.Decimal `json:"purchaseCost"`
	Location      *string          `json:"location"`
	Status        string           `json:"status"`
	Notes         *string          `json:"notes"`
	CreatedAt     time.Time        `json:"createdAt"`
}

type MaintenanceRequest struct {
	MaintenanceDate     string           `json:"maintenanceDate"     validate:"required,datetime=2006-01-02"`
	MaintenanceType     string           `json:"maintenanceType"     validate:"required,oneof=ROUTINE REPAIR INSPECTION REPLACEMENT"`
	Description         string           `json:"description"         validate:"required"`
	Cost                *decimal.Decimal `json:"cost"`
	PerformedBy         *string          `json:"performedBy"         validate:"omitempty,max=100"`
	NextMaintenanceDate *string          `json:"nextMaintenanceDate" validate:"omitempty,datetime=2006-01-02"`
	Notes               *string          `json:"notes"`
}

type MaintenanceResponse struct {
	ID                  uuid.UUID        `json:"id"`
	EquipmentID         uuid.UUID        `json:"equipmentId"`
	MaintenanceDate     string           `json:"maintenanceDate"`
	MaintenanceType     string           `json:"maintenanceType"`
	Description         string           `json:"description"`
	Cost                *decimal.Decimal `json:"cost"`
	PerformedBy         *string          `json:"performedBy"`
	NextMaintenanceDate *string          `json:"nextMaintenanceDate"`
	Notes               *string          `json:"notes"`
	CreatedAt           time.Time        `json:"createdAt"`
}

type Service struct {
	pool *pgxpool.Pool
	q    *sqlc.Queries
}

func NewService(pool *pgxpool.Pool) *Service { return &Service{pool: pool, q: sqlc.New(pool)} }

// --- categories ---

func (s *Service) ListCategories(ctx context.Context) ([]CategoryResponse, error) {
	rows, err := s.q.ListEquipmentCategories(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]CategoryResponse, 0, len(rows))
	for _, c := range rows {
		out = append(out, CategoryResponse{ID: common.UUIDFromPg(c.ID), Name: c.Name, Description: c.Description, Status: string(c.Status)})
	}
	return out, nil
}

func (s *Service) CreateCategory(ctx context.Context, actor uuid.UUID, req CategoryRequest) (CategoryResponse, error) {
	status := sqlc.CategoryStatusACTIVE
	if req.Status != nil {
		status = sqlc.CategoryStatus(*req.Status)
	}
	var out sqlc.EquipmentCategory
	err := pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		c, err := s.q.WithTx(tx).InsertEquipmentCategory(ctx, sqlc.InsertEquipmentCategoryParams{
			Name: req.Name, Description: req.Description, Status: status,
		})
		if err != nil {
			return err
		}
		out = c
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID: actor, Action: common.AuditCreate, EntityType: common.EntityEquipment,
			EntityID: common.UUIDFromPg(c.ID).String(), EntityName: c.Name,
			Description: "Created equipment category",
		})
	})
	if err != nil {
		return CategoryResponse{}, err
	}
	return CategoryResponse{ID: common.UUIDFromPg(out.ID), Name: out.Name, Description: out.Description, Status: string(out.Status)}, nil
}

func (s *Service) UpdateCategory(ctx context.Context, actor uuid.UUID, id uuid.UUID, req CategoryRequest) (CategoryResponse, error) {
	params := sqlc.UpdateEquipmentCategoryParams{ID: common.PgUUID(id), Description: req.Description}
	if req.Name != "" {
		n := req.Name
		params.Name = &n
	}
	if req.Status != nil {
		st := sqlc.CategoryStatus(*req.Status)
		params.Status = &st
	}
	var out sqlc.EquipmentCategory
	err := pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		c, err := s.q.WithTx(tx).UpdateEquipmentCategory(ctx, params)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return common.NewNotFoundError("CATEGORY_NOT_FOUND", "Category not found.")
			}
			return err
		}
		out = c
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID: actor, Action: common.AuditUpdate, EntityType: common.EntityEquipment,
			EntityID: common.UUIDFromPg(c.ID).String(), EntityName: c.Name,
			Description: "Updated equipment category",
		})
	})
	if err != nil {
		return CategoryResponse{}, err
	}
	return CategoryResponse{ID: common.UUIDFromPg(out.ID), Name: out.Name, Description: out.Description, Status: string(out.Status)}, nil
}

func (s *Service) DeleteCategory(ctx context.Context, actor uuid.UUID, id uuid.UUID) error {
	return pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.q.WithTx(tx).DeleteEquipmentCategory(ctx, common.PgUUID(id)); err != nil {
			if common.IsForeignKeyViolation(err) {
				return common.NewConflictError("CATEGORY_REFERENCED", "This category has equipment and cannot be deleted.")
			}
			return err
		}
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID: actor, Action: common.AuditDelete, EntityType: common.EntityEquipment,
			EntityID: id.String(), Description: "Deleted equipment category",
		})
	})
}

// --- equipment ---

func (s *Service) GetEquipment(ctx context.Context, id uuid.UUID) (EquipmentResponse, error) {
	row, err := s.q.GetEquipmentByID(ctx, common.PgUUID(id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return EquipmentResponse{}, common.NewNotFoundError("EQUIPMENT_NOT_FOUND", "Equipment not found.")
		}
		return EquipmentResponse{}, err
	}
	return eqResponse(row), nil
}

type Filter struct {
	Status     *string
	CategoryID *uuid.UUID
}

func (s *Service) ListEquipment(ctx context.Context, q common.PageQuery, f Filter) (common.PageResponse[EquipmentResponse], error) {
	var statusParam *sqlc.EquipmentStatus
	if f.Status != nil {
		st := sqlc.EquipmentStatus(*f.Status)
		statusParam = &st
	}
	catParam := pgtype.UUID{}
	if f.CategoryID != nil {
		catParam = common.PgUUID(*f.CategoryID)
	}
	rows, err := s.q.ListEquipment(ctx, sqlc.ListEquipmentParams{
		Limit: int32(q.Limit()), Offset: int32(q.Offset()), Status: statusParam, CategoryID: catParam,
	})
	if err != nil {
		return common.PageResponse[EquipmentResponse]{}, err
	}
	total, err := s.q.CountEquipment(ctx, sqlc.CountEquipmentParams{Status: statusParam, CategoryID: catParam})
	if err != nil {
		return common.PageResponse[EquipmentResponse]{}, err
	}
	out := make([]EquipmentResponse, 0, len(rows))
	for _, r := range rows {
		out = append(out, eqResponse(r))
	}
	return common.NewPage(out, q.Page, q.PageSize, total), nil
}

func (s *Service) CreateEquipment(ctx context.Context, actor uuid.UUID, req EquipmentRequest) (EquipmentResponse, error) {
	var purchaseDate pgtype.Date
	if req.PurchaseDate != nil {
		t, err := time.Parse("2006-01-02", *req.PurchaseDate)
		if err != nil {
			return EquipmentResponse{}, common.NewBadRequestError("INVALID_DATE", "purchaseDate must be YYYY-MM-DD")
		}
		purchaseDate = common.PgDate(t)
	}
	var purchaseCost decimal.NullDecimal
	if req.PurchaseCost != nil {
		purchaseCost = decimal.NullDecimal{Decimal: *req.PurchaseCost, Valid: true}
	}
	status := sqlc.EquipmentStatusACTIVE
	if req.Status != nil {
		status = sqlc.EquipmentStatus(*req.Status)
	}

	var created sqlc.Equipment
	err := pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		code, err := common.NextEquipmentCode(ctx, tx)
		if err != nil {
			return err
		}
		e, err := s.q.WithTx(tx).InsertEquipment(ctx, sqlc.InsertEquipmentParams{
			EquipmentCode: code,
			Name:          req.Name,
			CategoryID:    common.PgUUID(req.CategoryID),
			Brand:         req.Brand,
			Model:         req.Model,
			SerialNumber:  req.SerialNumber,
			PurchaseDate:  purchaseDate,
			PurchaseCost:  purchaseCost,
			Location:      req.Location,
			Status:        status,
			Notes:         req.Notes,
		})
		if err != nil {
			if common.IsForeignKeyViolation(err) {
				return common.NewBadRequestError("INVALID_REFERENCE", "Category not found.")
			}
			return err
		}
		created = e
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID: actor, Action: common.AuditCreate, EntityType: common.EntityEquipment,
			EntityID: common.UUIDFromPg(e.ID).String(), EntityName: e.Name,
			Description: fmt.Sprintf("Created equipment %s", e.EquipmentCode),
		})
	})
	if err != nil {
		return EquipmentResponse{}, err
	}
	return eqResponse(created), nil
}

func (s *Service) UpdateEquipment(ctx context.Context, actor uuid.UUID, id uuid.UUID, req EquipmentUpdate) (EquipmentResponse, error) {
	params := sqlc.UpdateEquipmentParams{
		ID: common.PgUUID(id),
		Name: req.Name, Brand: req.Brand, Model: req.Model, SerialNumber: req.SerialNumber,
		Location: req.Location, Notes: req.Notes,
	}
	if req.Status != nil {
		st := sqlc.EquipmentStatus(*req.Status)
		params.Status = &st
	}
	var out sqlc.Equipment
	err := pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		e, err := s.q.WithTx(tx).UpdateEquipment(ctx, params)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return common.NewNotFoundError("EQUIPMENT_NOT_FOUND", "Equipment not found.")
			}
			return err
		}
		out = e
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID: actor, Action: common.AuditUpdate, EntityType: common.EntityEquipment,
			EntityID: common.UUIDFromPg(e.ID).String(), EntityName: e.Name,
			Description: "Updated equipment",
		})
	})
	if err != nil {
		return EquipmentResponse{}, err
	}
	return eqResponse(out), nil
}

func (s *Service) DeleteEquipment(ctx context.Context, actor uuid.UUID, id uuid.UUID) error {
	return pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.q.WithTx(tx).DeleteEquipment(ctx, common.PgUUID(id)); err != nil {
			if common.IsForeignKeyViolation(err) {
				return common.NewConflictError("EQUIPMENT_REFERENCED",
					"This equipment has maintenance records and cannot be deleted.")
			}
			return err
		}
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID: actor, Action: common.AuditDelete, EntityType: common.EntityEquipment,
			EntityID: id.String(), Description: "Deleted equipment",
		})
	})
}

// --- maintenance ---

func (s *Service) ListMaintenance(ctx context.Context, equipmentID uuid.UUID) ([]MaintenanceResponse, error) {
	rows, err := s.q.ListEquipmentMaintenance(ctx, common.PgUUID(equipmentID))
	if err != nil {
		return nil, err
	}
	out := make([]MaintenanceResponse, 0, len(rows))
	for _, m := range rows {
		out = append(out, maintResponse(m))
	}
	return out, nil
}

func (s *Service) AddMaintenance(ctx context.Context, actor uuid.UUID, equipmentID uuid.UUID, req MaintenanceRequest) (MaintenanceResponse, error) {
	md, err := time.Parse("2006-01-02", req.MaintenanceDate)
	if err != nil {
		return MaintenanceResponse{}, common.NewBadRequestError("INVALID_DATE", "maintenanceDate must be YYYY-MM-DD")
	}
	var next pgtype.Date
	if req.NextMaintenanceDate != nil {
		t, err := time.Parse("2006-01-02", *req.NextMaintenanceDate)
		if err != nil {
			return MaintenanceResponse{}, common.NewBadRequestError("INVALID_DATE", "nextMaintenanceDate must be YYYY-MM-DD")
		}
		next = common.PgDate(t)
	}
	var cost decimal.NullDecimal
	if req.Cost != nil {
		cost = decimal.NullDecimal{Decimal: *req.Cost, Valid: true}
	}

	var out sqlc.EquipmentMaintenance
	err = pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		m, err := s.q.WithTx(tx).InsertEquipmentMaintenance(ctx, sqlc.InsertEquipmentMaintenanceParams{
			EquipmentID:         common.PgUUID(equipmentID),
			MaintenanceDate:     common.PgDate(md),
			MaintenanceType:     sqlc.MaintenanceType(req.MaintenanceType),
			Description:         req.Description,
			Cost:                cost,
			PerformedBy:         req.PerformedBy,
			NextMaintenanceDate: next,
			Notes:               req.Notes,
		})
		if err != nil {
			if common.IsForeignKeyViolation(err) {
				return common.NewBadRequestError("INVALID_REFERENCE", "Equipment not found.")
			}
			return err
		}
		out = m
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID: actor, Action: common.AuditCreate, EntityType: common.EntityEquipmentMaintenance,
			EntityID: common.UUIDFromPg(m.ID).String(),
			Description: fmt.Sprintf("Maintenance %s on equipment %s", req.MaintenanceType, equipmentID),
		})
	})
	if err != nil {
		return MaintenanceResponse{}, err
	}
	return maintResponse(out), nil
}

func eqResponse(e sqlc.Equipment) EquipmentResponse {
	resp := EquipmentResponse{
		ID: common.UUIDFromPg(e.ID), EquipmentCode: e.EquipmentCode, Name: e.Name,
		CategoryID: common.UUIDFromPg(e.CategoryID),
		Brand: e.Brand, Model: e.Model, SerialNumber: e.SerialNumber,
		Location: e.Location, Status: string(e.Status), Notes: e.Notes,
		CreatedAt: common.TimeFromPg(e.CreatedAt),
	}
	if e.PurchaseDate.Valid {
		s := e.PurchaseDate.Time.Format("2006-01-02")
		resp.PurchaseDate = &s
	}
	if e.PurchaseCost.Valid {
		d := e.PurchaseCost.Decimal
		resp.PurchaseCost = &d
	}
	return resp
}

func maintResponse(m sqlc.EquipmentMaintenance) MaintenanceResponse {
	resp := MaintenanceResponse{
		ID: common.UUIDFromPg(m.ID), EquipmentID: common.UUIDFromPg(m.EquipmentID),
		MaintenanceDate: common.DateFromPg(m.MaintenanceDate).Format("2006-01-02"),
		MaintenanceType: string(m.MaintenanceType), Description: m.Description,
		PerformedBy: m.PerformedBy, Notes: m.Notes, CreatedAt: common.TimeFromPg(m.CreatedAt),
	}
	if m.Cost.Valid {
		d := m.Cost.Decimal
		resp.Cost = &d
	}
	if m.NextMaintenanceDate.Valid {
		s := m.NextMaintenanceDate.Time.Format("2006-01-02")
		resp.NextMaintenanceDate = &s
	}
	return resp
}

// --- Handler ---

type Handler struct{ svc *Service }

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

func (h *Handler) Mount(r chi.Router) {
	r.With(appmw.RequirePermission(common.PermEquipmentView)).Get("/equipment-categories", h.listCat)
	r.With(appmw.RequirePermission(common.PermEquipmentCreate)).Post("/equipment-categories", h.createCat)
	r.With(appmw.RequirePermission(common.PermEquipmentEdit)).Patch("/equipment-categories/{id}", h.updateCat)
	r.With(appmw.RequirePermission(common.PermEquipmentDelete)).Delete("/equipment-categories/{id}", h.deleteCat)

	r.With(appmw.RequirePermission(common.PermEquipmentView)).Get("/equipment", h.listEq)
	r.With(appmw.RequirePermission(common.PermEquipmentView)).Get("/equipment/{id}", h.getEq)
	r.With(appmw.RequirePermission(common.PermEquipmentCreate)).Post("/equipment", h.createEq)
	r.With(appmw.RequirePermission(common.PermEquipmentEdit)).Patch("/equipment/{id}", h.updateEq)
	r.With(appmw.RequirePermission(common.PermEquipmentDelete)).Delete("/equipment/{id}", h.deleteEq)

	r.With(appmw.RequirePermission(common.PermEquipmentView)).Get("/equipment/{id}/maintenance", h.listMaint)
	r.With(appmw.RequirePermission(common.PermEquipmentMaintain)).Post("/equipment/{id}/maintenance", h.addMaint)
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

func (h *Handler) listEq(w http.ResponseWriter, r *http.Request) {
	q := common.ParsePageQuery(r)
	var f Filter
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
	page, err := h.svc.ListEquipment(r.Context(), q, f)
	if err != nil {
		render.Error(w, r, err)
		return
	}
	render.JSON(w, http.StatusOK, page)
}

func (h *Handler) getEq(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_UUID", "Invalid id."))
		return
	}
	resp, err := h.svc.GetEquipment(r.Context(), id)
	if err != nil {
		render.Error(w, r, err)
		return
	}
	render.JSON(w, http.StatusOK, resp)
}

func (h *Handler) createEq(w http.ResponseWriter, r *http.Request) {
	var req EquipmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_JSON", "Invalid JSON."))
		return
	}
	if err := common.Validator().Struct(req); err != nil {
		render.Error(w, r, err)
		return
	}
	resp, err := h.svc.CreateEquipment(r.Context(), appmw.ActorID(r.Context()), req)
	if err != nil {
		render.Error(w, r, err)
		return
	}
	render.JSON(w, http.StatusCreated, resp)
}

func (h *Handler) updateEq(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_UUID", "Invalid id."))
		return
	}
	var req EquipmentUpdate
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_JSON", "Invalid JSON."))
		return
	}
	if err := common.Validator().Struct(req); err != nil {
		render.Error(w, r, err)
		return
	}
	resp, err := h.svc.UpdateEquipment(r.Context(), appmw.ActorID(r.Context()), id, req)
	if err != nil {
		render.Error(w, r, err)
		return
	}
	render.JSON(w, http.StatusOK, resp)
}

func (h *Handler) deleteEq(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_UUID", "Invalid id."))
		return
	}
	if err := h.svc.DeleteEquipment(r.Context(), appmw.ActorID(r.Context()), id); err != nil {
		render.Error(w, r, err)
		return
	}
	render.NoContent(w)
}

func (h *Handler) listMaint(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_UUID", "Invalid id."))
		return
	}
	out, err := h.svc.ListMaintenance(r.Context(), id)
	if err != nil {
		render.Error(w, r, err)
		return
	}
	render.JSON(w, http.StatusOK, out)
}

func (h *Handler) addMaint(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_UUID", "Invalid id."))
		return
	}
	var req MaintenanceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_JSON", "Invalid JSON."))
		return
	}
	if err := common.Validator().Struct(req); err != nil {
		render.Error(w, r, err)
		return
	}
	resp, err := h.svc.AddMaintenance(r.Context(), appmw.ActorID(r.Context()), id, req)
	if err != nil {
		render.Error(w, r, err)
		return
	}
	render.JSON(w, http.StatusCreated, resp)
}
