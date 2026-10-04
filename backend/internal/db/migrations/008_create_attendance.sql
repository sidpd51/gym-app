-- +goose Up
CREATE TABLE attendance (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id       UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
    membership_id   UUID REFERENCES memberships(id) ON DELETE SET NULL,
    attendance_date DATE NOT NULL,
    check_in_time   VARCHAR(5) NOT NULL,
    status          attendance_status NOT NULL DEFAULT 'PRESENT',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_member_attendance_date UNIQUE (member_id, attendance_date)
);

CREATE INDEX idx_attendance_date ON attendance(attendance_date);

-- +goose Down
DROP TABLE IF EXISTS attendance;
