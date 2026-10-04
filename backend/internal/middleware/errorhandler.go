package middleware

import (
	"log/slog"
	"net/http"
	"runtime/debug"

	"github.com/sidpd51/gym-backend/internal/common"
	"github.com/sidpd51/gym-backend/internal/common/render"
)

// Recoverer catches panics from downstream handlers, logs them with stack,
// and renders a 500 INTERNAL_SERVER_ERROR to the client. Mounted on the top
// level router; chi's own Recoverer is replaced by this so the response body
// uses our ApiError shape instead of plain text.
func Recoverer(log *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if rec := recover(); rec != nil {
					log.ErrorContext(r.Context(), "panic recovered",
						slog.Any("panic", rec),
						slog.String("path", r.URL.Path),
						slog.String("method", r.Method),
						slog.String("stack", string(debug.Stack())),
					)
					render.Error(w, r, common.NewInternalError(""))
				}
			}()
			next.ServeHTTP(w, r)
		})
	}
}
