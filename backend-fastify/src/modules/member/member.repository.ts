import { exec, newId, queryMany, queryOne, type Db, type DbPool } from '../../db/pool.js';
import type { MemberRow } from './member.model.js';
import type { CreateMemberInput, UpdateMemberInput } from './member.schemas.js';

// LIKE is case-insensitive under the default utf8mb4_0900_ai_ci collation (was ILIKE).
const FILTER = `WHERE (? IS NULL OR status = ?)
  AND (? IS NULL
       OR first_name LIKE CONCAT('%', ?, '%')
       OR last_name  LIKE CONCAT('%', ?, '%')
       OR phone      LIKE CONCAT('%', ?, '%')
       OR member_code LIKE CONCAT('%', ?, '%'))`;
const filterParams = (f: { status?: string; search?: string }) => {
  const status = f.status || null;
  const search = f.search || null;
  return [status, status, search, search, search, search, search];
};

/**
 * Data access for `members`. Contains ALL SQL for this module and no business
 * rules: it returns rows (or undefined) and lets driver errors propagate.
 * Every method takes an optional executor so the service can run it inside a transaction.
 */
export class MemberRepository {
  constructor(private readonly pool: DbPool) {}

  findById(id: string, db: Db = this.pool) {
    return queryOne<MemberRow>(db, 'SELECT * FROM members WHERE id = ?', [id]);
  }

  async existsByPhone(phone: string, db: Db = this.pool): Promise<boolean> {
    return (await queryOne(db, 'SELECT 1 FROM members WHERE phone = ?', [phone])) !== undefined;
  }

  list(f: { status?: string; search?: string }, limit: number, offset: number, db: Db = this.pool) {
    return queryMany<MemberRow>(
      db,
      `SELECT * FROM members ${FILTER} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...filterParams(f), limit, offset],
    );
  }

  async count(f: { status?: string; search?: string }, db: Db = this.pool): Promise<number> {
    const row = await queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM members ${FILTER}`, filterParams(f));
    return row!.count;
  }

  async insert(code: string, req: CreateMemberInput, db: Db = this.pool): Promise<MemberRow> {
    const id = newId();
    await exec(
      db,
      `INSERT INTO members (id, member_code, first_name, last_name, phone, email, status, joining_date,
         date_of_birth, gender, address, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship)
       VALUES (?,?,?,?,?,?,'ACTIVE',?,?,?,?,?,?,?)`,
      [
        id, code, req.firstName, req.lastName, req.phone, req.email || null, req.joiningDate,
        req.dateOfBirth ?? null, req.gender ?? null, req.address ?? null,
        req.emergencyContactName ?? null, req.emergencyContactPhone ?? null, req.emergencyContactRelationship ?? null,
      ],
    );
    return (await this.findById(id, db))!;
  }

  /** Partial update: null/undefined fields are left unchanged. Undefined result = no such member. */
  async update(id: string, req: UpdateMemberInput, db: Db = this.pool) {
    const matched = await exec(
      db,
      `UPDATE members
       SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name),
           email = COALESCE(?, email), status = COALESCE(?, status),
           date_of_birth = COALESCE(?, date_of_birth), gender = COALESCE(?, gender),
           address = COALESCE(?, address), emergency_contact_name = COALESCE(?, emergency_contact_name),
           emergency_contact_phone = COALESCE(?, emergency_contact_phone),
           emergency_contact_relationship = COALESCE(?, emergency_contact_relationship),
           updated_at = NOW(3)
       WHERE id = ?`,
      [
        req.firstName ?? null, req.lastName ?? null, req.email ?? null, req.status ?? null,
        req.dateOfBirth ?? null, req.gender ?? null, req.address ?? null,
        req.emergencyContactName ?? null, req.emergencyContactPhone ?? null, req.emergencyContactRelationship ?? null,
        id,
      ],
    );
    return matched ? this.findById(id, db) : undefined;
  }

  delete(id: string, db: Db = this.pool) {
    return exec(db, 'DELETE FROM members WHERE id = ?', [id]);
  }
}
