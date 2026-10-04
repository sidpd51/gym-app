package render_test

import (
	"encoding/json"
	"errors"
	"net/http/httptest"
	"testing"

	"github.com/go-playground/validator/v10"

	"github.com/sidpd51/gym-backend/internal/common"
	"github.com/sidpd51/gym-backend/internal/common/render"
)

type sample struct {
	Email string `validate:"required,email"`
	Age   int    `validate:"gte=18"`
}

func TestError_AppError(t *testing.T) {
	w := httptest.NewRecorder()
	r := httptest.NewRequest("GET", "/x", nil)

	ae := common.NewConflictError("MEMBER_PHONE_DUPLICATE", "duplicate phone").
		WithDetails(map[string]string{"field": "phone"})
	render.Error(w, r, ae)

	if w.Code != 409 {
		t.Fatalf("status: got %d, want 409", w.Code)
	}
	var body map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode body: %v", err)
	}
	if body["code"] != "MEMBER_PHONE_DUPLICATE" {
		t.Errorf("code: got %v", body["code"])
	}
	if body["status"] != float64(409) {
		t.Errorf("status field: got %v", body["status"])
	}
	if body["message"] != "duplicate phone" {
		t.Errorf("message: got %v", body["message"])
	}
	if body["details"] == nil {
		t.Error("details: expected non-nil")
	}
}

func TestError_ValidationErrors(t *testing.T) {
	v := validator.New()
	err := v.Struct(sample{Email: "not-an-email", Age: 10})
	if err == nil {
		t.Fatal("expected validation error")
	}
	w := httptest.NewRecorder()
	r := httptest.NewRequest("POST", "/x", nil)
	render.Error(w, r, err)

	if w.Code != 400 {
		t.Fatalf("status: got %d, want 400", w.Code)
	}
	var body map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if body["code"] != "VALIDATION_FAILED" {
		t.Errorf("code: got %v", body["code"])
	}
	details, _ := body["details"].(map[string]any)
	fields, _ := details["fields"].([]any)
	if len(fields) != 2 {
		t.Errorf("fields: got %d, want 2", len(fields))
	}
}

func TestError_UnknownErrorBecomes500(t *testing.T) {
	w := httptest.NewRecorder()
	r := httptest.NewRequest("GET", "/x", nil)
	render.Error(w, r, errors.New("boom"))

	if w.Code != 500 {
		t.Fatalf("status: got %d, want 500", w.Code)
	}
	var body map[string]any
	_ = json.Unmarshal(w.Body.Bytes(), &body)
	if body["code"] != "INTERNAL_SERVER_ERROR" {
		t.Errorf("code: got %v", body["code"])
	}
}

func TestJSON_WritesContentType(t *testing.T) {
	w := httptest.NewRecorder()
	render.JSON(w, 201, map[string]string{"ok": "yes"})
	if ct := w.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("content-type: got %q", ct)
	}
	if w.Code != 201 {
		t.Errorf("status: got %d", w.Code)
	}
}
