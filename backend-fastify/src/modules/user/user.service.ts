import bcrypt from 'bcryptjs';
import { auditLog } from '../../common/audit.js';
import { nextCode } from '../../common/codegen.js';
import { badRequest, businessRule, conflict, notFound } from '../../common/errors.js';
import { newPage, pageOffset, type PageQuery } from '../../common/pagination.js';
import { isForeignKeyViolation, isUniqueViolation, withTx, type DbPool } from '../../db/pool.js';
import { toUserResponse } from './user.model.js';
import type { UserRepository } from './user.repository.js';
import type { CreateUserInput, UpdateProfileInput, UpdateUserInput } from './user.schemas.js';

const BCRYPT_COST = 12;

/** Business rules, transactions and audit for users. No SQL, no HTTP. */
export class UserService {
  constructor(
    readonly pool: DbPool,
    private readonly repo: UserRepository,
  ) {}

  async getById(id: string) {
    const row = await this.repo.findById(id);
    if (!row) throw notFound('USER_NOT_FOUND', 'User not found.');
    return toUserResponse(row);
  }

  /** Raw row (with password hash) for login; undefined when no such email. */
  getByEmail(email: string) {
    return this.repo.findByEmail(email);
  }

  verifyPassword(hash: string, plain: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  markLoggedIn(id: string) {
    return this.repo.touchLastLogin(id);
  }

  async list(q: PageQuery, f: { role?: string; status?: string }) {
    const rows = await this.repo.list(f, q.pageSize, pageOffset(q));
    const total = await this.repo.count(f);
    return newPage(rows.map(toUserResponse), q.page, q.pageSize, total);
  }

  async create(actor: string, req: CreateUserInput) {
    const hash = await bcrypt.hash(req.password, BCRYPT_COST);
    const created = await withTx(this.pool, async (tx) => {
      const userCode = await nextCode(tx, 'user');
      let u;
      try {
        u = await this.repo.insert(
          {
            userCode, firstName: req.firstName, lastName: req.lastName, email: req.email.toLowerCase(),
            phone: req.phone || null, role: req.role, passwordHash: hash,
          },
          tx,
        );
      } catch (err) {
        if (isUniqueViolation(err)) throw conflict('USER_EMAIL_DUPLICATE', 'A user with this email already exists.');
        throw err;
      }
      await auditLog(tx, {
        userId: actor, action: 'CREATE', entityType: 'USER', entityId: u.id,
        entityName: `${u.first_name} ${u.last_name}`, description: `Created user ${u.email} (${u.role})`,
      });
      return u;
    });
    return toUserResponse(created);
  }

  async update(actor: string, id: string, req: UpdateUserInput) {
    const out = await withTx(this.pool, async (tx) => {
      const u = await this.repo.update(id, req, tx);
      if (!u) throw notFound('USER_NOT_FOUND', 'User not found.');
      await auditLog(tx, {
        userId: actor, action: 'UPDATE', entityType: 'USER', entityId: u.id,
        entityName: `${u.first_name} ${u.last_name}`, description: 'Updated user profile',
      });
      return u;
    });
    return toUserResponse(out);
  }

  async updateProfile(actor: string, req: UpdateProfileInput) {
    if (req.newPassword) {
      const existing = await this.repo.findById(actor);
      if (!existing) throw notFound('USER_NOT_FOUND', 'User not found.');
      if (!req.currentPassword) {
        throw badRequest('PROFILE_CURRENT_PASSWORD_REQUIRED', 'Current password is required to set a new password.');
      }
      if (!(await this.verifyPassword(existing.password_hash, req.currentPassword))) {
        throw badRequest('PROFILE_CURRENT_PASSWORD_INVALID', 'Current password is incorrect.');
      }
    }
    const newHash = req.newPassword ? await bcrypt.hash(req.newPassword, BCRYPT_COST) : null;

    const updated = await withTx(this.pool, async (tx) => {
      const u = await this.repo.updateProfile(actor, req, tx);
      if (!u) throw notFound('USER_NOT_FOUND', 'User not found.');
      if (newHash) await this.repo.updatePasswordHash(actor, newHash, tx);
      await auditLog(tx, {
        userId: actor, action: 'UPDATE', entityType: 'USER', entityId: actor,
        entityName: `${u.first_name} ${u.last_name}`, description: 'Updated own profile',
      });
      return u;
    });
    return toUserResponse(updated);
  }

  async delete(actor: string, id: string) {
    if (actor === id) throw businessRule('USER_SELF_DELETE_FORBIDDEN', 'You cannot delete your own account.');
    await withTx(this.pool, async (tx) => {
      const existing = await this.repo.findById(id, tx);
      if (!existing) throw notFound('USER_NOT_FOUND', 'User not found.');
      try {
        await this.repo.delete(id, tx);
      } catch (err) {
        if (isForeignKeyViolation(err)) {
          throw conflict('USER_REFERENCED', 'This user is referenced by audit logs and cannot be deleted.');
        }
        throw err;
      }
      await auditLog(tx, {
        userId: actor, action: 'DELETE', entityType: 'USER', entityId: id,
        entityName: `${existing.first_name} ${existing.last_name}`, description: `Deleted user ${existing.email}`,
      });
    });
  }
}
