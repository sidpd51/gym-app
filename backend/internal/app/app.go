package app

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/sidpd51/gym-backend/internal/config"
	appmw "github.com/sidpd51/gym-backend/internal/middleware"
)

var startTime = time.Now()

// New builds the top-level chi router. The DB pool is used for /health;
// feature modules will take it as a dependency starting in Phase 4.
func New(cfg *config.Config, log *slog.Logger, pool *pgxpool.Pool) http.Handler {
	_ = cfg // reserved for later phases

	r := chi.NewRouter()

	r.Use(chimw.RealIP)
	r.Use(chimw.Recoverer)
	r.Use(appmw.Logger(log))

	r.Get("/health", healthHandler(pool))

	return r
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
