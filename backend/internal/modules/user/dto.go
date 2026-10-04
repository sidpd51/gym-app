package user

import (
	"time"

	"github.com/google/uuid"

	"github.com/sidpd51/gym-backend/internal/common"
)

// CreateUserRequest is the body for POST /api/v1/users.
type CreateUserRequest struct {
	FirstName string      `json:"firstName" validate:"required,min=1,max=50"`
	LastName  string      `json:"lastName"  validate:"required,min=1,max=50"`
	Email     string      `json:"email"     validate:"required,email,max=255"`
	Phone     string      `json:"phone"     validate:"omitempty,max=20"`
	Role      common.Role `json:"role"      validate:"required,oneof=OWNER ADMIN RECEPTIONIST TRAINER"`
	Password  string      `json:"password"  validate:"required,min=8,max=72"`
}

// UpdateUserRequest is the body for PATCH /api/v1/users/:id. All fields
// optional; only non-nil fields are applied.
type UpdateUserRequest struct {
	FirstName *string      `json:"firstName" validate:"omitempty,min=1,max=50"`
	LastName  *string      `json:"lastName"  validate:"omitempty,min=1,max=50"`
	Phone     *string      `json:"phone"     validate:"omitempty,max=20"`
	Role      *common.Role `json:"role"      validate:"omitempty,oneof=OWNER ADMIN RECEPTIONIST TRAINER"`
	Status    *string      `json:"status"    validate:"omitempty,oneof=ACTIVE INACTIVE"`
}

// UpdateProfileRequest is the body for PATCH /api/v1/auth/profile.
type UpdateProfileRequest struct {
	FirstName *string `json:"firstName" validate:"omitempty,min=1,max=50"`
	LastName  *string `json:"lastName"  validate:"omitempty,min=1,max=50"`
	Phone     *string `json:"phone"     validate:"omitempty,max=20"`
	// Password change is optional; current+new both required if present.
	CurrentPassword *string `json:"currentPassword" validate:"omitempty,min=1"`
	NewPassword     *string `json:"newPassword"     validate:"omitempty,min=8,max=72,required_with=CurrentPassword"`
}

// UserResponse is the public view of a user. Never includes PasswordHash.
type UserResponse struct {
	ID          uuid.UUID   `json:"id"`
	UserCode    string      `json:"userCode"`
	FirstName   string      `json:"firstName"`
	LastName    string      `json:"lastName"`
	Email       string      `json:"email"`
	Phone       *string     `json:"phone"`
	Role        common.Role `json:"role"`
	Status      string      `json:"status"`
	LastLoginAt *time.Time  `json:"lastLoginAt"`
	CreatedAt   time.Time   `json:"createdAt"`
}
