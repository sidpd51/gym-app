-- +goose Up
CREATE TABLE leads (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_code           VARCHAR(20) NOT NULL UNIQUE,
    name                VARCHAR(100) NOT NULL,
    phone               VARCHAR(20) NOT NULL,
    email               VARCHAR(255),
    source              lead_source,
    interested_plan_id  UUID REFERENCES membership_plans(id) ON DELETE SET NULL,
    status              lead_status NOT NULL DEFAULT 'NEW',
    notes               TEXT,
    last_follow_up_date DATE,
    next_follow_up_date DATE,
    converted_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_next_follow_up ON leads(next_follow_up_date);

-- +goose Down
DROP TABLE IF EXISTS leads;
