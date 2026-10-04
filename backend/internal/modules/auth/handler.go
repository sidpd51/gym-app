package auth

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/httprate"
	"github.com/google/uuid"
	"github.com/gorilla/csrf"
	"github.com/jackc/pgx/v5"

	"github.com/sidpd51/gym-backend/internal/authjwt"
	"github.com/sidpd51/gym-backend/internal/common"
	"github.com/sidpd51/gym-backend/internal/common/render"
	appmw "github.com/sidpd51/gym-backend/internal/middleware"
	"github.com/sidpd51/gym-backend/internal/modules/user"
)

type Handler struct {
	userSvc      *user.Service
	signer       *authjwt.Signer
	cookieSecure bool
	cookieMaxAge int
}

func NewHandler(userSvc *user.Service, signer *authjwt.Signer, cookieSecure bool) *Handler {
	return &Handler{
		userSvc:      userSvc,
		signer:       signer,
		cookieSecure: cookieSecure,
		cookieMaxAge: int(signer.TTL().Seconds()),
	}
}

// MountPublic mounts routes that bypass CSRF: login (no session yet) and
// logout (idempotent cookie clear). Login has its own rate limiter.
func (h *Handler) MountPublic(r chi.Router) {
	r.Route("/auth", func(r chi.Router) {
		r.With(httprate.LimitByIP(5, time.Minute)).Post("/login", h.login)
		r.Post("/logout", h.logout)
	})
}

// MountProtected mounts routes that participate in CSRF + require auth.
// Does not use Route("/auth") because the public /auth routes live on the
// same router at the layer above; chi forbids colliding Mount paths.
func (h *Handler) MountProtected(r chi.Router) {
	r.With(appmw.RequireAuth(h.signer)).Get("/auth/me", h.me)
	r.With(appmw.RequireAuth(h.signer)).Patch("/auth/profile", h.updateProfile)
	r.Get("/csrf-token", h.csrfToken)
}

func (h *Handler) login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_JSON", "Request body is not valid JSON."))
		return
	}
	if err := common.Validator().Struct(req); err != nil {
		render.Error(w, r, err)
		return
	}

	u, err := h.userSvc.GetByEmail(r.Context(), strings.ToLower(req.Email))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			// Can't audit — user_id is NOT NULL and FK; no record exists
			// to attribute the attempt to. Fail silently to the client with
			// the generic credential error so unknown-email vs wrong-password
			// aren't distinguishable.
			render.Error(w, r, common.NewUnauthenticatedError("AUTH_INVALID_CREDENTIALS",
				"Email or password is incorrect."))
			return
		}
		render.Error(w, r, err)
		return
	}

	uid := common.UUIDFromPg(u.ID)

	if err := h.userSvc.VerifyPassword(u.PasswordHash, req.Password); err != nil {
		_ = common.AuditLogWithPool(r.Context(), h.userSvc.Pool(), common.AuditEntry{
			UserID:      uid,
			Action:      common.AuditLogin,
			EntityType:  common.EntityUser,
			EntityID:    uid.String(),
			EntityName:  u.FirstName + " " + u.LastName,
			Description: "Failed login: wrong password",
			Status:      common.AuditFailed,
		})
		render.Error(w, r, common.NewUnauthenticatedError("AUTH_INVALID_CREDENTIALS",
			"Email or password is incorrect."))
		return
	}

	if u.Status != "ACTIVE" {
		_ = common.AuditLogWithPool(r.Context(), h.userSvc.Pool(), common.AuditEntry{
			UserID:      uid,
			Action:      common.AuditLogin,
			EntityType:  common.EntityUser,
			EntityID:    uid.String(),
			EntityName:  u.FirstName + " " + u.LastName,
			Description: "Failed login: inactive account",
			Status:      common.AuditFailed,
		})
		render.Error(w, r, common.NewForbiddenError("AUTH_ACCOUNT_INACTIVE",
			"Your account has been deactivated."))
		return
	}

	token, err := h.signer.Sign(uid, common.Role(u.Role))
	if err != nil {
		render.Error(w, r, err)
		return
	}

	if err := h.userSvc.MarkLoggedIn(r.Context(), uid); err != nil {
		render.Error(w, r, err)
		return
	}
	_ = common.AuditLogWithPool(r.Context(), h.userSvc.Pool(), common.AuditEntry{
		UserID:      uid,
		Action:      common.AuditLogin,
		EntityType:  common.EntityUser,
		EntityID:    uid.String(),
		EntityName:  u.FirstName + " " + u.LastName,
		Description: "User logged in",
	})

	http.SetCookie(w, &http.Cookie{
		Name:     authjwt.SessionCookieName,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   h.cookieSecure,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   h.cookieMaxAge,
	})

	render.JSON(w, http.StatusOK, user.UserResponseFromSqlc(u))
}

func (h *Handler) logout(w http.ResponseWriter, r *http.Request) {
	if cookie, err := r.Cookie(authjwt.SessionCookieName); err == nil {
		if claims, verr := h.signer.Verify(cookie.Value); verr == nil {
			if uid, perr := uuid.Parse(claims.Subject); perr == nil {
				_ = common.AuditLogWithPool(r.Context(), h.userSvc.Pool(), common.AuditEntry{
					UserID:      uid,
					Action:      common.AuditLogout,
					EntityType:  common.EntityUser,
					EntityID:    uid.String(),
					Description: "User logged out",
				})
			}
		}
	}

	http.SetCookie(w, &http.Cookie{
		Name:     authjwt.SessionCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   h.cookieSecure,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   -1,
	})
	render.NoContent(w)
}

func (h *Handler) me(w http.ResponseWriter, r *http.Request) {
	actor, _ := appmw.UserFromContext(r.Context())
	resp, err := h.userSvc.GetByID(r.Context(), actor.UserID)
	if err != nil {
		render.Error(w, r, err)
		return
	}
	render.JSON(w, http.StatusOK, resp)
}

func (h *Handler) updateProfile(w http.ResponseWriter, r *http.Request) {
	var req user.UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		render.Error(w, r, common.NewBadRequestError("INVALID_JSON", "Request body is not valid JSON."))
		return
	}
	if err := common.Validator().Struct(req); err != nil {
		render.Error(w, r, err)
		return
	}
	actor, _ := appmw.UserFromContext(r.Context())
	resp, err := h.userSvc.UpdateProfile(r.Context(), actor.UserID, req)
	if err != nil {
		render.Error(w, r, err)
		return
	}
	render.JSON(w, http.StatusOK, resp)
}

func (h *Handler) csrfToken(w http.ResponseWriter, r *http.Request) {
	render.JSON(w, http.StatusOK, CSRFTokenResponse{Token: csrf.Token(r)})
}
