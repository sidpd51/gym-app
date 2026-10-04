package render

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/go-playground/validator/v10"

	"github.com/sidpd51/gym-backend/internal/common"
)

// JSON writes a JSON body with the given status code. If encoding fails, a 500
// is attempted but headers may already be flushed.
func JSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if body == nil {
		return
	}
	_ = json.NewEncoder(w).Encode(body)
}

// NoContent writes 204 with no body.
func NoContent(w http.ResponseWriter) {
	w.WriteHeader(http.StatusNoContent)
}

// Error renders an error. The precedence is:
//  1. *common.AppError                      → use its status / code / message / details
//  2. validator.ValidationErrors            → 400 BAD_REQUEST with field details
//  3. anything else                         → 500 INTERNAL_SERVER_ERROR (logged with cause)
func Error(w http.ResponseWriter, r *http.Request, err error) {
	if err == nil {
		return
	}

	var appErr *common.AppError
	if errors.As(err, &appErr) {
		JSON(w, appErr.HTTPStatus, appErr)
		return
	}

	var vErrs validator.ValidationErrors
	if errors.As(err, &vErrs) {
		fields := make([]map[string]string, 0, len(vErrs))
		for _, fe := range vErrs {
			fields = append(fields, map[string]string{
				"field": fe.Field(),
				"rule":  fe.Tag(),
				"param": fe.Param(),
			})
		}
		app := common.NewBadRequestError("VALIDATION_FAILED", "Request validation failed.").
			WithDetails(map[string]any{"fields": fields})
		JSON(w, app.HTTPStatus, app)
		return
	}

	slog.ErrorContext(r.Context(), "unhandled error",
		slog.String("err", err.Error()),
		slog.String("path", r.URL.Path),
		slog.String("method", r.Method),
	)
	app := common.NewInternalError("")
	JSON(w, app.HTTPStatus, app)
}

// ValidationError renders a 400 directly from a validator.ValidationErrors
// value. Prefer Error(w, r, err) which handles this automatically.
func ValidationError(w http.ResponseWriter, r *http.Request, verr validator.ValidationErrors) {
	Error(w, r, verr)
}
