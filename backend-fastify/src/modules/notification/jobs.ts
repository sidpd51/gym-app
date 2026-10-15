import type { Scheduler } from '../../common/scheduler.js';
import type { Db } from '../../db/pool.js';
import type { ModuleContext } from '../context.js';
import { NotificationRepository } from './notification.repository.js';
import { DEFAULT_EXPIRY_WINDOW_DAYS, NotificationService } from './notification.service.js';

/** 00:00 IST handler: flips ACTIVE memberships past their end date to EXPIRED. Returns rows changed. */
export function expireOverdueMemberships(tx: Db): Promise<number> {
  return NotificationRepository.expireOverdueMemberships(tx);
}

/** 09:00 IST handler: queues IN_APP expiry reminders (idempotent; see NotificationService). */
export function queueExpiryReminders(tx: Db, svc: NotificationService, days = DEFAULT_EXPIRY_WINDOW_DAYS) {
  return svc.queueExpiryReminders(tx, days);
}

/** Wires the three cron jobs. Call before Scheduler.runOverdueJobs so catch-up sees them. */
export function registerNotificationJobs(
  sched: Scheduler,
  ctx: ModuleContext,
  dailyBackup: (() => Promise<void>) | null,
): void {
  const svc = new NotificationService(ctx.pool);

  sched.register('daily_expire_memberships', '0 0 * * *', async (tx) => {
    const count = await svc.expireOverdueMemberships(tx);
    ctx.log.info({ count }, 'expired memberships');
  });

  sched.register('daily_expiry_reminders', '0 9 * * *', async (tx) => {
    const r = await svc.queueExpiryReminders(tx);
    ctx.log.info(r, 'queued expiry reminders');
  });

  // Idempotent by date, so same-day re-runs (catch-up) are no-ops.
  sched.register('daily_backup', '0 2 * * *', async () => {
    if (!dailyBackup) {
      ctx.log.info('daily_backup: no backup runner configured; skipping');
      return;
    }
    await dailyBackup();
    ctx.log.info('daily_backup: pg_dump complete');
  });
}
