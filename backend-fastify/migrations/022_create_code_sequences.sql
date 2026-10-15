-- MySQL has no sequences: one counter row per code prefix.
-- Allocation is `UPDATE ... SET current_value = LAST_INSERT_ID(current_value + 1)` (atomic, row-locked).
CREATE TABLE code_sequences (
    name       VARCHAR(50) NOT NULL PRIMARY KEY,
    current_value BIGINT      NOT NULL DEFAULT 0
);

INSERT INTO code_sequences (name) VALUES
    ('user_code_seq'), ('member_code_seq'), ('trainer_code_seq'), ('lead_code_seq'),
    ('expense_code_seq'), ('item_code_seq'), ('equipment_code_seq');
