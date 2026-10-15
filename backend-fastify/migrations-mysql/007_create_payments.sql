CREATE TABLE payments (
    id             CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    member_id      CHAR(36) NOT NULL,
    membership_id  CHAR(36),
    amount         DECIMAL(10,2) NOT NULL,
    payment_method ENUM('CASH', 'UPI', 'CARD', 'BANK_TRANSFER') NOT NULL,
    payment_date   DATE NOT NULL,
    status         ENUM('COMPLETED', 'PENDING', 'REFUNDED') NOT NULL DEFAULT 'COMPLETED',
    reference      VARCHAR(100),
    notes          TEXT,
    created_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT chk_payments_amount_positive CHECK (amount > 0),

    CONSTRAINT fk_payments_member_id FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE RESTRICT,
    CONSTRAINT fk_payments_membership_id FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE SET NULL
);

CREATE INDEX idx_payments_member_id ON payments(member_id);
CREATE INDEX idx_payments_membership_id ON payments(membership_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_status ON payments(status);
