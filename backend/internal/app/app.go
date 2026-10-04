package app

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/url"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/gorilla/csrf"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/sidpd51/gym-backend/internal/authjwt"
	"github.com/sidpd51/gym-backend/internal/config"
	appmw "github.com/sidpd51/gym-backend/internal/middleware"
	"github.com/sidpd51/gym-backend/internal/modules/auth"
	"github.com/sidpd51/gym-backend/internal/modules/member"
	"github.com/sidpd51/gym-backend/internal/modules/attendance"
	"github.com/sidpd51/gym-backend/internal/modules/membership"
	"github.com/sidpd51/gym-backend/internal/modules/equipment"
	"github.com/sidpd51/gym-backend/internal/modules/expense"
	"github.com/sidpd51/gym-backend/internal/modules/inventory"
	"github.com/sidpd51/gym-backend/internal/modules/lead"
	"github.com/sidpd51/gym-backend/internal/modules/payment"
	"github.com/sidpd51/gym-backend/internal/modules/plan"
	"github.com/sidpd51/gym-backend/internal/modules/trainer"
	"github.com/sidpd51/gym-backend/internal/modules/user"
)

var startTime = time.Now()

// New builds the top-level chi router with all middleware and routes wired.
func New(cfg *config.Config, log *slog.Logger, pool *pgxpool.Pool) http.Handler {
	r := chi.NewRouter()

	r.Use(chimw.RealIP)
	r.Use(appmw.Recoverer(log))
	r.Use(appmw.Logger(log))
	r.Use(buildCORS(cfg))

	r.Get("/health", healthHandler(pool))

	// --- feature wiring -----------------------------------------------------
	userRepo := user.NewRepository(pool)
	userSvc := user.NewService(userRepo)
	userHandler := user.NewHandler(userSvc)

	memberHandler := member.NewHandler(member.NewService(pool))
	planHandler := plan.NewHandler(plan.NewService(pool))
	membershipHandler := membership.NewHandler(membership.NewService(pool))
	paymentHandler := payment.NewHandler(payment.NewService(pool))
	attendanceHandler := attendance.NewHandler(attendance.NewService(pool))
	trainerHandler := trainer.NewHandler(trainer.NewService(pool))
	leadHandler := lead.NewHandler(lead.NewService(pool))
	expenseHandler := expense.NewHandler(expense.NewService(pool))
	inventoryHandler := inventory.NewHandler(inventory.NewService(pool))
	equipmentHandler := equipment.NewHandler(equipment.NewService(pool))

	cookieSecure := cfg.HTTPSCert != "" && cfg.HTTPSKey != ""
	signer := authjwt.NewSigner(cfg.JWTSecret, cfg.SessionTTL)
	authHandler := auth.NewHandler(userSvc, signer, cookieSecure)

	// CSRF middleware uses the first 32 bytes of CookieSecret as its key.
	// Mounted inside /api/v1 so static/health routes stay unaffected.
	csrfKey := deriveCSRFKey(cfg.CookieSecret)

	r.Route("/api/v1", func(r chi.Router) {
		// Login/logout live outside CSRF: there is no session yet on login,
		// and logout only clears a cookie.
		authHandler.MountPublic(r)

		// Everything else is CSRF-protected and uses TrustedOrigins so a
		// same-origin browser request with proper Origin header passes.
		r.Group(func(r chi.Router) {
			r.Use(csrf.Protect(
				csrfKey,
				csrf.CookieName("gym_csrf"),
				csrf.Path("/"),
				csrf.HttpOnly(true),
				csrf.Secure(cookieSecure),
				csrf.SameSite(csrf.SameSiteStrictMode),
				csrf.TrustedOrigins([]string{trustedHost(cfg.FrontendOrigin)}),
			))

			// /auth/me, /auth/profile, /csrf-token
			authHandler.MountProtected(r)

			// Authenticated feature routes
			r.Group(func(r chi.Router) {
				r.Use(appmw.RequireAuth(signer))
				userHandler.Mount(r)
				memberHandler.Mount(r)
				planHandler.Mount(r)
				membershipHandler.Mount(r)
				paymentHandler.Mount(r)
				attendanceHandler.Mount(r)
				trainerHandler.Mount(r)
				leadHandler.Mount(r)
				expenseHandler.Mount(r)
				inventoryHandler.Mount(r)
				equipmentHandler.Mount(r)
			})
		})
	})

	return r
}

func buildCORS(cfg *config.Config) func(http.Handler) http.Handler {
	return cors.Handler(cors.Options{
		AllowedOrigins:   []string{cfg.FrontendOrigin},
		AllowedMethods:   []string{"GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"X-CSRF-Token"},
		AllowCredentials: true,
		MaxAge:           300,
	})
}

// trustedHost extracts the "host:port" from a URL for gorilla/csrf's
// TrustedOrigins option, which rejects full URLs. Falls back to the input
// unchanged for backward compat.
func trustedHost(originURL string) string {
	u, err := url.Parse(originURL)
	if err != nil || u.Host == "" {
		return originURL
	}
	return u.Host
}

// deriveCSRFKey returns a 32-byte key for gorilla/csrf. The input secret is
// expected to be at least 32 characters (enforced by the deployment doc).
func deriveCSRFKey(secret string) []byte {
	b := []byte(secret)
	if len(b) >= 32 {
		return b[:32]
	}
	// Pad short secrets so dev doesn't crash; production .env is validated
	// by the deployment doc requirements.
	padded := make([]byte, 32)
	copy(padded, b)
	return padded
}

func healthHandler(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		dbStatus := "ok"
		httpStatus := http.StatusOK

		pingCtx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()
		if err := pool.Ping(pingCtx); err != nil {
			dbStatus = "unreachable"
			httpStatus = http.StatusInternalServerError
		}

		resp := map[string]any{
			"status": map[string]string{"server": "ok", "db": dbStatus},
			"uptime": time.Since(startTime).Seconds(),
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(httpStatus)
		_ = json.NewEncoder(w).Encode(resp)
	}
}
