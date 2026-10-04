package middleware

import (
	"context"
	"net/http"

	"github.com/google/uuid"

	"github.com/sidpd51/gym-backend/internal/authjwt"
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
// by tests and by RequireAuth once JWT verification succeeds.
func WithActor(ctx context.Context, a Actor) context.Context {
	return context.WithValue(ctx, ctxActor, a)
}

// UserFromContext extracts the actor from the request context. The second
// return value is false when no actor is set.
func UserFromContext(ctx context.Context) (Actor, bool) {
	a, ok := ctx.Value(ctxActor).(Actor)
	return a, ok
}

// ActorID returns the authenticated user's UUID, or uuid.Nil if no actor is
// on the context. Convenience for audit-log call sites.
func ActorID(ctx context.Context) uuid.UUID {
	if a, ok := UserFromContext(ctx); ok {
		return a.UserID
	}
	return uuid.Nil
}

// RequireAuth verifies the session JWT cookie and populates the actor on
// the request context before dispatching to `next`. Missing, malformed, or
// expired cookies produce a 401.
func RequireAuth(signer *authjwt.Signer) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			cookie, err := r.Cookie(authjwt.SessionCookieName)
			if err != nil || cookie.Value == "" {
				render.Error(w, r, common.NewUnauthenticatedError(
					"AUTH_REQUIRED",
					"Authentication required.",
				))
				return
			}
			claims, err := signer.Verify(cookie.Value)
			if err != nil {
				render.Error(w, r, common.NewUnauthenticatedError(
					"AUTH_INVALID_SESSION",
					"Your session is invalid or has expired.",
				))
				return
			}
			uid, err := uuid.Parse(claims.Subject)
			if err != nil {
				render.Error(w, r, common.NewUnauthenticatedError(
					"AUTH_INVALID_SESSION",
					"Your session is invalid.",
				))
				return
			}
			ctx := WithActor(r.Context(), Actor{UserID: uid, Role: claims.Role})
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequirePermission is middleware that denies the request unless the
// authenticated actor's role grants the given permission.
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
