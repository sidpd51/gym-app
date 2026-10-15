import { CronExpressionParser } from 'cron-parser';
import type { FastifyBaseLogger } from 'fastify';
import { withTx, type DbClient, type DbPool } from '../db/pool.js';

export type JobHandler = (tx: DbClient) => Promise<void>;

interface Job {
  name: string;
  spec: string;
  fn: JobHandler;
  timer?: NodeJS.Timeout;
}

/**
 * Cron scheduler backed by the scheduled_job_runs table so jobs missed while
 * the host was off are caught up at boot (see docs 08 + 09). Each run executes
 * inside a transaction that also records the run — both commit or neither does.
 */
export class Scheduler {
  private jobs: Job[] = [];
  private started = false;

  constructor(
    private readonly pool: DbPool,
    private readonly log: FastifyBaseLogger,
    private readonly tz: string,
  ) {}

  register(name: string, spec: string, fn: JobHandler): void {
    CronExpressionParser.parse(spec, { tz: this.tz }); // validate eagerly
    this.jobs.push({ name, spec, fn });
  }

  start(): void {
    this.started = true;
    for (const job of this.jobs) this.arm(job);
  }

  stop(): void {
    this.started = false;
    for (const job of this.jobs) clearTimeout(job.timer);
  }

  private arm(job: Job): void {
    if (!this.started) return;
    const next = CronExpressionParser.parse(job.spec, { tz: this.tz }).next().toDate();
    // setTimeout caps at ~24.8 days; our jobs are daily, but clamp for safety.
    const delay = Math.min(Math.max(next.getTime() - Date.now(), 0), 2 ** 31 - 1);
    job.timer = setTimeout(async () => {
      try {
        if (next.getTime() <= Date.now()) await this.runJob(job.name, job.fn);
      } catch (err) {
        this.log.error({ err, job: job.name }, 'scheduled job failed');
      }
      this.arm(job);
    }, delay);
    job.timer.unref();
  }

  /**
   * Runs any job whose most recent expected fire time is later than its last
   * recorded successful run. Called at boot before listen(). Handlers must be
   * idempotent: misses are collapsed into one catch-up run.
   */
  async runOverdueJobs(): Promise<void> {
    const now = new Date();
    for (const job of this.jobs) {
      const prev = CronExpressionParser.parse(job.spec, { tz: this.tz, currentDate: now }).prev().toDate();
      const last = await this.lastRun(job.name);
      if (last && last >= prev) continue;
      this.log.info({ job: job.name, expectedAt: prev, lastRunAt: last }, 'running overdue job');
      try {
        await this.runJob(job.name, job.fn);
      } catch (err) {
        this.log.error({ err, job: job.name }, 'overdue job failed');
      }
    }
  }

  private runJob(name: string, fn: JobHandler): Promise<void> {
    return withTx(this.pool, async (tx) => {
      await fn(tx);
      await tx.query(
        `INSERT INTO scheduled_job_runs (job_name, last_run_at, last_status, last_error, updated_at)
         VALUES (?, NOW(3), 'SUCCESS', NULL, NOW(3))
         ON DUPLICATE KEY UPDATE
           last_run_at = VALUES(last_run_at), last_status = VALUES(last_status),
           last_error = NULL, updated_at = NOW(3)`,
        [name],
      );
    });
  }

  private async lastRun(name: string): Promise<Date | null> {
    const [rows] = await this.pool.query('SELECT last_run_at FROM scheduled_job_runs WHERE job_name = ?', [name]);
    return (rows as Array<{ last_run_at: Date }>)[0]?.last_run_at ?? null;
  }
}
