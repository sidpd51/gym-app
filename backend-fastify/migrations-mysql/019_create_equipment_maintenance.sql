CREATE TABLE equipment_maintenance (
    id                    CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    equipment_id          CHAR(36) NOT NULL,
    maintenance_date      DATE NOT NULL,
    maintenance_type ENUM('ROUTINE', 'REPAIR', 'INSPECTION', 'REPLACEMENT') NOT NULL,
    description           TEXT NOT NULL,
    cost                  DECIMAL(10,2),
    performed_by          VARCHAR(100),
    next_maintenance_date DATE,
    notes                 TEXT,
    created_at            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT fk_equipment_maintenance_equipment_id FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE RESTRICT
);

CREATE INDEX idx_eq_maint_equipment_id ON equipment_maintenance(equipment_id);
CREATE INDEX idx_eq_maint_date ON equipment_maintenance(maintenance_date);
CREATE INDEX idx_eq_maint_next_date ON equipment_maintenance(next_maintenance_date);
