-- +goose Up
CREATE TABLE equipment (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_code VARCHAR(20) NOT NULL UNIQUE,
    name           VARCHAR(100) NOT NULL,
    category_id    UUID NOT NULL REFERENCES equipment_categories(id) ON DELETE RESTRICT,
    brand          VARCHAR(100),
    model          VARCHAR(100),
    serial_number  VARCHAR(100),
    purchase_date  DATE,
    purchase_cost  DECIMAL(10, 2),
    location       VARCHAR(100),
    status         equipment_status NOT NULL DEFAULT 'ACTIVE',
    notes          TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_equipment_category_id ON equipment(category_id);

-- +goose Down
DROP TABLE IF EXISTS equipment;
