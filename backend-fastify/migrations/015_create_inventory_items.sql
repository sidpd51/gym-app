CREATE TABLE inventory_items (
    id            CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    item_code     VARCHAR(20) NOT NULL UNIQUE,
    name          VARCHAR(100) NOT NULL,
    category_id   CHAR(36) NOT NULL,
    unit          VARCHAR(20) NOT NULL,
    current_stock INT NOT NULL DEFAULT 0,
    minimum_stock INT NOT NULL DEFAULT 0,
    status        ENUM('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK') NOT NULL DEFAULT 'IN_STOCK',
    description   TEXT,
    created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT chk_stock_non_negative CHECK (current_stock >= 0),
    CONSTRAINT chk_minimum_stock_non_negative CHECK (minimum_stock >= 0),

    CONSTRAINT fk_inventory_items_category_id FOREIGN KEY (category_id) REFERENCES inventory_categories(id) ON DELETE RESTRICT
);

CREATE INDEX idx_inventory_items_status ON inventory_items(status);
CREATE INDEX idx_inventory_items_category_id ON inventory_items(category_id);
