CREATE TABLE leads (
    id                  CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    lead_code           VARCHAR(20) NOT NULL UNIQUE,
    name                VARCHAR(100) NOT NULL,
    phone               VARCHAR(20) NOT NULL,
    email               VARCHAR(255),
    source              ENUM('WALK_IN', 'PHONE', 'WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'OTHER'),
    interested_plan_id  CHAR(36),
    status              ENUM('NEW', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'CONVERTED', 'LOST') NOT NULL DEFAULT 'NEW',
    notes               TEXT,
    last_follow_up_date DATE,
    next_follow_up_date DATE,
    converted_member_id CHAR(36),
    created_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT fk_leads_interested_plan_id FOREIGN KEY (interested_plan_id) REFERENCES membership_plans(id) ON DELETE SET NULL,
    CONSTRAINT fk_leads_converted_member_id FOREIGN KEY (converted_member_id) REFERENCES members(id) ON DELETE SET NULL
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_next_follow_up ON leads(next_follow_up_date);
