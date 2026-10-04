-- +goose Up
CREATE TABLE notification_records (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id     UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
    membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE RESTRICT,
    type          notification_type NOT NULL,
    channel       notification_channel NOT NULL,
    status        notification_status NOT NULL DEFAULT 'PENDING',
    message       TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at       TIMESTAMPTZ
);

CREATE INDEX idx_notif_member_id ON notification_records(member_id);
CREATE INDEX idx_notif_membership_id ON notification_records(membership_id);
CREATE INDEX idx_notif_status ON notification_records(status);
CREATE INDEX idx_notif_created_at ON notification_records(created_at);

-- Daily dedupe: at most one (member, membership, type) notification per day.
-- Keeps the expiry-reminder scheduler idempotent — safe to re-run during
-- Intermittent Availability catch-up (see docs 08, 09).
CREATE UNIQUE INDEX uidx_notif_daily_dedupe
    ON notification_records (member_id, membership_id, type, ((created_at AT TIME ZONE 'Asia/Kolkata')::date));

-- +goose Down
DROP TABLE IF EXISTS notification_records;
