package attendance

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

// IST is the application timezone — "Today" always means today in Asia/Kolkata.
var IST *time.Location

func init() {
	loc, err := time.LoadLocation("Asia/Kolkata")
	if err != nil {
		// On systems without a tzdata package time.LoadLocation can fail.
		// Fall back to a fixed +05:30 offset so attendance stays sane.
		loc = time.FixedZone("IST", 5*3600+30*60)
	}
	IST = loc
}

type CreateRequest struct {
	MemberID uuid.UUID `json:"memberId" validate:"required"`
}

type Response struct {
	ID             uuid.UUID  `json:"id"`
	MemberID       uuid.UUID  `json:"memberId"`
	MembershipID   *uuid.UUID `json:"membershipId"`
	AttendanceDate string     `json:"attendanceDate"`
	CheckInTime    string     `json:"checkInTime"`
	Status         string     `json:"status"`
	CreatedAt      time.Time  `json:"createdAt"`
}

type Service struct {
	pool *pgxpool.Pool
	q    *sqlc.Queries
}

func NewService(pool *pgxpool.Pool) *Service { return &Service{pool: pool, q: sqlc.New(pool)} }

type ListFilter struct {
	MemberID *uuid.UUID
	From     *string
	To       *string
}

func (s *Service) List(ctx context.Context, q common.PageQuery, f ListFilter) (common.PageResponse[Response], error) {
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
	rows, err := s.q.ListAttendance(ctx, sqlc.ListAttendanceParams{
		Limit: int32(q.Limit()), Offset: int32(q.Offset()),
		MemberID: memberParam, FromDate: fromParam, ToDate: toParam,
	})
	if err != nil {
		return common.PageResponse[Response]{}, err
	}
	total, err := s.q.CountAttendance(ctx, sqlc.CountAttendanceParams{
		MemberID: memberParam, FromDate: fromParam, ToDate: toParam,
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

// Mark records a check-in for a member on the current date (Asia/Kolkata).
// Enforces: unique per (member, date), and the attendance-policy setting
// for expired memberships.
func (s *Service) Mark(ctx context.Context, actor uuid.UUID, req CreateRequest) (Response, error) {
	now := time.Now().In(IST)
	today := now
	checkIn := now.Format("15:04")

	// Policy check: active membership or an expired one if settings allow.
	settings, err := s.q.GetGymSettings(ctx)
	if err != nil {
		return Response{}, err
	}
	membership, err := s.q.GetActiveMembershipForMember(ctx, common.PgUUID(req.MemberID))
	hasActive := err == nil
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return Response{}, err
	}
	if !hasActive && !settings.AllowAttendanceForExpiredMembership {
		return Response{}, common.NewBusinessRuleError("ATTENDANCE_NOT_ALLOWED",
			"Member has no active membership and the gym does not allow attendance for expired memberships.")
	}

	var membershipParam pgtype.UUID
	if hasActive {
		membershipParam = membership.ID
	}

	var created sqlc.Attendance
	err = pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		a, err := s.q.WithTx(tx).InsertAttendance(ctx, sqlc.InsertAttendanceParams{
			MemberID:       common.PgUUID(req.MemberID),
			MembershipID:   membershipParam,
			AttendanceDate: common.PgDate(today),
			CheckInTime:    checkIn,
		})
		if err != nil {
			if common.IsUniqueViolation(err) {
				return common.NewConflictError("ATTENDANCE_ALREADY_MARKED",
					"Attendance has already been marked for this member today.")
			}
			if common.IsForeignKeyViolation(err) {
				return common.NewBadRequestError("INVALID_REFERENCE", "Member not found.")
			}
			return err
		}
		created = a
		return common.AuditLog(ctx, tx, common.AuditEntry{
			UserID:      actor,
			Action:      common.AuditCreate,
			EntityType:  common.EntityAttendance,
			EntityID:    common.UUIDFromPg(a.ID).String(),
			Description: fmt.Sprintf("Attendance marked at %s", checkIn),
		})
	})
	if err != nil {
		return Response{}, err
	}
	return toResponse(created), nil
}

func toResponse(a sqlc.Attendance) Response {
	resp := Response{
		ID:             common.UUIDFromPg(a.ID),
		MemberID:       common.UUIDFromPg(a.MemberID),
		AttendanceDate: common.DateFromPg(a.AttendanceDate).Format("2006-01-02"),
		CheckInTime:    a.CheckInTime,
		Status:         string(a.Status),
		CreatedAt:      common.TimeFromPg(a.CreatedAt),
	}
	if a.MembershipID.Valid {
		mid := common.UUIDFromPg(a.MembershipID)
		resp.MembershipID = &mid
	}
	return resp
}

// --- Handler ---

type Handler struct{ svc *Service }

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

func (h *Handler) Mount(r chi.Router) {
	r.With(appmw.RequirePermission(common.PermAttendanceView)).Get("/attendance", h.list)
	r.With(appmw.RequirePermission(common.PermAttendanceMark)).Post("/attendance", h.create)
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	q := common.ParsePageQuery(r)
	var f ListFilter
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
	resp, err := h.svc.Mark(r.Context(), appmw.ActorID(r.Context()), req)
	if err != nil {
		render.Error(w, r, err)
		return
	}
	render.JSON(w, http.StatusCreated, resp)
}
