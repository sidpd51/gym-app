-- +goose Up
CREATE TABLE inventory_items (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_code     VARCHAR(20) NOT NULL UNIQUE,
    name          VARCHAR(100) NOT NULL,
    category_id   UUID NOT NULL REFERENCES inventory_categories(id) ON DELETE RESTRICT,
    unit          VARCHAR(20) NOT NULL,
    current_stock INT NOT NULL DEFAULT 0,
    minimum_stock INT NOT NULL DEFAULT 0,
    status        inventory_status NOT NULL DEFAULT 'IN_STOCK',
    description   TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_stock_non_negative CHECK (current_stock >= 0),
    CONSTRAINT chk_minimum_stock_non_negative CHECK (minimum_stock >= 0)
);

CREATE INDEX idx_inventory_items_status ON inventory_items(status);
CREATE INDEX idx_inventory_items_category_id ON inventory_items(category_id);

-- +goose Down
DROP TABLE IF EXISTS inventory_items;
