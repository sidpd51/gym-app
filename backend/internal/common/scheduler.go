package common

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"sync"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/robfig/cron/v3"
)

// JobHandler is the unit of work for a scheduled job. It runs inside a tx
// that also updates scheduled_job_runs — either all three succeed or the
// run is retried on the next fire time (or catch-up on boot).
type JobHandler func(ctx context.Context, tx pgx.Tx) error

type registeredJob struct {
	Name string
	Spec string
	Fn   JobHandler
	Sch  cron.Schedule
}

// Scheduler is a thin wrapper over robfig/cron that integrates with the
// scheduled_job_runs table so missed fires can be caught up after the host
// returns from an overnight shutdown.
//
// Lifecycle:
//
//	s := common.NewScheduler(pool, log)
//	s.Register("daily_expire", "0 0 * * *", expireMemberships)
//	s.Register("daily_backup",  "0 2 * * *", runBackup)
//	if err := s.RunOverdueJobs(ctx); err != nil { ... }
//	s.Start()
//	defer s.Stop()
type Scheduler struct {
	pool *pgxpool.Pool
	log  *slog.Logger
	loc  *time.Location

	mu   sync.Mutex
	jobs []registeredJob
	cron *cron.Cron
}

// NewScheduler builds a scheduler whose cron specs are interpreted in the
// given location. For this app that is always Asia/Kolkata.
func NewScheduler(pool *pgxpool.Pool, log *slog.Logger, loc *time.Location) *Scheduler {
	c := cron.New(cron.WithLocation(loc))
	return &Scheduler{pool: pool, log: log, loc: loc, cron: c}
}

// Register attaches a job to the scheduler. The spec is standard 5-field
// cron syntax (minute hour day-of-month month day-of-week), interpreted in
// the scheduler's location.
func (s *Scheduler) Register(name, spec string, fn JobHandler) error {
	parsed, err := cron.ParseStandard(spec)
	if err != nil {
		return fmt.Errorf("parse cron spec %q: %w", spec, err)
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.jobs = append(s.jobs, registeredJob{Name: name, Spec: spec, Fn: fn, Sch: parsed})
	_, err = s.cron.AddFunc(spec, func() {
		runCtx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
		defer cancel()
		if runErr := s.runJob(runCtx, name, fn); runErr != nil {
			s.log.Error("scheduled job failed",
				slog.String("job", name),
				slog.Any("err", runErr),
			)
		}
	})
	return err
}

// Start begins the cron ticker. Register all jobs before calling Start.
func (s *Scheduler) Start() { s.cron.Start() }

// Stop halts the cron ticker and waits for running jobs to finish.
func (s *Scheduler) Stop() { <-s.cron.Stop().Done() }

// RunOverdueJobs executes any registered job whose most recent expected
// fire time is later than its last recorded successful run. This is called
// at boot before http.ListenAndServe so a PC that was off overnight catches
// up before serving requests. See docs 08 + 09.
func (s *Scheduler) RunOverdueJobs(ctx context.Context) error {
	s.mu.Lock()
	jobs := make([]registeredJob, len(s.jobs))
	copy(jobs, s.jobs)
	s.mu.Unlock()

	now := time.Now().In(s.loc)
	for _, j := range jobs {
		prev := previousFireTime(j.Sch, now, s.loc)
		if prev.IsZero() {
			continue
		}
		last, err := s.lastRun(ctx, j.Name)
		if err != nil {
			return fmt.Errorf("read last-run for %s: %w", j.Name, err)
		}
		if !last.IsZero() && !last.Before(prev) {
			continue // not overdue
		}
		s.log.Info("running overdue job",
			slog.String("job", j.Name),
			slog.Time("expected_at", prev),
			slog.Time("last_run_at", last),
		)
		if err := s.runJob(ctx, j.Name, j.Fn); err != nil {
			s.log.Error("overdue job failed",
				slog.String("job", j.Name),
				slog.Any("err", err),
			)
		}
	}
	return nil
}

// runJob executes a job inside a transaction that also updates
// scheduled_job_runs. On success both commit atomically. On failure both
// roll back and the job is retried on the next schedule tick.
func (s *Scheduler) runJob(ctx context.Context, name string, fn JobHandler) error {
	return pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		if err := fn(ctx, tx); err != nil {
			return err
		}
		_, err := tx.Exec(ctx, upsertJobRunSQL, name, "SUCCESS")
		return err
	})
}

const upsertJobRunSQL = `
INSERT INTO scheduled_job_runs (job_name, last_run_at, last_status, last_error, updated_at)
VALUES ($1, NOW(), $2, NULL, NOW())
ON CONFLICT (job_name) DO UPDATE
SET last_run_at = EXCLUDED.last_run_at,
    last_status = EXCLUDED.last_status,
    last_error  = NULL,
    updated_at  = NOW()
`

func (s *Scheduler) lastRun(ctx context.Context, name string) (time.Time, error) {
	var t time.Time
	err := s.pool.QueryRow(ctx,
		`SELECT last_run_at FROM scheduled_job_runs WHERE job_name = $1`,
		name,
	).Scan(&t)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return time.Time{}, nil
		}
		return time.Time{}, err
	}
	return t.In(s.loc), nil
}

// previousFireTime walks forward from a point 48 hours before `now` and
// returns the most recent expected fire time that is <= now. Returns the
// zero value if there is no fire time in the window (shouldn't happen for
// at-most-daily jobs). Any missed fires further back than 48 hours are
// collapsed into a single catch-up run — handlers must be idempotent.
func previousFireTime(sch cron.Schedule, now time.Time, loc *time.Location) time.Time {
	t := now.Add(-48 * time.Hour).In(loc)
	var prev time.Time
	for {
		next := sch.Next(t)
		if next.After(now) {
			return prev
		}
		prev = next
		t = next
	}
}
