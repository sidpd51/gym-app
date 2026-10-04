-- +goose Up
CREATE TABLE inventory_categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    status      category_status NOT NULL DEFAULT 'ACTIVE'
);

-- +goose Down
DROP TABLE IF EXISTS inventory_categories;
