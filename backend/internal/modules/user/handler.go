package user

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/sidpd51/gym-backend/internal/common"
	"github.com/sidpd51/gym-backend/internal/common/render"
	appmw "github.com/sidpd51/gym-backend/internal/middleware"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

// Mount attaches user CRUD routes under /users. All require authentication;
// per-route permission is applied by the caller via chi groups.
func (h *Handler) Mount(r chi.Router) {
	r.Group(func(r chi.Router) {
		r.With(appmw.RequirePermission(common.PermUsersView)).Get("/users", h.list)
		r.With(appmw.RequirePermission(common.PermUsersView)).Get("/users/{id}", h.get)
		r.With(appmw.RequirePermission(common.PermUsersCreate)).Post("/users", h.create)
		r.With(appmw.RequirePermission(common.PermUsersEdit)).Patch("/users/{id}", h.update)
		r.With(appmw.RequirePermission(common.PermUsersDelete)).Delete("/users/{id}", h.delete)
	})
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	q := common.ParsePageQuery(r)
	f := ListFilter{}
	if role := r.URL.Query().Get("role"); role != "" {
		rr := common.Role(role)
		f.Role = &rr
	}
	if status := r.URL.Query().Get("status"); status != "" {
		s := status
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
		render.Error(w, r, common.NewBadRequestError("INVALID_UUID", "Invalid user id."))
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
	var req CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_JSON", "Request body is not valid JSON."))
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
		render.Error(w, r, common.NewBadRequestError("INVALID_UUID", "Invalid user id."))
		return
	}
	var req UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_JSON", "Request body is not valid JSON."))
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
		render.Error(w, r, common.NewBadRequestError("INVALID_UUID", "Invalid user id."))
		return
	}
	if err := h.svc.Delete(r.Context(), appmw.ActorID(r.Context()), id); err != nil {
		render.Error(w, r, err)
		return
	}
	render.NoContent(w)
}
