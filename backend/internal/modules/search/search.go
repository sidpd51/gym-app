package search

import (
	"context"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/sync/errgroup"

	"github.com/sidpd51/gym-backend/internal/common"
	"github.com/sidpd51/gym-backend/internal/common/render"
	"github.com/sidpd51/gym-backend/internal/db/sqlc"
	appmw "github.com/sidpd51/gym-backend/internal/middleware"
)

const minQueryLen = 2

type MemberHit struct {
	ID         uuid.UUID `json:"id"`
	MemberCode string    `json:"memberCode"`
	Name       string    `json:"name"`
	Phone      string    `json:"phone"`
}

type TrainerHit struct {
	ID          uuid.UUID `json:"id"`
	TrainerCode string    `json:"trainerCode"`
	Name        string    `json:"name"`
	Phone       string    `json:"phone"`
}

type LeadHit struct {
	ID       uuid.UUID `json:"id"`
	LeadCode string    `json:"leadCode"`
	Name     string    `json:"name"`
	Phone    string    `json:"phone"`
}

type SearchResponse struct {
	Members  []MemberHit  `json:"members"`
	Trainers []TrainerHit `json:"trainers"`
	Leads    []LeadHit    `json:"leads"`
}

type Service struct{ q *sqlc.Queries }

func NewService(pool *pgxpool.Pool) *Service { return &Service{q: sqlc.New(pool)} }

func (s *Service) Query(ctx context.Context, actor appmw.Actor, q string) (SearchResponse, error) {
	var resp SearchResponse
	resp.Members = []MemberHit{}
	resp.Trainers = []TrainerHit{}
	resp.Leads = []LeadHit{}

	grp, gctx := errgroup.WithContext(ctx)

	if common.HasPermission(actor.Role, common.PermMembersView) {
		grp.Go(func() error {
			rows, err := s.q.SearchMembers(gctx, &q)
			if err != nil {
				return err
			}
			for _, r := range rows {
				resp.Members = append(resp.Members, MemberHit{
					ID: common.UUIDFromPg(r.ID), MemberCode: r.MemberCode,
					Name: r.FirstName + " " + r.LastName, Phone: r.Phone,
				})
			}
			return nil
		})
	}

	if common.HasPermission(actor.Role, common.PermTrainersView) {
		grp.Go(func() error {
			rows, err := s.q.SearchTrainers(gctx, &q)
			if err != nil {
				return err
			}
			for _, r := range rows {
				resp.Trainers = append(resp.Trainers, TrainerHit{
					ID: common.UUIDFromPg(r.ID), TrainerCode: r.TrainerCode,
					Name: r.FirstName + " " + r.LastName, Phone: r.Phone,
				})
			}
			return nil
		})
	}

	if common.HasPermission(actor.Role, common.PermLeadsView) {
		grp.Go(func() error {
			rows, err := s.q.SearchLeads(gctx, &q)
			if err != nil {
				return err
			}
			for _, r := range rows {
				resp.Leads = append(resp.Leads, LeadHit{
					ID: common.UUIDFromPg(r.ID), LeadCode: r.LeadCode,
					Name: r.Name, Phone: r.Phone,
				})
			}
			return nil
		})
	}

	if err := grp.Wait(); err != nil {
		return SearchResponse{}, err
	}
	return resp, nil
}

// --- Handler ---

type Handler struct{ svc *Service }

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

func (h *Handler) Mount(r chi.Router) {
	r.Get("/search", h.search)
}

func (h *Handler) search(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	if len(q) < minQueryLen {
		render.Error(w, r, common.NewBadRequestError("QUERY_TOO_SHORT",
			"Search query must be at least 2 characters."))
		return
	}
	actor, ok := appmw.UserFromContext(r.Context())
	if !ok {
		render.Error(w, r, common.NewUnauthenticatedError("AUTH_REQUIRED", "Authentication required."))
		return
	}
	out, err := h.svc.Query(r.Context(), actor, q)
	if err != nil {
		render.Error(w, r, err)
		return
	}
	render.JSON(w, http.StatusOK, out)
}
