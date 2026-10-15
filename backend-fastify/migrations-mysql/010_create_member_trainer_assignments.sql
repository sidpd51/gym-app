CREATE TABLE member_trainer_assignments (
    id         CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    member_id  CHAR(36) NOT NULL,
    trainer_id CHAR(36) NOT NULL,
    start_date DATE NOT NULL,
    end_date   DATE,
    status     ENUM('ACTIVE', 'ENDED') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    active_member_id CHAR(36) GENERATED ALWAYS AS (IF(status = 'ACTIVE', member_id, NULL)) STORED,

    CONSTRAINT fk_member_trainer_assignments_member_id FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE RESTRICT,
    CONSTRAINT fk_member_trainer_assignments_trainer_id FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE RESTRICT
);

-- At most one ACTIVE assignment per member
CREATE UNIQUE INDEX uidx_one_active_assignment ON member_trainer_assignments(active_member_id);
