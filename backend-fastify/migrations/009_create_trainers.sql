CREATE TABLE trainers (
    id             CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    trainer_code   VARCHAR(20) NOT NULL UNIQUE,
    first_name     VARCHAR(50) NOT NULL,
    last_name      VARCHAR(50) NOT NULL,
    phone          VARCHAR(20) NOT NULL,
    email          VARCHAR(255),
    specialization VARCHAR(100),
    joining_date   DATE NOT NULL,
    status         ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
);
