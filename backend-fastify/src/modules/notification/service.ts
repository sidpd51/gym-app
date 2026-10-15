import { auditLog } from '../../common/audit.js';
import { badRequest, conflict } from '../../common/errors.js';
import { newPage, pageOffset, type PageQuery } from '../../common/pagination.js';
import { isForeignKeyViolation, isUniqueViolation, queryMany, queryOne, withTx, type Db, type DbPool } from '../../db/pool.js';

export const DEFAULT_EXPIRY_WINDOW_DAYS = 7;

export interface NotificationInput {
  memberId: string;
  membershipId: string;
  type: string;
  channel: string;
  message: string;
}

const toResponse = (n: any) => ({
  id: n.id,
  memberId: n.member_id,
  membershipId: n.membership_id,
  type: n.type,
  channel: n.channel,
  status: n.status,
  message: n.message,
  createdAt: n.created_at,
  sentAt: n.sent_at,
});

const toItem = (r: any) => ({
  membershipId: r.membership_id,
  memberId: r.member_id,
  firstName: r.first_name,
  lastName: r.last_name,
  phone: r.phone,
  endDate: r.end_date as string,
});

export type ExpiringItem = ReturnType<typeof toItem>;

const STATUS_FILTER = 'WHERE ($1::notification_status IS NULL OR status = $1::notification_status)';

export class NotificationService {
  constructor(private readonly pool: DbPool) {}

  async list(q: PageQuery, status?: string) {
    const rows = await queryMany(
      this.pool,
      `SELECT * FROM notification_records ${STATUS_FILTER} ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [status || null, q.pageSize, pageOffset(q)],
    );
    const total = (await queryOne<{ count: number }>(
      this.pool, `SELECT COUNT(*) FROM notification_records ${STATUS_FILTER}`, [status || null],
    ))!.count;
    return newPage(rows.map(toResponse), q.page, q.pageSize, total);
  }

  /** Active memberships ending within the next `days` days (IST). `db` may be a tx client. */
  async expiring(days: number, db: Db = this.pool): Promise<ExpiringItem[]> {
    const rows = await queryMany(
      db,
      `SELECT m.id AS membership_id, m.end_date AS end_date, mb.id AS member_id, mb.first_name, mb.last_name, mb.phone
       FROM memberships m JOIN members mb ON mb.id = m.member_id
       WHERE m.status = 'ACTIVE'
         AND m.end_date >= (NOW() AT TIME ZONE 'Asia/Kolkata')::date
         AND m.end_date <= ((NOW() AT TIME ZONE 'Asia/Kolkata')::date + $1::int)`,
      [days],
    );
    return rows.map(toItem);
  }

  async expired(): Promise<ExpiringItem[]> {
    const rows = await queryMany(
      this.pool,
      `SELECT m.id AS membership_id, m.end_date AS end_date, mb.id AS member_id, mb.first_name, mb.last_name, mb.phone
       FROM memberships m JOIN members mb ON mb.id = m.member_id
       WHERE m.status = 'EXPIRED'
          OR (m.status = 'ACTIVE' AND m.end_date < (NOW() AT TIME ZONE 'Asia/Kolkata')::date)`,
    );
    return rows.map(toItem);
  }

  async create(actor: string, req: NotificationInput) {
    const n = await withTx(this.pool, async (tx) => {
      let row: any;
      try {
        row = await queryOne(
          tx,
          `INSERT INTO notification_records (member_id, membership_id, type, channel, status, message)
           VALUES ($1, $2, $3, $4, 'PENDING', $5) RETURNING *`,
          [req.memberId, req.membershipId, req.type, req.channel, req.message],
        );
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
    return toResponse(n);
  }
}
