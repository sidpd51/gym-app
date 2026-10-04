-- +goose Up
CREATE TABLE inventory_transactions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id          UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    type             inventory_transaction_type NOT NULL,
    quantity         INT NOT NULL,
    transaction_date DATE NOT NULL,
    reference        VARCHAR(100),
    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_quantity_positive CHECK (quantity > 0)
);

CREATE INDEX idx_inventory_tx_item_id ON inventory_transactions(item_id);
CREATE INDEX idx_inventory_tx_date ON inventory_transactions(transaction_date);

-- +goose Down
DROP TABLE IF EXISTS inventory_transactions;
