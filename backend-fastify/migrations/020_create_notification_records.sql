CREATE TABLE notification_records (
    id            CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    member_id     CHAR(36) NOT NULL,
    membership_id CHAR(36) NOT NULL,
    type          ENUM('EXPIRY_REMINDER', 'EXPIRED_NOTICE', 'CUSTOM') NOT NULL,
    channel       ENUM('SMS', 'WHATSAPP', 'EMAIL', 'IN_APP') NOT NULL,
    status        ENUM('PENDING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING',
    message       TEXT NOT NULL,
    created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    sent_at       DATETIME(3),
    -- Calendar day in IST (UTC+05:30, no DST) for the daily dedupe index.
    created_date_ist DATE GENERATED ALWAYS AS (DATE(DATE_ADD(created_at, INTERVAL 330 MINUTE))) STORED,

    CONSTRAINT fk_notification_records_member_id FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE RESTRICT,
    CONSTRAINT fk_notification_records_membership_id FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE RESTRICT
);

CREATE INDEX idx_notif_member_id ON notification_records(member_id);
CREATE INDEX idx_notif_membership_id ON notification_records(membership_id);
CREATE INDEX idx_notif_status ON notification_records(status);
CREATE INDEX idx_notif_created_at ON notification_records(created_at);

-- Daily dedupe: at most one (member, membership, type) notification per day.
-- Keeps the expiry-reminder scheduler idempotent — safe to re-run during
-- Intermittent Availability catch-up (see docs 08, 09).
CREATE UNIQUE INDEX uidx_notif_daily_dedupe
    ON notification_records (member_id, membership_id, type, created_date_ist);
