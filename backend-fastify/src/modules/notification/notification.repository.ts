import { exec, newId, queryMany, queryOne, type Db, type DbPool } from '../../db/pool.js';
import type { ExpiringRow, NotificationRow } from './notification.model.js';
import type { NotificationInput } from './notification.schemas.js';

const STATUS_FILTER = 'WHERE (? IS NULL OR status = ?)';
const statusParams = (status: string | undefined) => [status || null, status || null];

/** Today's calendar date in IST (UTC+05:30, no DST). */
const TODAY_IST = 'DATE(DATE_ADD(UTC_TIMESTAMP(), INTERVAL 330 MINUTE))';

/** Data access for notification_records plus the membership queries behind reminders. All SQL lives here. */
export class NotificationRepository {
  constructor(private readonly pool: DbPool) {}

  list(status: string | undefined, limit: number, offset: number, db: Db = this.pool) {
    return queryMany<NotificationRow>(
      db,
      `SELECT * FROM notification_records ${STATUS_FILTER} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...statusParams(status), limit, offset],
    );
  }

  async count(status: string | undefined, db: Db = this.pool): Promise<number> {
    const row = await queryOne<{ count: number }>(
      db, `SELECT COUNT(*) AS count FROM notification_records ${STATUS_FILTER}`, statusParams(status),
    );
    return row!.count;
  }

  /** Active memberships ending within the next `days` days (IST). */
  findExpiring(days: number, db: Db = this.pool) {
    return queryMany<ExpiringRow>(
      db,
      `SELECT m.id AS membership_id, m.end_date AS end_date, mb.id AS member_id, mb.first_name, mb.last_name, mb.phone
       FROM memberships m JOIN members mb ON mb.id = m.member_id
       WHERE m.status = 'ACTIVE'
         AND m.end_date >= ${TODAY_IST}
         AND m.end_date <= DATE_ADD(${TODAY_IST}, INTERVAL ? DAY)`,
      [days],
    );
  }

  findExpired(db: Db = this.pool) {
    return queryMany<ExpiringRow>(
      db,
      `SELECT m.id AS membership_id, m.end_date AS end_date, mb.id AS member_id, mb.first_name, mb.last_name, mb.phone
       FROM memberships m JOIN members mb ON mb.id = m.member_id
       WHERE m.status = 'EXPIRED'
          OR (m.status = 'ACTIVE' AND m.end_date < ${TODAY_IST})`,
    );
  }

  async insert(req: NotificationInput, db: Db = this.pool): Promise<NotificationRow> {
    const id = newId();
    await exec(
      db,
      `INSERT INTO notification_records (id, member_id, membership_id, type, channel, status, message)
       VALUES (?, ?, ?, ?, ?, 'PENDING', ?)`,
      [id, req.memberId, req.membershipId, req.type, req.channel, req.message],
    );
    return (await queryOne<NotificationRow>(db, 'SELECT * FROM notification_records WHERE id = ?', [id]))!;
  }

  /**
   * Inserts an IN_APP EXPIRY_REMINDER unless today's dedupe index already has one.
   * INSERT IGNORE (not catching the violation) so a duplicate never fails the surrounding tx.
   * Returns rows inserted (0 or 1).
   */
  insertReminderIfAbsent(memberId: string, membershipId: string, message: string, db: Db = this.pool) {
    return exec(
      db,
      `INSERT IGNORE INTO notification_records (id, member_id, membership_id, type, channel, status, message)
       VALUES (?, ?, ?, 'EXPIRY_REMINDER', 'IN_APP', 'PENDING', ?)`,
      [newId(), memberId, membershipId, message],
    );
  }

  /** Flips ACTIVE memberships past their end date to EXPIRED. Returns rows changed. Stateless: takes only an executor. */
  static expireOverdueMemberships(db: Db): Promise<number> {
    return exec(db, `UPDATE memberships SET status = 'EXPIRED' WHERE status = 'ACTIVE' AND end_date < ${TODAY_IST}`);
  }
}
