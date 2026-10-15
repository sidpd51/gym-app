import { todayIST } from '../../common/time.js';
import { exec, newId, queryMany, queryOne, type Db, type DbPool } from '../../db/pool.js';
import type { AssignmentRow, TrainerRow } from './trainer.model.js';
import type { CreateTrainerInput, UpdateTrainerInput } from './trainer.schemas.js';

const STATUS_FILTER = `WHERE (? IS NULL OR status = ?)`;

/**
 * Data access for `trainers` and `member_trainer_assignments`. All SQL for the
 * module lives here; no business rules. Methods accept an optional executor so
 * the service can run them inside a transaction.
 */
export class TrainerRepository {
  constructor(private readonly pool: DbPool) {}

  findById(id: string, db: Db = this.pool) {
    return queryOne<TrainerRow>(db, 'SELECT * FROM trainers WHERE id = ?', [id]);
  }

  list(status: string | undefined, limit: number, offset: number, db: Db = this.pool) {
    return queryMany<TrainerRow>(
      db,
      `SELECT * FROM trainers ${STATUS_FILTER} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [status || null, status || null, limit, offset],
    );
  }

  async count(status: string | undefined, db: Db = this.pool): Promise<number> {
    const row = await queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM trainers ${STATUS_FILTER}`, [status || null, status || null]);
    return row!.count;
  }

  async insert(code: string, req: CreateTrainerInput, db: Db = this.pool): Promise<TrainerRow> {
    const id = newId();
    await exec(
      db,
      `INSERT INTO trainers (id, trainer_code, first_name, last_name, phone, email, specialization, joining_date, status)
       VALUES (?,?,?,?,?,?,?,?,'ACTIVE')`,
      [id, code, req.firstName, req.lastName, req.phone, req.email ?? null, req.specialization ?? null, req.joiningDate],
    );
    return (await this.findById(id, db))!;
  }

  /** Partial update: null/undefined fields are left unchanged. Undefined result = no such trainer. */
  async update(id: string, req: UpdateTrainerInput, db: Db = this.pool) {
    const matched = await exec(
      db,
      `UPDATE trainers
       SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name),
           phone = COALESCE(?, phone), email = COALESCE(?, email),
           specialization = COALESCE(?, specialization), status = COALESCE(?, status),
           updated_at = NOW(3)
       WHERE id = ?`,
      [req.firstName ?? null, req.lastName ?? null, req.phone ?? null, req.email ?? null,
       req.specialization ?? null, req.status ?? null, id],
    );
    return matched ? this.findById(id, db) : undefined;
  }

  delete(id: string, db: Db = this.pool) {
    return exec(db, 'DELETE FROM trainers WHERE id = ?', [id]);
  }

  findActiveAssignment(memberId: string, db: Db = this.pool) {
    return queryOne<AssignmentRow>(
      db,
      `SELECT * FROM member_trainer_assignments WHERE member_id = ? AND status = 'ACTIVE' LIMIT 1`,
      [memberId],
    );
  }

  endAssignment(assignmentId: string, db: Db = this.pool) {
    return exec(
      db,
      `UPDATE member_trainer_assignments SET status = 'ENDED', end_date = ? WHERE id = ?`,
      [todayIST(), assignmentId],
    );
  }

  async insertAssignment(memberId: string, trainerId: string, db: Db = this.pool): Promise<AssignmentRow> {
    const id = newId();
    await exec(
      db,
      `INSERT INTO member_trainer_assignments (id, member_id, trainer_id, start_date, status)
       VALUES (?, ?, ?, ?, 'ACTIVE')`,
      [id, memberId, trainerId, todayIST()],
    );
    return (await queryOne<AssignmentRow>(db, 'SELECT * FROM member_trainer_assignments WHERE id = ?', [id]))!;
  }
}
