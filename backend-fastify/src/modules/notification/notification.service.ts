import { auditLog } from '../../common/audit.js';
import { badRequest, conflict } from '../../common/errors.js';
import { newPage, pageOffset, type PageQuery } from '../../common/pagination.js';
import { isForeignKeyViolation, isUniqueViolation, withTx, type Db, type DbPool } from '../../db/pool.js';
import { toExpiringItem, toNotificationResponse, type ExpiringItem } from './notification.model.js';
import { NotificationRepository } from './notification.repository.js';
import type { NotificationInput } from './notification.schemas.js';

export const DEFAULT_EXPIRY_WINDOW_DAYS = 7;

/** Business rules, transactions and audit. No SQL (see repository) and no HTTP (see controller). */
export class NotificationService {
  constructor(
    private readonly pool: DbPool,
    private readonly repo: NotificationRepository = new NotificationRepository(pool),
  ) {}

  async list(q: PageQuery, status?: string) {
    const rows = await this.repo.list(status, q.pageSize, pageOffset(q));
    const total = await this.repo.count(status);
    return newPage(rows.map(toNotificationResponse), q.page, q.pageSize, total);
  }

  /** Active memberships ending within the next `days` days (IST). `db` may be a tx client. */
  async expiring(days: number, db: Db = this.pool): Promise<ExpiringItem[]> {
    return (await this.repo.findExpiring(days, db)).map(toExpiringItem);
  }

  async expired(): Promise<ExpiringItem[]> {
    return (await this.repo.findExpired()).map(toExpiringItem);
  }

  async create(actor: string, req: NotificationInput) {
    const n = await withTx(this.pool, async (tx) => {
      let row;
      try {
        row = await this.repo.insert(req, tx);
      } catch (err) {
        if (isUniqueViolation(err)) {
          throw conflict('NOTIFICATION_DEDUPED', 'A notification of this type was already created for this member today.');
        }
        if (isForeignKeyViolation(err)) throw badRequest('INVALID_REFERENCE', 'Member or membership not found.');
        throw err;
      }
      await auditLog(tx, {
        userId: actor, action: 'CREATE', entityType: 'NOTIFICATION', entityId: row.id,
        description: `Notification ${req.type} via ${req.channel}`,
      });
      return row;
    });
    return toNotificationResponse(n);
  }

  /** Daily job: flips overdue ACTIVE memberships to EXPIRED inside the job's tx. Returns rows changed. */
  expireOverdueMemberships(tx: Db): Promise<number> {
    return NotificationRepository.expireOverdueMemberships(tx);
  }

  /** Daily job: queues IN_APP expiry reminders. Idempotent via the daily dedupe unique index. */
  async queueExpiryReminders(tx: Db, days = DEFAULT_EXPIRY_WINDOW_DAYS): Promise<{ inserted: number; candidates: number }> {
    const expiring = await this.expiring(days, tx);
    let inserted = 0;
    for (const m of expiring) {
      const msg = `Hi ${m.firstName}, your membership expires on ${m.endDate}.`;
      inserted += await this.repo.insertReminderIfAbsent(m.memberId, m.membershipId, msg, tx);
    }
    return { inserted, candidates: expiring.length };
  }
}
