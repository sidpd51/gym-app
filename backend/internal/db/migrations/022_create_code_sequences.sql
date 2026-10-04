-- +goose Up
-- +goose StatementBegin
CREATE SEQUENCE user_code_seq      START 1;
CREATE SEQUENCE member_code_seq    START 1;
CREATE SEQUENCE trainer_code_seq   START 1;
CREATE SEQUENCE lead_code_seq      START 1;
CREATE SEQUENCE expense_code_seq   START 1;
CREATE SEQUENCE item_code_seq      START 1;
CREATE SEQUENCE equipment_code_seq START 1;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP SEQUENCE IF EXISTS equipment_code_seq;
DROP SEQUENCE IF EXISTS item_code_seq;
DROP SEQUENCE IF EXISTS expense_code_seq;
DROP SEQUENCE IF EXISTS lead_code_seq;
DROP SEQUENCE IF EXISTS trainer_code_seq;
DROP SEQUENCE IF EXISTS member_code_seq;
DROP SEQUENCE IF EXISTS user_code_seq;
-- +goose StatementEnd
