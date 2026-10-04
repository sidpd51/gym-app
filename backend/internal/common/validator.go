package common

import (
	"github.com/go-playground/validator/v10"
)

// validate is a package-level singleton. Reusing one instance across the
// process is both safe and recommended by the validator docs — it caches
// struct metadata.
var validate = validator.New(validator.WithRequiredStructEnabled())

// Validator returns the shared validator instance.
func Validator() *validator.Validate { return validate }
