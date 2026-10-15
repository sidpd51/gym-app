import { exec, queryMany, queryOne, type Db, type DbPool } from '../../db/pool.js';
import type { ExpiringRow, NotificationRow } from './notification.model.js';
import type { NotificationInput } from './notification.schemas.js';

const STATUS_FILTER = 'WHERE ($1::notification_status IS NULL OR status = $1::notification_status)';

/** Data access for notification_records plus the membership queries behind reminders. All SQL lives here. */
export class NotificationRepository {
  constructor(private readonly pool: DbPool) {}

  list(status: string | undefined, limit: number, offset: number, db: Db = this.pool) {
    return queryMany<NotificationRow>(
      db,
      `SELECT * FROM notification_records ${STATUS_FILTER} ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [status || null, limit, offset],
    );
  }

  async count(status: string | undefined, db: Db = this.pool): Promise<number> {
    const row = await queryOne<{ count: number }>(
      db, `SELECT COUNT(*) AS count FROM notification_records ${STATUS_FILTER}`, [status || null],
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
         AND m.end_date >= (NOW() AT TIME ZONE 'Asia/Kolkata')::date
         AND m.end_date <= ((NOW() AT TIME ZONE 'Asia/Kolkata')::date + $1::int)`,
      [days],
    );
  }

  findExpired(db: Db = this.pool) {
    return queryMany<ExpiringRow>(
      db,
      `SELECT m.id AS membership_id, m.end_date AS end_date, mb.id AS member_id, mb.first_name, mb.last_name, mb.phone
       FROM memberships m JOIN members mb ON mb.id = m.member_id
       WHERE m.status = 'EXPIRED'
          OR (m.status = 'ACTIVE' AND m.end_date < (NOW() AT TIME ZONE 'Asia/Kolkata')::date)`,
    );
  }

  async insert(req: NotificationInput, db: Db = this.pool): Promise<NotificationRow> {
    const row = await queryOne<NotificationRow>(
      db,
      `INSERT INTO notification_records (member_id, membership_id, type, channel, status, message)
       VALUES ($1, $2, $3, $4, 'PENDING', $5) RETURNING *`,
      [req.memberId, req.membershipId, req.type, req.channel, req.message],
    );
    return row!;
  }

  /**
   * Inserts an IN_APP EXPIRY_REMINDER unless today's dedupe index already has one.
   * ON CONFLICT DO NOTHING (not catching the violation) because an error would abort the surrounding tx.
   * Returns rows inserted (0 or 1).
   */
  insertReminderIfAbsent(memberId: string, membershipId: string, message: string, db: Db = this.pool) {
    return exec(
      db,
      `INSERT INTO notification_records (member_id, membership_id, type, channel, status, message)
       VALUES ($1, $2, 'EXPIRY_REMINDER', 'IN_APP', 'PENDING', $3)
       ON CONFLICT DO NOTHING`,
      [memberId, membershipId, message],
    );
  }

  /** Flips ACTIVE memberships past their end date to EXPIRED. Returns rows changed. Stateless: takes only an executor. */
  static expireOverdueMemberships(db: Db): Promise<number> {
    return exec(db, "UPDATE memberships SET status = 'EXPIRED' WHERE status = 'ACTIVE' AND end_date < CURRENT_DATE");
  }
}
