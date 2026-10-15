import { exec, queryMany, queryOne, type Db, type DbPool } from '../../db/pool.js';
import type { AssignmentRow, TrainerRow } from './trainer.model.js';
import type { CreateTrainerInput, UpdateTrainerInput } from './trainer.schemas.js';

const STATUS_FILTER = `WHERE ($1::trainer_status IS NULL OR status = $1::trainer_status)`;

/**
 * Data access for `trainers` and `member_trainer_assignments`. All SQL for the
 * module lives here; no business rules. Methods accept an optional executor so
 * the service can run them inside a transaction.
 */
export class TrainerRepository {
  constructor(private readonly pool: DbPool) {}

  findById(id: string, db: Db = this.pool) {
    return queryOne<TrainerRow>(db, 'SELECT * FROM trainers WHERE id = $1', [id]);
  }

  list(status: string | undefined, limit: number, offset: number, db: Db = this.pool) {
    return queryMany<TrainerRow>(
      db,
      `SELECT * FROM trainers ${STATUS_FILTER} ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [status || null, limit, offset],
    );
  }

  async count(status: string | undefined, db: Db = this.pool): Promise<number> {
    const row = await queryOne<{ count: number }>(db, `SELECT COUNT(*) FROM trainers ${STATUS_FILTER}`, [status || null]);
    return row!.count;
  }

  async insert(code: string, req: CreateTrainerInput, db: Db = this.pool): Promise<TrainerRow> {
    const row = await queryOne<TrainerRow>(
      db,
      `INSERT INTO trainers (trainer_code, first_name, last_name, phone, email, specialization, joining_date, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'ACTIVE') RETURNING *`,
      [code, req.firstName, req.lastName, req.phone, req.email ?? null, req.specialization ?? null, req.joiningDate],
    );
    return row!;
  }

  /** Partial update: null/undefined fields are left unchanged. Undefined result = no such trainer. */
  update(id: string, req: UpdateTrainerInput, db: Db = this.pool) {
    return queryOne<TrainerRow>(
      db,
      `UPDATE trainers
       SET first_name = COALESCE($2, first_name), last_name = COALESCE($3, last_name),
           phone = COALESCE($4, phone), email = COALESCE($5, email),
           specialization = COALESCE($6, specialization), status = COALESCE($7::trainer_status, status),
           updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, req.firstName ?? null, req.lastName ?? null, req.phone ?? null, req.email ?? null,
       req.specialization ?? null, req.status ?? null],
    );
  }

  delete(id: string, db: Db = this.pool) {
    return exec(db, 'DELETE FROM trainers WHERE id = $1', [id]);
  }

  findActiveAssignment(memberId: string, db: Db = this.pool) {
    return queryOne<AssignmentRow>(
      db,
      `SELECT * FROM member_trainer_assignments WHERE member_id = $1 AND status = 'ACTIVE' LIMIT 1`,
      [memberId],
    );
  }

  endAssignment(assignmentId: string, db: Db = this.pool) {
    return exec(
      db,
      `UPDATE member_trainer_assignments SET status = 'ENDED', end_date = CURRENT_DATE WHERE id = $1`,
      [assignmentId],
    );
  }

  async insertAssignment(memberId: string, trainerId: string, db: Db = this.pool): Promise<AssignmentRow> {
    const row = await queryOne<AssignmentRow>(
      db,
      `INSERT INTO member_trainer_assignments (member_id, trainer_id, start_date, status)
       VALUES ($1, $2, CURRENT_DATE, 'ACTIVE') RETURNING *`,
      [memberId, trainerId],
    );
    return row!;
  }
}
