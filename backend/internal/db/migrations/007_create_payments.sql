-- +goose Up
CREATE TABLE payments (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id      UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
    membership_id  UUID REFERENCES memberships(id) ON DELETE SET NULL,
    amount         DECIMAL(10, 2) NOT NULL,
    payment_method payment_method NOT NULL,
    payment_date   DATE NOT NULL,
    status         payment_status NOT NULL DEFAULT 'COMPLETED',
    reference      VARCHAR(100),
    notes          TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_payments_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_payments_member_id ON payments(member_id);
CREATE INDEX idx_payments_membership_id ON payments(membership_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_status ON payments(status);

-- +goose Down
DROP TABLE IF EXISTS payments;
