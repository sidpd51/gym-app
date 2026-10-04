// Package authjwt is split out from modules/auth to break the import cycle
// between the auth handler (which uses middleware.RequireAuth) and the
// middleware (which needs the Signer to verify cookie JWTs).
package authjwt

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"

	"github.com/sidpd51/gym-backend/internal/common"
)

// SessionCookieName is the HttpOnly cookie that carries the signed JWT.
const SessionCookieName = "gym_session"

// Claims is the JWT payload for an authenticated session.
type Claims struct {
	Role common.Role `json:"role"`
	jwt.RegisteredClaims
}

// Signer produces and verifies HS256 session tokens.
type Signer struct {
	secret []byte
	ttl    time.Duration
	issuer string
}

func NewSigner(secret string, ttl time.Duration) *Signer {
	return &Signer{secret: []byte(secret), ttl: ttl, issuer: "gym-backend"}
}

// Sign builds a signed token with the given user id and role. The token's
// `exp` is `now + ttl` and its `sub` is the user's UUID string.
func (s *Signer) Sign(userID uuid.UUID, role common.Role) (string, error) {
	now := time.Now()
	claims := Claims{
		Role: role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(s.ttl)),
			Issuer:    s.issuer,
		},
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := tok.SignedString(s.secret)
	if err != nil {
		return "", fmt.Errorf("sign jwt: %w", err)
	}
	return signed, nil
}

// Verify parses, verifies, and returns the claims. Returns an error for an
// expired, malformed, or wrong-algorithm token.
func (s *Signer) Verify(raw string) (*Claims, error) {
	parsed, err := jwt.ParseWithClaims(raw, &Claims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return s.secret, nil
	}, jwt.WithValidMethods([]string{"HS256"}))
	if err != nil {
		return nil, err
	}
	claims, ok := parsed.Claims.(*Claims)
	if !ok || !parsed.Valid {
		return nil, errors.New("invalid claims")
	}
	return claims, nil
}

func (s *Signer) TTL() time.Duration { return s.ttl }
