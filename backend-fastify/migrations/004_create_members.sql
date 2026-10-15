-- +goose Up
CREATE TABLE members (
    id                             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_code                    VARCHAR(20) NOT NULL UNIQUE,
    first_name                     VARCHAR(50) NOT NULL,
    last_name                      VARCHAR(50) NOT NULL,
    phone                          VARCHAR(10) NOT NULL UNIQUE,
    email                          VARCHAR(255),
    status                         member_status NOT NULL DEFAULT 'ACTIVE',
    joining_date                   DATE NOT NULL,
    date_of_birth                  DATE,
    gender                         VARCHAR(10),
    address                        TEXT,
    emergency_contact_name         VARCHAR(100),
    emergency_contact_phone        VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    created_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_phone_digits CHECK (phone ~ '^\d{10}$'),
    CONSTRAINT chk_dob_past CHECK (date_of_birth IS NULL OR date_of_birth < CURRENT_DATE)
);

CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_name ON members(first_name, last_name);
CREATE INDEX idx_members_joining_date ON members(joining_date);

-- +goose Down
DROP TABLE IF EXISTS members;
