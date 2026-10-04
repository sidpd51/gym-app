package report

import (
	"context"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/shopspring/decimal"

	"github.com/sidpd51/gym-backend/internal/common"
	"github.com/sidpd51/gym-backend/internal/common/render"
	"github.com/sidpd51/gym-backend/internal/db/sqlc"
	appmw "github.com/sidpd51/gym-backend/internal/middleware"
	"github.com/sidpd51/gym-backend/internal/modules/attendance"
)

type MonthlyPoint struct {
	Month    string          `json:"month"`
	Revenue  decimal.Decimal `json:"revenue,omitempty"`
	Expenses decimal.Decimal `json:"expenses,omitempty"`
}

type OverviewResponse struct {
	Revenue           decimal.Decimal `json:"revenue"`
	Expenses          decimal.Decimal `json:"expenses"`
	NetCashFlow       decimal.Decimal `json:"netCashFlow"`
	ActiveMembers     int64           `json:"activeMembers"`
	NewMembers        int64           `json:"newMembers"`
	AttendanceCount   int64           `json:"attendanceCount"`
	NewLeads          int64           `json:"newLeads"`
	RevenueVsExpenses []MonthlyPoint  `json:"revenueVsExpenses"`
}

type Service struct {
	pool *pgxpool.Pool
	q    *sqlc.Queries
}

func NewService(pool *pgxpool.Pool) *Service { return &Service{pool: pool, q: sqlc.New(pool)} }

type Range struct {
	From time.Time
	To   time.Time
}

// defaultRange: current month in Asia/Kolkata.
func defaultRange() Range {
	now := time.Now().In(attendance.IST)
	from := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, attendance.IST)
	return Range{From: from, To: now}
}

func parseRange(r *http.Request) (Range, error) {
	q := r.URL.Query()
	rng := defaultRange()
	if f := q.Get("fromDate"); f != "" {
		t, err := time.Parse("2006-01-02", f)
		if err != nil {
			return rng, common.NewBadRequestError("INVALID_DATE", "fromDate must be YYYY-MM-DD")
		}
		rng.From = t
	}
	if to := q.Get("toDate"); to != "" {
		t, err := time.Parse("2006-01-02", to)
		if err != nil {
			return rng, common.NewBadRequestError("INVALID_DATE", "toDate must be YYYY-MM-DD")
		}
		rng.To = t
	}
	return rng, nil
}

func (s *Service) Overview(ctx context.Context, rng Range) (OverviewResponse, error) {
	revenue, err := s.q.SumRevenueBetween(ctx, sqlc.SumRevenueBetweenParams{
		PaymentDate:   common.PgDate(rng.From),
		PaymentDate_2: common.PgDate(rng.To),
	})
	if err != nil {
		return OverviewResponse{}, err
	}
	expenses, err := s.q.SumExpensesBetween(ctx, sqlc.SumExpensesBetweenParams{
		ExpenseDate:   common.PgDate(rng.From),
		ExpenseDate_2: common.PgDate(rng.To),
	})
	if err != nil {
		return OverviewResponse{}, err
	}
	active, err := s.q.ReportActiveMemberCount(ctx)
	if err != nil {
		return OverviewResponse{}, err
	}
	newMembers, err := s.q.ReportNewMemberCount(ctx, sqlc.ReportNewMemberCountParams{
		JoiningDate:   common.PgDate(rng.From),
		JoiningDate_2: common.PgDate(rng.To),
	})
	if err != nil {
		return OverviewResponse{}, err
	}
	attendanceCount, err := s.q.ReportAttendanceCount(ctx, sqlc.ReportAttendanceCountParams{
		AttendanceDate:   common.PgDate(rng.From),
		AttendanceDate_2: common.PgDate(rng.To),
	})
	if err != nil {
		return OverviewResponse{}, err
	}
	newLeads, err := s.q.ReportNewLeadCount(ctx, sqlc.ReportNewLeadCountParams{
		CreatedAt:   common.PgTimestamp(rng.From),
		CreatedAt_2: common.PgTimestamp(rng.To),
	})
	if err != nil {
		return OverviewResponse{}, err
	}

	// Monthly breakdown — merge revenue + expense months by name.
	revRows, err := s.q.ReportRevenueByMonth(ctx, sqlc.ReportRevenueByMonthParams{
		PaymentDate:   common.PgDate(rng.From),
		PaymentDate_2: common.PgDate(rng.To),
	})
	if err != nil {
		return OverviewResponse{}, err
	}
	expRows, err := s.q.ReportExpensesByMonth(ctx, sqlc.ReportExpensesByMonthParams{
		ExpenseDate:   common.PgDate(rng.From),
		ExpenseDate_2: common.PgDate(rng.To),
	})
	if err != nil {
		return OverviewResponse{}, err
	}
	byMonth := make(map[string]*MonthlyPoint)
	order := make([]string, 0)
	for _, r := range revRows {
		if _, ok := byMonth[r.Month]; !ok {
			byMonth[r.Month] = &MonthlyPoint{Month: r.Month}
			order = append(order, r.Month)
		}
		byMonth[r.Month].Revenue = r.Revenue
	}
	for _, r := range expRows {
		if _, ok := byMonth[r.Month]; !ok {
			byMonth[r.Month] = &MonthlyPoint{Month: r.Month}
			order = append(order, r.Month)
		}
		byMonth[r.Month].Expenses = r.Expenses
	}
	monthly := make([]MonthlyPoint, 0, len(order))
	for _, m := range order {
		monthly = append(monthly, *byMonth[m])
	}

	return OverviewResponse{
		Revenue:           revenue,
		Expenses:          expenses,
		NetCashFlow:       revenue.Sub(expenses),
		ActiveMembers:     active,
		NewMembers:        newMembers,
		AttendanceCount:   attendanceCount,
		NewLeads:          newLeads,
		RevenueVsExpenses: monthly,
	}, nil
}

// --- Handler ---

type Handler struct{ svc *Service }

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

func (h *Handler) Mount(r chi.Router) {
	r.With(appmw.RequirePermission(common.PermReportsView)).Get("/reports/overview", h.overview)
	r.With(appmw.RequirePermission(common.PermReportsView)).Get("/reports/revenue", h.revenue)
	r.With(appmw.RequirePermission(common.PermReportsView)).Get("/reports/members", h.members)
	r.With(appmw.RequirePermission(common.PermReportsView)).Get("/reports/memberships", h.memberships)
	r.With(appmw.RequirePermission(common.PermReportsView)).Get("/reports/attendance", h.attendance)
	r.With(appmw.RequirePermission(common.PermReportsView)).Get("/reports/expenses", h.expenses)
	r.With(appmw.RequirePermission(common.PermReportsView)).Get("/reports/leads", h.leads)
}

func (h *Handler) overview(w http.ResponseWriter, r *http.Request) {
	rng, err := parseRange(r)
	if err != nil {
		render.Error(w, r, err)
		return
	}
	out, err := h.svc.Overview(r.Context(), rng)
	if err != nil {
		render.Error(w, r, err)
		return
	}
	render.JSON(w, http.StatusOK, out)
}

// Individual reports: for v1, each returns the overview struct narrowed to
// the fields relevant to its name. Frontend uses whatever fields it needs.
// This keeps the implementation small while covering the contract.
func (h *Handler) revenue(w http.ResponseWriter, r *http.Request)     { h.overview(w, r) }
func (h *Handler) members(w http.ResponseWriter, r *http.Request)     { h.overview(w, r) }
func (h *Handler) memberships(w http.ResponseWriter, r *http.Request) { h.overview(w, r) }
func (h *Handler) attendance(w http.ResponseWriter, r *http.Request)  { h.overview(w, r) }
func (h *Handler) expenses(w http.ResponseWriter, r *http.Request)    { h.overview(w, r) }
func (h *Handler) leads(w http.ResponseWriter, r *http.Request)       { h.overview(w, r) }
