package notification

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/sidpd51/gym-backend/internal/common"
	"github.com/sidpd51/gym-backend/internal/common/render"
	"github.com/sidpd51/gym-backend/internal/db/sqlc"
	appmw "github.com/sidpd51/gym-backend/internal/middleware"
	"github.com/sidpd51/gym-backend/internal/modules/attendance"
)

const defaultExpiryWindowDays = 7

type CreateRequest struct {
	MemberID     uuid.UUID `json:"memberId"     validate:"required"`
	MembershipID uuid.UUID `json:"membershipId" validate:"required"`
	Type         string    `json:"type"         validate:"required,oneof=EXPIRY_REMINDER EXPIRED_NOTICE CUSTOM"`
	Channel      string    `json:"channel"      validate:"required,oneof=SMS WHATSAPP EMAIL IN_APP"`
	Message      string    `json:"message"      validate:"required"`
}

type Response struct {
	ID           uuid.UUID  `json:"id"`
	MemberID     uuid.UUID  `json:"memberId"`
	MembershipID uuid.UUID  `json:"membershipId"`
	Type         string     `json:"type"`
	Channel      string     `json:"channel"`
	Status       string     `json:"status"`
	Message      string     `json:"message"`
	CreatedAt    time.Time  `json:"createdAt"`
	SentAt       *time.Time `json:"sentAt"`
}

type ExpiringItem struct {
	MembershipID uuid.UUID `json:"membershipId"`
	MemberID     uuid.UUID `json:"memberId"`
	FirstName    string    `json:"firstName"`
	LastName     string    `json:"lastName"`
	Phone        string    `json:"phone"`
	EndDate      string    `json:"endDate"`
}

type Service struct {
	pool *pgxpool.Pool
	q    *sqlc.Queries
}

func NewService(pool *pgxpool.Pool) *Service { return &Service{pool: pool, q: sqlc.New(pool)} }

func (s *Service) List(ctx context.Context, q common.PageQuery, status *string) (common.PageResponse[Response], error) {
	var statusParam *sqlc.NotificationStatus
	if status != nil {
		st := sqlc.NotificationStatus(*status)
		statusParam = &st
	}
	rows, err := s.q.ListNotifications(ctx, sqlc.ListNotificationsParams{
		Limit: int32(q.Limit()), Offset: int32(q.Offset()), Status: statusParam,
	})
	if err != nil {
		return common.PageResponse[Response]{}, err
	}
	total, err := s.q.CountNotifications(ctx, statusParam)
	if err != nil {
		return common.PageResponse[Response]{}, err
	}
	out := make([]Response, 0, len(rows))
	for _, r := range rows {
		out = append(out, toResponse(r))
	}
	return common.NewPage(out, q.Page, q.PageSize, total), nil
}

func (s *Service) Expiring(ctx context.Context, days int) ([]ExpiringItem, error) {
	rows, err := s.q.FindMembershipsExpiringWithin(ctx, int32(days))
	if err != nil {
		return nil, err
	}
	return toExpiringItems(rows), nil
}

func (s *Service) Expired(ctx context.Context) ([]ExpiringItem, error) {
	rows, err := s.q.FindExpiredMemberships(ctx)
	if err != nil {
		return nil, err
	}
	// FindExpiredMemberships has a different row type; adapt.
	out := make([]ExpiringItem, 0, len(rows))
	for _, r := range rows {
		out = append(out, ExpiringItem{
			MembershipID: common.UUIDFromPg(r.MembershipID),
			MemberID:     common.UUIDFromPg(r.MemberID),
			FirstName:    r.FirstName,
			LastName:     r.LastName,
			Phone:        r.Phone,
			EndDate:      common.DateFromPg(r.EndDate).Format("2006-01-02"),
		})
	}
	return out, nil
}

func (s *Service) Create(ctx context.Context, actor uuid.UUID, req CreateRequest) (Response, error) {
	var out sqlc.NotificationRecord
	err := pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		n, err := s.q.WithTx(tx).InsertNotification(ctx, sqlc.InsertNotificationParams{
			MemberID:     common.PgUUID(req.MemberID),
			MembershipID: common.PgUUID(req.MembershipID),
			Type:         sqlc.NotificationType(req.Type),
			Channel:      sqlc.NotificationChannel(req.Channel),
			Status:       sqlc.NotificationStatusPENDING,
			Message:      req.Message,
		})
		if err != nil {
			if common.IsUniqueViolation(err) {
				return common.NewConflictError("NOTIFICATION_DEDUPED",
					"A notification of this type was already created for this member today.")
			}
			if common.IsForeignKeyViolation(err) {
				return common.NewBadRequestError("INVALID_REFERENCE", "Member or membership not found.")
			}
			return err
		}
		out = n
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID: actor, Action: common.AuditCreate, EntityType: common.EntityNotification,
			EntityID:    common.UUIDFromPg(n.ID).String(),
			Description: fmt.Sprintf("Notification %s via %s", req.Type, req.Channel),
		})
	})
	if err != nil {
		return Response{}, err
	}
	return toResponse(out), nil
}

// --- Scheduled Jobs ---

// RegisterJobs wires three cron jobs on the given scheduler. Call before
// Scheduler.RunOverdueJobs so the catch-up logic can see them.
func RegisterJobs(sched *common.Scheduler, pool *pgxpool.Pool, log *slog.Logger) error {
	svc := NewService(pool)

	// 00:00 IST — expire overdue memberships + persist member status drift
	if err := sched.Register("daily_expire_memberships", "0 0 * * *", func(ctx context.Context, tx pgx.Tx) error {
		rows, err := sqlc.New(pool).WithTx(tx).ExpireOverdueMemberships(ctx)
		log.Info("expired memberships", slog.Int64("count", rows))
		return err
	}); err != nil {
		return err
	}

	// 09:00 IST — queue expiry-reminder notifications for members in the window
	if err := sched.Register("daily_expiry_reminders", "0 9 * * *", func(ctx context.Context, tx pgx.Tx) error {
		expiring, err := svc.Expiring(ctx, defaultExpiryWindowDays)
		if err != nil {
			return err
		}
		inserted := 0
		q := sqlc.New(pool).WithTx(tx)
		for _, m := range expiring {
			msg := fmt.Sprintf("Hi %s, your membership expires on %s.", m.FirstName, m.EndDate)
			_, err := q.InsertNotification(ctx, sqlc.InsertNotificationParams{
				MemberID:     common.PgUUID(m.MemberID),
				MembershipID: common.PgUUID(m.MembershipID),
				Type:         sqlc.NotificationTypeEXPIRYREMINDER,
				Channel:      sqlc.NotificationChannelINAPP,
				Status:       sqlc.NotificationStatusPENDING,
				Message:      msg,
			})
			if err != nil {
				// Dedupe index collisions are expected on re-run — count and continue.
				if common.IsUniqueViolation(err) {
					continue
				}
				return err
			}
			inserted++
		}
		log.Info("queued expiry reminders", slog.Int("inserted", inserted), slog.Int("candidates", len(expiring)))
		return nil
	}); err != nil {
		return err
	}

	// 02:00 IST — daily backup placeholder (Phase 20 implements pg_dump).
	// For now the job exists so the Intermittent Availability catch-up has
	// something to invoke, keeping the mechanism exercised end-to-end.
	if err := sched.Register("daily_backup", "0 2 * * *", func(ctx context.Context, tx pgx.Tx) error {
		log.Info("daily_backup job tick (no-op stub; see Phase 20)")
		return nil
	}); err != nil {
		return err
	}

	return nil
}

func toResponse(n sqlc.NotificationRecord) Response {
	resp := Response{
		ID: common.UUIDFromPg(n.ID), MemberID: common.UUIDFromPg(n.MemberID),
		MembershipID: common.UUIDFromPg(n.MembershipID),
		Type: string(n.Type), Channel: string(n.Channel), Status: string(n.Status),
		Message: n.Message, CreatedAt: common.TimeFromPg(n.CreatedAt),
	}
	if n.SentAt.Valid {
		t := n.SentAt.Time
		resp.SentAt = &t
	}
	return resp
}

func toExpiringItems(rows []sqlc.FindMembershipsExpiringWithinRow) []ExpiringItem {
	out := make([]ExpiringItem, 0, len(rows))
	for _, r := range rows {
		out = append(out, ExpiringItem{
			MembershipID: common.UUIDFromPg(r.MembershipID),
			MemberID:     common.UUIDFromPg(r.MemberID),
			FirstName:    r.FirstName,
			LastName:     r.LastName,
			Phone:        r.Phone,
			EndDate:      common.DateFromPg(r.EndDate).Format("2006-01-02"),
		})
	}
	return out
}

// Compile-time check: unused import guard — attendance timezone used elsewhere.
var _ = attendance.IST

// --- Handler ---

type Handler struct{ svc *Service }

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

func (h *Handler) Mount(r chi.Router) {
	r.With(appmw.RequirePermission(common.PermNotificationsView)).Get("/notifications", h.list)
	r.With(appmw.RequirePermission(common.PermNotificationsView)).Get("/notifications/expiring", h.expiring)
	r.With(appmw.RequirePermission(common.PermNotificationsView)).Get("/notifications/expired", h.expired)
	r.With(appmw.RequirePermission(common.PermNotificationsCreate)).Post("/notifications", h.create)
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	q := common.ParsePageQuery(r)
	var status *string
	if s := r.URL.Query().Get("status"); s != "" {
		status = &s
	}
	page, err := h.svc.List(r.Context(), q, status)
	if err != nil {
		render.Error(w, r, err)
		return
	}
	render.JSON(w, http.StatusOK, page)
}

func (h *Handler) expiring(w http.ResponseWriter, r *http.Request) {
	days := defaultExpiryWindowDays
	if d := r.URL.Query().Get("days"); d != "" {
		if n, err := strconv.Atoi(d); err == nil && n > 0 {
			days = n
		}
	}
	out, err := h.svc.Expiring(r.Context(), days)
	if err != nil {
		render.Error(w, r, err)
		return
	}
	render.JSON(w, http.StatusOK, out)
}

func (h *Handler) expired(w http.ResponseWriter, r *http.Request) {
	out, err := h.svc.Expired(r.Context())
	if err != nil {
		render.Error(w, r, err)
		return
	}
	render.JSON(w, http.StatusOK, out)
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

// Prevent unused import warnings for errors (used indirectly via common).
var _ = errors.Is
