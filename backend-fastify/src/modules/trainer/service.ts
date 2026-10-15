import { auditLog } from '../../common/audit.js';
import { nextCode } from '../../common/codegen.js';
import { badRequest, conflict, notFound } from '../../common/errors.js';
import { newPage, pageOffset, type PageQuery } from '../../common/pagination.js';
import { exec, isForeignKeyViolation, queryMany, queryOne, withTx, type DbPool } from '../../db/pool.js';

interface TrainerRow {
  id: string; trainer_code: string; first_name: string; last_name: string; phone: string;
  email: string | null; specialization: string | null; joining_date: string; status: string; created_at: Date;
}
interface AssignmentRow {
  id: string; member_id: string; trainer_id: string; start_date: string; end_date: string | null;
  status: string; created_at: Date;
}

export const toTrainerResponse = (t: TrainerRow) => ({
  id: t.id,
  trainerCode: t.trainer_code,
  firstName: t.first_name,
  lastName: t.last_name,
  phone: t.phone,
  email: t.email,
  specialization: t.specialization,
  joiningDate: t.joining_date,
  status: t.status,
  createdAt: t.created_at,
});

const toAssignmentResponse = (a: AssignmentRow) => ({
  id: a.id,
  memberId: a.member_id,
  trainerId: a.trainer_id,
  startDate: a.start_date,
  endDate: a.end_date,
  status: a.status,
  createdAt: a.created_at,
});

type Nullish<T> = { [K in keyof T]?: T[K] | null };
export interface CreateTrainerInput {
  firstName: string; lastName: string; phone: string; email?: string | null;
  specialization?: string | null; joiningDate: string;
}
export type UpdateTrainerInput = Nullish<Omit<CreateTrainerInput, 'joiningDate'>> & { status?: string | null };

const ACTIVE_ASSIGNMENT = `SELECT * FROM member_trainer_assignments WHERE member_id = $1 AND status = 'ACTIVE' LIMIT 1`;
const END_ASSIGNMENT = `UPDATE member_trainer_assignments SET status = 'ENDED', end_date = CURRENT_DATE WHERE id = $1`;

export class TrainerService {
  constructor(private readonly pool: DbPool) {}

  async getByID(id: string) {
    const row = await queryOne<TrainerRow>(this.pool, 'SELECT * FROM trainers WHERE id = $1', [id]);
    if (!row) throw notFound('TRAINER_NOT_FOUND', 'Trainer not found.');
    return toTrainerResponse(row);
  }

  async list(q: PageQuery, f: { status?: string }) {
    const status = f.status || null;
    const where = `WHERE ($1::trainer_status IS NULL OR status = $1::trainer_status)`;
    const rows = await queryMany<TrainerRow>(
      this.pool,
      `SELECT * FROM trainers ${where} ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [status, q.pageSize, pageOffset(q)],
    );
    const total = (await queryOne<{ count: number }>(this.pool, `SELECT COUNT(*) FROM trainers ${where}`, [status]))!.count;
    return newPage(rows.map(toTrainerResponse), q.page, q.pageSize, total);
  }

  async create(actor: string, req: CreateTrainerInput) {
    const created = await withTx(this.pool, async (tx) => {
      const code = await nextCode(tx, 'trainer');
      const t = (await queryOne<TrainerRow>(
        tx,
        `INSERT INTO trainers (trainer_code, first_name, last_name, phone, email, specialization, joining_date, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'ACTIVE') RETURNING *`,
        [code, req.firstName, req.lastName, req.phone, req.email ?? null, req.specialization ?? null, req.joiningDate],
      ))!;
      await auditLog(tx, {
        userId: actor, action: 'CREATE', entityType: 'TRAINER', entityId: t.id,
        entityName: `${t.first_name} ${t.last_name}`, description: `Created trainer ${t.trainer_code}`,
      });
      return t;
    });
    return toTrainerResponse(created);
  }

  async update(actor: string, id: string, req: UpdateTrainerInput) {
    const updated = await withTx(this.pool, async (tx) => {
      const t = await queryOne<TrainerRow>(
        tx,
        `UPDATE trainers
         SET first_name = COALESCE($2, first_name), last_name = COALESCE($3, last_name),
             phone = COALESCE($4, phone), email = COALESCE($5, email),
             specialization = COALESCE($6, specialization), status = COALESCE($7::trainer_status, status),
             updated_at = NOW()
         WHERE id = $1 RETURNING *`,
        [id, req.firstName ?? null, req.lastName ?? null, req.phone ?? null, req.email ?? null,
         req.specialization ?? null, req.status ?? null],
      );
      if (!t) throw notFound('TRAINER_NOT_FOUND', 'Trainer not found.');
      await auditLog(tx, {
        userId: actor, action: 'UPDATE', entityType: 'TRAINER', entityId: t.id,
        entityName: `${t.first_name} ${t.last_name}`, description: 'Updated trainer',
      });
      return t;
    });
    return toTrainerResponse(updated);
  }

  async delete(actor: string, id: string) {
    await withTx(this.pool, async (tx) => {
      const existing = await queryOne<TrainerRow>(tx, 'SELECT * FROM trainers WHERE id = $1', [id]);
      if (!existing) throw notFound('TRAINER_NOT_FOUND', 'Trainer not found.');
      try {
        await exec(tx, 'DELETE FROM trainers WHERE id = $1', [id]);
      } catch (err) {
        // ON DELETE RESTRICT raises 23001 (restrict_violation), not 23503; the Go code only checked 23503 and leaked a 500.
        if (isForeignKeyViolation(err) || (err as { code?: string }).code === '23001') {
          throw conflict('TRAINER_REFERENCED', 'This trainer has active assignments and cannot be deleted.');
        }
        throw err;
      }
      await auditLog(tx, {
        userId: actor, action: 'DELETE', entityType: 'TRAINER', entityId: id,
        entityName: `${existing.first_name} ${existing.last_name}`, description: `Deleted trainer ${existing.trainer_code}`,
      });
    });
  }

  /** Ends any active assignment for the member and creates a new one. */
  async assign(actor: string, memberId: string, trainerId: string) {
    const out = await withTx(this.pool, async (tx) => {
      const existing = await queryOne<AssignmentRow>(tx, ACTIVE_ASSIGNMENT, [memberId]);
      if (existing) await exec(tx, END_ASSIGNMENT, [existing.id]);
      let a: AssignmentRow;
      try {
        a = (await queryOne<AssignmentRow>(
          tx,
          `INSERT INTO member_trainer_assignments (member_id, trainer_id, start_date, status)
           VALUES ($1, $2, CURRENT_DATE, 'ACTIVE') RETURNING *`,
          [memberId, trainerId],
        ))!;
      } catch (err) {
        if (isForeignKeyViolation(err)) throw badRequest('INVALID_REFERENCE', 'Member or trainer not found.');
        throw err;
      }
      await auditLog(tx, {
        userId: actor, action: 'CREATE', entityType: 'TRAINER', entityId: trainerId,
        description: `Assigned trainer to member ${memberId}`,
      });
      return a;
    });
    return toAssignmentResponse(out);
  }

  async getAssignmentForMember(memberId: string) {
    const row = await queryOne<AssignmentRow>(this.pool, ACTIVE_ASSIGNMENT, [memberId]);
    if (!row) throw notFound('ASSIGNMENT_NOT_FOUND', 'No active trainer assignment for this member.');
    return toAssignmentResponse(row);
  }

  async endAssignment(actor: string, memberId: string) {
    await withTx(this.pool, async (tx) => {
      const existing = await queryOne<AssignmentRow>(tx, ACTIVE_ASSIGNMENT, [memberId]);
      if (!existing) throw notFound('ASSIGNMENT_NOT_FOUND', 'No active trainer assignment for this member.');
      await exec(tx, END_ASSIGNMENT, [existing.id]);
      await auditLog(tx, {
        userId: actor, action: 'DELETE', entityType: 'TRAINER', entityId: existing.trainer_id,
        description: `Ended trainer assignment for member ${memberId}`,
      });
    });
  }
}
