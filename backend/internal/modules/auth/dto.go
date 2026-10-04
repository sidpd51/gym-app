package auth

type LoginRequest struct {
	Email    string `json:"email"    validate:"required,email"`
	Password string `json:"password" validate:"required,min=8,max=72"`
}

type CSRFTokenResponse struct {
	Token string `json:"token"`
}
