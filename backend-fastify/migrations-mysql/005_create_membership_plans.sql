CREATE TABLE membership_plans (
    id               CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    name             VARCHAR(100) NOT NULL,
    description      TEXT,
    duration_in_days INT NOT NULL,
    price            DECIMAL(10,2) NOT NULL,
    status           ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT chk_duration_positive CHECK (duration_in_days >= 1),
    CONSTRAINT chk_price_positive CHECK (price > 0)
);
