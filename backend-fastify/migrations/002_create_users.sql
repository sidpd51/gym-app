CREATE TABLE users (
    id            CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    user_code     VARCHAR(20)  NOT NULL UNIQUE,
    first_name    VARCHAR(50)  NOT NULL,
    last_name     VARCHAR(50)  NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    phone         VARCHAR(20),
    role          ENUM('OWNER', 'ADMIN', 'RECEPTIONIST', 'TRAINER')    NOT NULL,
    status        ENUM('ACTIVE', 'INACTIVE')  NOT NULL DEFAULT 'ACTIVE',
    password_hash VARCHAR(255) NOT NULL,
    last_login_at DATETIME(3),
    created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
);

CREATE INDEX idx_users_role ON users(role);
