CREATE TABLE attendance (
    id              CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    member_id       CHAR(36) NOT NULL,
    membership_id   CHAR(36),
    attendance_date DATE NOT NULL,
    check_in_time   VARCHAR(5) NOT NULL,
    status          ENUM('PRESENT') NOT NULL DEFAULT 'PRESENT',
    created_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT uq_member_attendance_date UNIQUE (member_id, attendance_date),

    CONSTRAINT fk_attendance_member_id FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE RESTRICT,
    CONSTRAINT fk_attendance_membership_id FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE SET NULL
);

CREATE INDEX idx_attendance_date ON attendance(attendance_date);
