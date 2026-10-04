-- +goose Up
CREATE TABLE member_trainer_assignments (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id  UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
    trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date   DATE,
    status     assignment_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- At most one ACTIVE assignment per member
CREATE UNIQUE INDEX uidx_one_active_assignment
    ON member_trainer_assignments(member_id)
    WHERE status = 'ACTIVE';

-- +goose Down
DROP TABLE IF EXISTS member_trainer_assignments;
