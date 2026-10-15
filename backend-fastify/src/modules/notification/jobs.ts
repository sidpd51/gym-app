import type { Scheduler } from '../../common/scheduler.js';
import { exec } from '../../db/pool.js';
import type { ModuleContext } from '../context.js';
import { DEFAULT_EXPIRY_WINDOW_DAYS, NotificationService } from './service.js';

/** 00:00 IST handler: flips ACTIVE memberships past their end date to EXPIRED. Returns rows changed. */
export async function expireOverdueMemberships(tx: Parameters<typeof exec>[0]): Promise<number> {
  return exec(tx, "UPDATE memberships SET status = 'EXPIRED' WHERE status = 'ACTIVE' AND end_date < CURRENT_DATE");
}

/**
 * 09:00 IST handler: queues IN_APP expiry reminders. Idempotent via the daily dedupe unique index;
 * ON CONFLICT DO NOTHING is used instead of catching the violation because an error would abort the tx.
 */
export async function queueExpiryReminders(
  tx: Parameters<typeof exec>[0],
  svc: NotificationService,
  days = DEFAULT_EXPIRY_WINDOW_DAYS,
): Promise<{ inserted: number; candidates: number }> {
  const expiring = await svc.expiring(days, tx);
  let inserted = 0;
  for (const m of expiring) {
    const msg = `Hi ${m.firstName}, your membership expires on ${m.endDate}.`;
    inserted += await exec(
      tx,
      `INSERT INTO notification_records (member_id, membership_id, type, channel, status, message)
       VALUES ($1, $2, 'EXPIRY_REMINDER', 'IN_APP', 'PENDING', $3)
       ON CONFLICT DO NOTHING`,
      [m.memberId, m.membershipId, msg],
    );
  }
  return { inserted, candidates: expiring.length };
}

/** Wires the three cron jobs. Call before Scheduler.runOverdueJobs so catch-up sees them. */
export function registerNotificationJobs(
  sched: Scheduler,
  ctx: ModuleContext,
  dailyBackup: (() => Promise<void>) | null,
): void {
  const svc = new NotificationService(ctx.pool);

  sched.register('daily_expire_memberships', '0 0 * * *', async (tx) => {
    const count = await expireOverdueMemberships(tx);
    ctx.log.info({ count }, 'expired memberships');
  });

  sched.register('daily_expiry_reminders', '0 9 * * *', async (tx) => {
    const r = await queueExpiryReminders(tx, svc);
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
