-- +goose Up
CREATE TABLE expenses (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_code   VARCHAR(20) NOT NULL UNIQUE,
    category_id    UUID NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
    description    TEXT NOT NULL,
    amount         DECIMAL(10, 2) NOT NULL,
    expense_date   DATE NOT NULL,
    payment_method expense_payment_method NOT NULL,
    vendor         VARCHAR(100),
    notes          TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_expense_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category_id ON expenses(category_id);

-- +goose Down
DROP TABLE IF EXISTS expenses;
