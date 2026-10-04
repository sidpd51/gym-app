package member

import (
	"time"

	"github.com/google/uuid"
)

type CreateMemberRequest struct {
	FirstName                    string  `json:"firstName"                    validate:"required,min=1,max=50"`
	LastName                     string  `json:"lastName"                     validate:"required,min=1,max=50"`
	Phone                        string  `json:"phone"                        validate:"required,len=10,numeric"`
	Email                        string  `json:"email"                        validate:"omitempty,email,max=255"`
	JoiningDate                  string  `json:"joiningDate"                  validate:"required,datetime=2006-01-02"`
	DateOfBirth                  *string `json:"dateOfBirth"                  validate:"omitempty,datetime=2006-01-02"`
	Gender                       *string `json:"gender"                       validate:"omitempty,max=10"`
	Address                      *string `json:"address"`
	EmergencyContactName         *string `json:"emergencyContactName"         validate:"omitempty,max=100"`
	EmergencyContactPhone        *string `json:"emergencyContactPhone"        validate:"omitempty,max=20"`
	EmergencyContactRelationship *string `json:"emergencyContactRelationship" validate:"omitempty,max=50"`
}

type UpdateMemberRequest struct {
	FirstName                    *string `json:"firstName"                    validate:"omitempty,min=1,max=50"`
	LastName                     *string `json:"lastName"                     validate:"omitempty,min=1,max=50"`
	Email                        *string `json:"email"                        validate:"omitempty,email,max=255"`
	Status                       *string `json:"status"                       validate:"omitempty,oneof=ACTIVE EXPIRED SUSPENDED CANCELLED"`
	DateOfBirth                  *string `json:"dateOfBirth"                  validate:"omitempty,datetime=2006-01-02"`
	Gender                       *string `json:"gender"                       validate:"omitempty,max=10"`
	Address                      *string `json:"address"`
	EmergencyContactName         *string `json:"emergencyContactName"         validate:"omitempty,max=100"`
	EmergencyContactPhone        *string `json:"emergencyContactPhone"        validate:"omitempty,max=20"`
	EmergencyContactRelationship *string `json:"emergencyContactRelationship" validate:"omitempty,max=50"`
}

type MemberResponse struct {
	ID                           uuid.UUID  `json:"id"`
	MemberCode                   string     `json:"memberCode"`
	FirstName                    string     `json:"firstName"`
	LastName                     string     `json:"lastName"`
	Phone                        string     `json:"phone"`
	Email                        *string    `json:"email"`
	Status                       string     `json:"status"`
	JoiningDate                  string     `json:"joiningDate"`
	DateOfBirth                  *string    `json:"dateOfBirth"`
	Gender                       *string    `json:"gender"`
	Address                      *string    `json:"address"`
	EmergencyContactName         *string    `json:"emergencyContactName"`
	EmergencyContactPhone        *string    `json:"emergencyContactPhone"`
	EmergencyContactRelationship *string    `json:"emergencyContactRelationship"`
	CreatedAt                    time.Time  `json:"createdAt"`
	UpdatedAt                    time.Time  `json:"updatedAt"`
}

// MemberDetail is the response for GET /members/:id/details. In Phase 5 the
// supplemental slices are empty; later phases will populate them.
type MemberDetail struct {
	Member            MemberResponse `json:"member"`
	MembershipHistory []any          `json:"membershipHistory"`
	PaymentHistory    []any          `json:"paymentHistory"`
	AttendanceHistory []any          `json:"attendanceHistory"`
	ActiveTrainer     any            `json:"activeTrainer"`
}
