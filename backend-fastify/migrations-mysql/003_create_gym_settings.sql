CREATE TABLE gym_settings (
    id                                      INT PRIMARY KEY DEFAULT 1,
    gym_name                                VARCHAR(100) NOT NULL DEFAULT 'My Gym',
    phone                                   VARCHAR(20),
    email                                   VARCHAR(255),
    address                                 TEXT,
    currency                                VARCHAR(3)   NOT NULL DEFAULT 'INR',
    timezone                                VARCHAR(50)  NOT NULL DEFAULT 'Asia/Kolkata',
    date_format                             VARCHAR(20)  NOT NULL DEFAULT 'DD/MM/YYYY',
    membership_grace_period_days            INT          NOT NULL DEFAULT 0,
    attendance_start_time                   VARCHAR(5),
    attendance_end_time                     VARCHAR(5),
    allow_attendance_for_expired_membership BOOLEAN      NOT NULL DEFAULT FALSE,

    CONSTRAINT chk_single_row CHECK (id = 1),
    CONSTRAINT chk_grace_period_non_negative CHECK (membership_grace_period_days >= 0)
);

INSERT IGNORE INTO gym_settings (id) VALUES (1) ;
