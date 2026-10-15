CREATE TABLE members (
    id                             CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    member_code                    VARCHAR(20) NOT NULL UNIQUE,
    first_name                     VARCHAR(50) NOT NULL,
    last_name                      VARCHAR(50) NOT NULL,
    phone                          VARCHAR(10) NOT NULL UNIQUE,
    email                          VARCHAR(255),
    status                         ENUM('ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    joining_date                   DATE NOT NULL,
    date_of_birth                  DATE,
    gender                         VARCHAR(10),
    address                        TEXT,
    emergency_contact_name         VARCHAR(100),
    emergency_contact_phone        VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    created_at                     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at                     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT chk_phone_digits CHECK (phone REGEXP '^[0-9]{10}$')
);

CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_name ON members(first_name, last_name);
CREATE INDEX idx_members_joining_date ON members(joining_date);
