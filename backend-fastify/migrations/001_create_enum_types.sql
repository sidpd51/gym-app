-- +goose Up
-- +goose StatementBegin
CREATE TYPE user_role AS ENUM ('OWNER', 'ADMIN', 'RECEPTIONIST', 'TRAINER');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TYPE member_status AS ENUM ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED');

CREATE TYPE plan_status AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TYPE membership_status AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

CREATE TYPE payment_method AS ENUM ('CASH', 'UPI', 'CARD', 'BANK_TRANSFER');
CREATE TYPE payment_status AS ENUM ('COMPLETED', 'PENDING', 'REFUNDED');

CREATE TYPE attendance_status AS ENUM ('PRESENT');

CREATE TYPE trainer_status AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TYPE assignment_status AS ENUM ('ACTIVE', 'ENDED');

CREATE TYPE lead_status AS ENUM ('NEW', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'CONVERTED', 'LOST');
CREATE TYPE lead_source AS ENUM ('WALK_IN', 'PHONE', 'WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'OTHER');

CREATE TYPE category_status AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TYPE expense_payment_method AS ENUM ('CASH', 'UPI', 'CARD', 'BANK_TRANSFER');

CREATE TYPE inventory_status AS ENUM ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK');
CREATE TYPE inventory_transaction_type AS ENUM ('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT');

CREATE TYPE equipment_status AS ENUM ('ACTIVE', 'UNDER_MAINTENANCE', 'OUT_OF_SERVICE', 'RETIRED');
CREATE TYPE maintenance_type AS ENUM ('ROUTINE', 'REPAIR', 'INSPECTION', 'REPLACEMENT');

CREATE TYPE notification_type AS ENUM ('EXPIRY_REMINDER', 'EXPIRED_NOTICE', 'CUSTOM');
CREATE TYPE notification_channel AS ENUM ('SMS', 'WHATSAPP', 'EMAIL', 'IN_APP');
CREATE TYPE notification_status AS ENUM ('PENDING', 'SENT', 'FAILED');

CREATE TYPE audit_action AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT');
CREATE TYPE audit_entity_type AS ENUM (
    'USER', 'MEMBER', 'MEMBERSHIP_PLAN', 'MEMBERSHIP', 'PAYMENT', 'ATTENDANCE',
    'TRAINER', 'LEAD', 'EXPENSE', 'INVENTORY_ITEM', 'EQUIPMENT', 'EQUIPMENT_MAINTENANCE',
    'NOTIFICATION', 'SETTINGS'
);
CREATE TYPE audit_status AS ENUM ('SUCCESS', 'FAILED');
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TYPE IF EXISTS audit_status;
DROP TYPE IF EXISTS audit_entity_type;
DROP TYPE IF EXISTS audit_action;
DROP TYPE IF EXISTS notification_status;
DROP TYPE IF EXISTS notification_channel;
DROP TYPE IF EXISTS notification_type;
DROP TYPE IF EXISTS maintenance_type;
DROP TYPE IF EXISTS equipment_status;
DROP TYPE IF EXISTS inventory_transaction_type;
DROP TYPE IF EXISTS inventory_status;
DROP TYPE IF EXISTS expense_payment_method;
DROP TYPE IF EXISTS category_status;
DROP TYPE IF EXISTS lead_source;
DROP TYPE IF EXISTS lead_status;
DROP TYPE IF EXISTS assignment_status;
DROP TYPE IF EXISTS trainer_status;
DROP TYPE IF EXISTS attendance_status;
DROP TYPE IF EXISTS payment_status;
DROP TYPE IF EXISTS payment_method;
DROP TYPE IF EXISTS membership_status;
DROP TYPE IF EXISTS plan_status;
DROP TYPE IF EXISTS member_status;
DROP TYPE IF EXISTS user_status;
DROP TYPE IF EXISTS user_role;
-- +goose StatementEnd
