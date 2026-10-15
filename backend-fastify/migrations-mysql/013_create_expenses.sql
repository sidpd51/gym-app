CREATE TABLE expenses (
    id             CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    expense_code   VARCHAR(20) NOT NULL UNIQUE,
    category_id    CHAR(36) NOT NULL,
    description    TEXT NOT NULL,
    amount         DECIMAL(10,2) NOT NULL,
    expense_date   DATE NOT NULL,
    payment_method ENUM('CASH', 'UPI', 'CARD', 'BANK_TRANSFER') NOT NULL,
    vendor         VARCHAR(100),
    notes          TEXT,
    created_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT chk_expense_amount_positive CHECK (amount > 0),

    CONSTRAINT fk_expenses_category_id FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE RESTRICT
);

CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category_id ON expenses(category_id);
