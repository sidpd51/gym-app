CREATE TABLE memberships (
    id         CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    member_id  CHAR(36) NOT NULL,
    plan_id    CHAR(36) NOT NULL,
    plan_name  VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date   DATE NOT NULL,
    amount     DECIMAL(10,2) NOT NULL,
    status     ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    -- MySQL has no partial indexes: non-NULL only while ACTIVE, so UNIQUE allows many non-active rows.
    active_member_id CHAR(36) GENERATED ALWAYS AS (IF(status = 'ACTIVE', member_id, NULL)) STORED,

    CONSTRAINT chk_memberships_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_memberships_amount_positive CHECK (amount > 0),

    CONSTRAINT fk_memberships_member_id FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE RESTRICT,
    CONSTRAINT fk_memberships_plan_id FOREIGN KEY (plan_id) REFERENCES membership_plans(id) ON DELETE RESTRICT
);

CREATE INDEX idx_memberships_member_id ON memberships(member_id);
CREATE INDEX idx_memberships_status ON memberships(status);
CREATE INDEX idx_memberships_end_date ON memberships(end_date);

-- Enforce at most one ACTIVE membership per member
CREATE UNIQUE INDEX uidx_one_active_membership ON memberships(active_member_id);
