package common

import (
	"fmt"
	"net/http"
)

// AppError is the single domain error type returned from service/handler code.
// The error middleware uses errors.As to pick status and renders a JSON body
// matching the frontend ApiErrorData shape (lib/api/errors.ts).
type AppError struct {
	Code       string `json:"code"`
	HTTPStatus int    `json:"status"`
	Message    string `json:"message"`
	Details    any    `json:"details,omitempty"`

	// cause is wrapped for logging but never serialized to clients.
	cause error
}

func (e *AppError) Error() string {
	if e == nil {
		return "<nil AppError>"
	}
	if e.cause != nil {
		return fmt.Sprintf("%s: %s: %v", e.Code, e.Message, e.cause)
	}
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

func (e *AppError) Unwrap() error { return e.cause }

// WithCause attaches an underlying error for logging. Does not change the
// client-facing fields.
func (e *AppError) WithCause(err error) *AppError {
	e.cause = err
	return e
}

// WithDetails sets the Details field and returns the same error for chaining.
func (e *AppError) WithDetails(d any) *AppError {
	e.Details = d
	return e
}

// Constructors — one per HTTP status band in doc 08.

func NewBadRequestError(code, message string) *AppError {
	return &AppError{Code: code, HTTPStatus: http.StatusBadRequest, Message: message}
}

func NewUnauthenticatedError(code, message string) *AppError {
	return &AppError{Code: code, HTTPStatus: http.StatusUnauthorized, Message: message}
}

func NewForbiddenError(code, message string) *AppError {
	return &AppError{Code: code, HTTPStatus: http.StatusForbidden, Message: message}
}

func NewNotFoundError(code, message string) *AppError {
	return &AppError{Code: code, HTTPStatus: http.StatusNotFound, Message: message}
}

func NewConflictError(code, message string) *AppError {
	return &AppError{Code: code, HTTPStatus: http.StatusConflict, Message: message}
}

func NewBusinessRuleError(code, message string) *AppError {
	return &AppError{Code: code, HTTPStatus: http.StatusUnprocessableEntity, Message: message}
}

func NewInternalError(code string) *AppError {
	if code == "" {
		code = "INTERNAL_SERVER_ERROR"
	}
	return &AppError{
		Code:       code,
		HTTPStatus: http.StatusInternalServerError,
		Message:    "An internal server error occurred.",
	}
}
