CREATE TABLE equipment (
    id             CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    equipment_code VARCHAR(20) NOT NULL UNIQUE,
    name           VARCHAR(100) NOT NULL,
    category_id    CHAR(36) NOT NULL,
    brand          VARCHAR(100),
    model          VARCHAR(100),
    serial_number  VARCHAR(100),
    purchase_date  DATE,
    purchase_cost  DECIMAL(10,2),
    location       VARCHAR(100),
    status         ENUM('ACTIVE', 'UNDER_MAINTENANCE', 'OUT_OF_SERVICE', 'RETIRED') NOT NULL DEFAULT 'ACTIVE',
    notes          TEXT,
    created_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT fk_equipment_category_id FOREIGN KEY (category_id) REFERENCES equipment_categories(id) ON DELETE RESTRICT
);

CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_equipment_category_id ON equipment(category_id);
