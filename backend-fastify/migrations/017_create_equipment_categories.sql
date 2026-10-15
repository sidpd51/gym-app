CREATE TABLE equipment_categories (
    id          CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    status      ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE'
);
