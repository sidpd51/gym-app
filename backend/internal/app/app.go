package app

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"

	"github.com/sidpd51/gym-backend/internal/config"
	appmw "github.com/sidpd51/gym-backend/internal/middleware"
)

var startTime = time.Now()

// New builds the top-level chi router with stdlib chi middleware and
// a single public /health route. No DB wiring in Phase 1.
func New(cfg *config.Config, log *slog.Logger) http.Handler {
	_ = cfg // config is loaded for later phases; keeps signature stable

	r := chi.NewRouter()

	r.Use(chimw.RealIP)
	r.Use(chimw.Recoverer)
	r.Use(appmw.Logger(log))

	r.Get("/health", healthHandler)

	return r
}

func healthHandler(w http.ResponseWriter, _ *http.Request) {
	resp := map[string]any{
		"status": "ok",
		"uptime": time.Since(startTime).Seconds(),
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(resp)
}
