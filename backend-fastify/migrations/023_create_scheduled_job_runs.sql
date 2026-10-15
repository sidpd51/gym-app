-- Tracks last successful run per scheduled job.
-- Primary purpose: Intermittent Availability catch-up (docs 08, 09).
-- RunOverdueJobs(ctx) consults this at boot before http.ListenAndServe
-- to execute any jobs whose fire time was missed while the host was powered off.
CREATE TABLE scheduled_job_runs (
    job_name     VARCHAR(100) PRIMARY KEY,
    last_run_at  DATETIME(3) NOT NULL,
    last_status  VARCHAR(20) NOT NULL,
    last_error   TEXT,
    updated_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT chk_last_status CHECK (last_status IN ('SUCCESS', 'FAILED'))
);
