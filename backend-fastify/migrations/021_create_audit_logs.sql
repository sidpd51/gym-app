CREATE TABLE audit_logs (
    id          CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    timestamp   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    user_id     CHAR(36) NOT NULL,
    action      ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT') NOT NULL,
    entity_type ENUM('USER', 'MEMBER', 'MEMBERSHIP_PLAN', 'MEMBERSHIP', 'PAYMENT', 'ATTENDANCE', 'TRAINER', 'LEAD', 'EXPENSE', 'INVENTORY_ITEM', 'EQUIPMENT', 'EQUIPMENT_MAINTENANCE', 'NOTIFICATION', 'SETTINGS') NOT NULL,
    entity_id   VARCHAR(100),
    entity_name VARCHAR(255),
    description TEXT NOT NULL,
    status      ENUM('SUCCESS', 'FAILED') NOT NULL DEFAULT 'SUCCESS',
    metadata    JSON,

    CONSTRAINT fk_audit_logs_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_status ON audit_logs(status);
