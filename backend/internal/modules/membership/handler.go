package membership

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/sidpd51/gym-backend/internal/common"
	"github.com/sidpd51/gym-backend/internal/common/render"
	appmw "github.com/sidpd51/gym-backend/internal/middleware"
)

type Handler struct{ svc *Service }

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

func (h *Handler) Mount(r chi.Router) {
	r.With(appmw.RequirePermission(common.PermMembershipsView)).Get("/memberships", h.list)
	r.With(appmw.RequirePermission(common.PermMembershipsView)).Get("/memberships/{id}", h.get)
	r.With(appmw.RequirePermission(common.PermMembershipsCreate)).Post("/memberships", h.create)
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
