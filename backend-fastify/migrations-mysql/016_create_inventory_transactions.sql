CREATE TABLE inventory_transactions (
    id               CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    item_id          CHAR(36) NOT NULL,
    type             ENUM('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT') NOT NULL,
    quantity         INT NOT NULL,
    transaction_date DATE NOT NULL,
    reference        VARCHAR(100),
    notes            TEXT,
    created_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT chk_quantity_positive CHECK (quantity > 0),

    CONSTRAINT fk_inventory_transactions_item_id FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT
);

CREATE INDEX idx_inventory_tx_item_id ON inventory_transactions(item_id);
CREATE INDEX idx_inventory_tx_date ON inventory_transactions(transaction_date);
