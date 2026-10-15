import { auditLog } from '../../common/audit.js';
import { nextCode } from '../../common/codegen.js';
import { badRequest, conflict, notFound } from '../../common/errors.js';
import { newPage, pageOffset, type PageQuery } from '../../common/pagination.js';
import { isForeignKeyViolation, withTx, type DbPool } from '../../db/pool.js';
import { toAssignmentResponse, toTrainerResponse } from './trainer.model.js';
import type { TrainerRepository } from './trainer.repository.js';
import type { CreateTrainerInput, UpdateTrainerInput } from './trainer.schemas.js';

/** Business rules, transactions and audit. No SQL (see repository) and no HTTP (see controller). */
export class TrainerService {
  constructor(
    private readonly pool: DbPool,
    private readonly repo: TrainerRepository,
  ) {}

  async getById(id: string) {
    const row = await this.repo.findById(id);
    if (!row) throw notFound('TRAINER_NOT_FOUND', 'Trainer not found.');
    return toTrainerResponse(row);
  }

  async list(q: PageQuery, f: { status?: string }) {
    const rows = await this.repo.list(f.status, q.pageSize, pageOffset(q));
    const total = await this.repo.count(f.status);
    return newPage(rows.map(toTrainerResponse), q.page, q.pageSize, total);
  }

  async create(actor: string, req: CreateTrainerInput) {
    const created = await withTx(this.pool, async (tx) => {
      const code = await nextCode(tx, 'trainer');
      const t = await this.repo.insert(code, req, tx);
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
      const t = await this.repo.update(id, req, tx);
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
      const existing = await this.repo.findById(id, tx);
      if (!existing) throw notFound('TRAINER_NOT_FOUND', 'Trainer not found.');
      try {
        await this.repo.delete(id, tx);
      } catch (err) {
        if (isForeignKeyViolation(err)) {
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
      const existing = await this.repo.findActiveAssignment(memberId, tx);
      if (existing) await this.repo.endAssignment(existing.id, tx);
      let a;
      try {
        a = await this.repo.insertAssignment(memberId, trainerId, tx);
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
    const row = await this.repo.findActiveAssignment(memberId);
    if (!row) throw notFound('ASSIGNMENT_NOT_FOUND', 'No active trainer assignment for this member.');
    return toAssignmentResponse(row);
  }

  async endAssignment(actor: string, memberId: string) {
    await withTx(this.pool, async (tx) => {
      const existing = await this.repo.findActiveAssignment(memberId, tx);
      if (!existing) throw notFound('ASSIGNMENT_NOT_FOUND', 'No active trainer assignment for this member.');
      await this.repo.endAssignment(existing.id, tx);
      await auditLog(tx, {
        userId: actor, action: 'DELETE', entityType: 'TRAINER', entityId: existing.trainer_id,
        description: `Ended trainer assignment for member ${memberId}`,
      });
    });
  }
}
