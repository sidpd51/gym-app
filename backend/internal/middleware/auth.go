package middleware

import (
	"context"
	"net/http"

	"github.com/google/uuid"

	"github.com/sidpd51/gym-backend/internal/common"
	"github.com/sidpd51/gym-backend/internal/common/render"
)

type contextKey string

const (
	ctxActor contextKey = "auth.actor"
)

// Actor is the authenticated principal attached to a request context by
// RequireAuth. Downstream handlers read it via UserFromContext.
type Actor struct {
	UserID uuid.UUID
	Role   common.Role
}

// WithActor returns a copy of ctx carrying the given actor. Primarily used
// by tests and by RequireAuth once JWT verification is in place.
func WithActor(ctx context.Context, a Actor) context.Context {
	return context.WithValue(ctx, ctxActor, a)
}

// UserFromContext extracts the actor from the request context. The second
// return value is false when no actor is set (e.g. a public route or a
// request that bypassed RequireAuth).
func UserFromContext(ctx context.Context) (Actor, bool) {
	a, ok := ctx.Value(ctxActor).(Actor)
	return a, ok
}

// ActorID returns the authenticated user's UUID, or the zero UUID if no
// actor is on the context. Convenience for audit logging call sites.
func ActorID(ctx context.Context) uuid.UUID {
	if a, ok := UserFromContext(ctx); ok {
		return a.UserID
	}
	return uuid.Nil
}

// RequireAuth is the middleware that gates authenticated routes. In Phase 4
// it will verify a JWT cookie and populate the context via WithActor. In
// Phase 3 it is a stub that rejects every request so that nothing wires up
// around a half-built login flow by accident.
func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		render.Error(w, r, common.NewUnauthenticatedError(
			"AUTH_REQUIRED",
			"Authentication required.",
		))
	})
}

// RequirePermission is middleware that denies the request unless the
// authenticated actor's role grants the given permission. It is composed
// after RequireAuth on the route group.
func RequirePermission(perm common.Permission) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			actor, ok := UserFromContext(r.Context())
			if !ok {
				render.Error(w, r, common.NewUnauthenticatedError(
					"AUTH_REQUIRED",
					"Authentication required.",
				))
				return
			}
			if !common.HasPermission(actor.Role, perm) {
				render.Error(w, r, common.NewForbiddenError(
					"FORBIDDEN",
					"You do not have permission to perform this action.",
				))
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
