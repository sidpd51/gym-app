package settings

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/sidpd51/gym-backend/internal/common"
	"github.com/sidpd51/gym-backend/internal/common/render"
	"github.com/sidpd51/gym-backend/internal/db/sqlc"
	appmw "github.com/sidpd51/gym-backend/internal/middleware"
)

type Request struct {
	GymName                              *string `json:"gymName"                              validate:"omitempty,max=100"`
	Phone                                *string `json:"phone"                                validate:"omitempty,max=20"`
	Email                                *string `json:"email"                                validate:"omitempty,email,max=255"`
	Address                              *string `json:"address"`
	Currency                             *string `json:"currency"                             validate:"omitempty,len=3"`
	Timezone                             *string `json:"timezone"                             validate:"omitempty,max=50"`
	DateFormat                           *string `json:"dateFormat"                           validate:"omitempty,max=20"`
	MembershipGracePeriodDays            *int32  `json:"membershipGracePeriodDays"            validate:"omitempty,gte=0"`
	AttendanceStartTime                  *string `json:"attendanceStartTime"                  validate:"omitempty,len=5"`
	AttendanceEndTime                    *string `json:"attendanceEndTime"                    validate:"omitempty,len=5"`
	AllowAttendanceForExpiredMembership  *bool   `json:"allowAttendanceForExpiredMembership"`
}

type Response struct {
	GymName                              string  `json:"gymName"`
	Phone                                *string `json:"phone"`
	Email                                *string `json:"email"`
	Address                              *string `json:"address"`
	Currency                             string  `json:"currency"`
	Timezone                             string  `json:"timezone"`
	DateFormat                           string  `json:"dateFormat"`
	MembershipGracePeriodDays            int32   `json:"membershipGracePeriodDays"`
	AttendanceStartTime                  *string `json:"attendanceStartTime"`
	AttendanceEndTime                    *string `json:"attendanceEndTime"`
	AllowAttendanceForExpiredMembership  bool    `json:"allowAttendanceForExpiredMembership"`
}

type Service struct {
	pool *pgxpool.Pool
	q    *sqlc.Queries
}

func NewService(pool *pgxpool.Pool) *Service { return &Service{pool: pool, q: sqlc.New(pool)} }

func (s *Service) Get(ctx context.Context) (Response, error) {
	row, err := s.q.GetGymSettings(ctx)
	if err != nil {
		return Response{}, err
	}
	return toResponse(row), nil
}

func (s *Service) Update(ctx context.Context, actor uuid.UUID, req Request) (Response, error) {
	// Validate time ordering if both are provided.
	if req.AttendanceStartTime != nil && req.AttendanceEndTime != nil {
		if *req.AttendanceEndTime <= *req.AttendanceStartTime {
			return Response{}, common.NewBadRequestError("INVALID_TIME_RANGE",
				"attendanceEndTime must be after attendanceStartTime.")
		}
	}

	params := sqlc.UpdateGymSettingsParams{
		GymName:    req.GymName,
		Phone:      req.Phone,
		Email:      req.Email,
		Address:    req.Address,
		Currency:   req.Currency,
		Timezone:   req.Timezone,
		DateFormat: req.DateFormat,
		MembershipGracePeriodDays:           req.MembershipGracePeriodDays,
		AttendanceStartTime:                 req.AttendanceStartTime,
		AttendanceEndTime:                   req.AttendanceEndTime,
		AllowAttendanceForExpiredMembership: req.AllowAttendanceForExpiredMembership,
	}

	var updated sqlc.GymSetting
	err := pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		r, err := s.q.WithTx(tx).UpdateGymSettings(ctx, params)
		if err != nil {
			return err
		}
		updated = r
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID: actor, Action: common.AuditUpdate, EntityType: common.EntitySettings,
			EntityID: "1", Description: "Updated gym settings",
		})
	})
	if err != nil {
		return Response{}, err
	}
	return toResponse(updated), nil
}

func toResponse(s sqlc.GymSetting) Response {
	return Response{
		GymName: s.GymName, Phone: s.Phone, Email: s.Email, Address: s.Address,
		Currency: s.Currency, Timezone: s.Timezone, DateFormat: s.DateFormat,
		MembershipGracePeriodDays:           s.MembershipGracePeriodDays,
		AttendanceStartTime:                 s.AttendanceStartTime,
		AttendanceEndTime:                   s.AttendanceEndTime,
		AllowAttendanceForExpiredMembership: s.AllowAttendanceForExpiredMembership,
	}
}

// --- Handler ---

type Handler struct{ svc *Service }

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

func (h *Handler) Mount(r chi.Router) {
	r.With(appmw.RequirePermission(common.PermSettingsView)).Get("/settings", h.get)
	r.With(appmw.RequirePermission(common.PermSettingsEdit)).Patch("/settings", h.update)
}

func (h *Handler) get(w http.ResponseWriter, r *http.Request) {
	out, err := h.svc.Get(r.Context())
	if err != nil {
		render.Error(w, r, err)
		return
	}
	render.JSON(w, http.StatusOK, out)
}

func (h *Handler) update(w http.ResponseWriter, r *http.Request) {
	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_JSON", "Invalid JSON."))
		return
	}
	if err := common.Validator().Struct(req); err != nil {
		render.Error(w, r, err)
		return
	}
	out, err := h.svc.Update(r.Context(), appmw.ActorID(r.Context()), req)
	if err != nil {
		render.Error(w, r, err)
		return
	}
	render.JSON(w, http.StatusOK, out)
}
