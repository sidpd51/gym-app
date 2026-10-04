-- +goose Up
CREATE TABLE equipment_maintenance (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id          UUID NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
    maintenance_date      DATE NOT NULL,
    maintenance_type      maintenance_type NOT NULL,
    description           TEXT NOT NULL,
    cost                  DECIMAL(10, 2),
    performed_by          VARCHAR(100),
    next_maintenance_date DATE,
    notes                 TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_eq_maint_equipment_id ON equipment_maintenance(equipment_id);
CREATE INDEX idx_eq_maint_date ON equipment_maintenance(maintenance_date);
CREATE INDEX idx_eq_maint_next_date ON equipment_maintenance(next_maintenance_date);

-- +goose Down
DROP TABLE IF EXISTS equipment_maintenance;
