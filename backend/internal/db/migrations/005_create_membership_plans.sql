-- +goose Up
CREATE TABLE membership_plans (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name             VARCHAR(100) NOT NULL,
    description      TEXT,
    duration_in_days INT NOT NULL,
    price            DECIMAL(10, 2) NOT NULL,
    status           plan_status NOT NULL DEFAULT 'ACTIVE',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_duration_positive CHECK (duration_in_days >= 1),
    CONSTRAINT chk_price_positive CHECK (price > 0)
);

-- +goose Down
DROP TABLE IF EXISTS membership_plans;
