-- +goose Up
CREATE TABLE trainers (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_code   VARCHAR(20) NOT NULL UNIQUE,
    first_name     VARCHAR(50) NOT NULL,
    last_name      VARCHAR(50) NOT NULL,
    phone          VARCHAR(20) NOT NULL,
    email          VARCHAR(255),
    specialization VARCHAR(100),
    joining_date   DATE NOT NULL,
    status         trainer_status NOT NULL DEFAULT 'ACTIVE',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- +goose Down
DROP TABLE IF EXISTS trainers;
