-- +goose Up
CREATE TABLE memberships (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id  UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
    plan_id    UUID NOT NULL REFERENCES membership_plans(id) ON DELETE RESTRICT,
    plan_name  VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date   DATE NOT NULL,
    amount     DECIMAL(10, 2) NOT NULL,
    status     membership_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_memberships_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_memberships_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_memberships_member_id ON memberships(member_id);
CREATE INDEX idx_memberships_status ON memberships(status);
CREATE INDEX idx_memberships_end_date ON memberships(end_date);

-- Enforce at most one ACTIVE membership per member
CREATE UNIQUE INDEX uidx_one_active_membership
    ON memberships(member_id)
    WHERE status = 'ACTIVE';

-- +goose Down
DROP TABLE IF EXISTS memberships;
