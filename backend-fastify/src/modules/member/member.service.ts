import { auditLog } from '../../common/audit.js';
import { nextCode } from '../../common/codegen.js';
import { badRequest, conflict, notFound } from '../../common/errors.js';
import { newPage, pageOffset, type PageQuery } from '../../common/pagination.js';
import { todayIST } from '../../common/time.js';
import { isForeignKeyViolation, isUniqueViolation, withTx, type DbPool } from '../../db/pool.js';
import { toMemberResponse } from './member.model.js';
import type { MemberRepository } from './member.repository.js';
import type { CreateMemberInput, UpdateMemberInput } from './member.schemas.js';

/** Business rules, transactions and audit. No SQL (see repository) and no HTTP (see controller). */
export class MemberService {
  constructor(
    private readonly pool: DbPool,
    private readonly repo: MemberRepository,
  ) {}

  async getById(id: string) {
    const row = await this.repo.findById(id);
    if (!row) throw notFound('MEMBER_NOT_FOUND', 'Member not found.');
    return toMemberResponse(row);
  }

  async list(q: PageQuery, f: { status?: string }) {
    const filter = { status: f.status, search: q.search };
    const rows = await this.repo.list(filter, q.pageSize, pageOffset(q));
    const total = await this.repo.count(filter);
    return newPage(rows.map(toMemberResponse), q.page, q.pageSize, total);
  }

  async create(actor: string, req: CreateMemberInput) {
    if (await this.repo.existsByPhone(req.phone)) {
      throw conflict('MEMBER_PHONE_DUPLICATE', 'A member with this phone number already exists.');
    }
    if (req.dateOfBirth && req.dateOfBirth >= todayIST()) {
      throw badRequest('DOB_NOT_PAST', 'dateOfBirth must be in the past.');
    }

    const created = await withTx(this.pool, async (tx) => {
      const code = await nextCode(tx, 'member');
      let m;
      try {
        m = await this.repo.insert(code, req, tx);
      } catch (err) {
        if (isUniqueViolation(err)) throw conflict('MEMBER_PHONE_DUPLICATE', 'A member with this phone number already exists.');
        throw err;
      }
      await auditLog(tx, {
        userId: actor, action: 'CREATE', entityType: 'MEMBER', entityId: m.id,
        entityName: `${m.first_name} ${m.last_name}`, description: `Created member ${m.member_code}`,
      });
      return m;
    });
    return toMemberResponse(created);
  }

  async update(actor: string, id: string, req: UpdateMemberInput) {
    const updated = await withTx(this.pool, async (tx) => {
      const m = await this.repo.update(id, req, tx);
      if (!m) throw notFound('MEMBER_NOT_FOUND', 'Member not found.');
      await auditLog(tx, {
        userId: actor, action: 'UPDATE', entityType: 'MEMBER', entityId: m.id,
        entityName: `${m.first_name} ${m.last_name}`, description: 'Updated member',
      });
      return m;
    });
    return toMemberResponse(updated);
  }

  async delete(actor: string, id: string) {
    await withTx(this.pool, async (tx) => {
      const existing = await this.repo.findById(id, tx);
      if (!existing) throw notFound('MEMBER_NOT_FOUND', 'Member not found.');
      try {
        await this.repo.delete(id, tx);
      } catch (err) {
        if (isForeignKeyViolation(err)) {
          throw conflict(
            'MEMBER_REFERENCED',
            'This member cannot be deleted because they have related records (memberships, payments, attendance).',
          );
        }
        throw err;
      }
      await auditLog(tx, {
        userId: actor, action: 'DELETE', entityType: 'MEMBER', entityId: id,
        entityName: `${existing.first_name} ${existing.last_name}`, description: `Deleted member ${existing.member_code}`,
      });
    });
  }

  /** Skeleton detail: supplemental slices are empty, as in the Go service. */
  async details(id: string) {
    return {
      member: await this.getById(id),
      membershipHistory: [],
      paymentHistory: [],
      attendanceHistory: [],
      activeTrainer: null,
    };
  }
}
