-- +goose Up
CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action      audit_action NOT NULL,
    entity_type audit_entity_type NOT NULL,
    entity_id   VARCHAR(100),
    entity_name VARCHAR(255),
    description TEXT NOT NULL,
    status      audit_status NOT NULL DEFAULT 'SUCCESS',
    metadata    JSONB
);

CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_status ON audit_logs(status);

-- +goose Down
DROP TABLE IF EXISTS audit_logs;
