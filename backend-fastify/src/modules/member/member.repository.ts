import { exec, queryMany, queryOne, type Db, type DbPool } from '../../db/pool.js';
import type { MemberRow } from './member.model.js';
import type { CreateMemberInput, UpdateMemberInput } from './member.schemas.js';

const FILTER = `WHERE ($1::member_status IS NULL OR status = $1::member_status)
  AND ($2::text IS NULL
       OR first_name ILIKE '%' || $2::text || '%'
       OR last_name  ILIKE '%' || $2::text || '%'
       OR phone      ILIKE '%' || $2::text || '%'
       OR member_code ILIKE '%' || $2::text || '%')`;

/**
 * Data access for `members`. Contains ALL SQL for this module and no business
 * rules: it returns rows (or undefined) and lets driver errors propagate.
 * Every method takes an optional executor so the service can run it inside a transaction.
 */
export class MemberRepository {
  constructor(private readonly pool: DbPool) {}

  findById(id: string, db: Db = this.pool) {
    return queryOne<MemberRow>(db, 'SELECT * FROM members WHERE id = $1', [id]);
  }

  async existsByPhone(phone: string, db: Db = this.pool): Promise<boolean> {
    return (await queryOne(db, 'SELECT 1 FROM members WHERE phone = $1', [phone])) !== undefined;
  }

  list(f: { status?: string; search?: string }, limit: number, offset: number, db: Db = this.pool) {
    return queryMany<MemberRow>(
      db,
      `SELECT * FROM members ${FILTER} ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
      [f.status || null, f.search || null, limit, offset],
    );
  }

  async count(f: { status?: string; search?: string }, db: Db = this.pool): Promise<number> {
    const row = await queryOne<{ count: number }>(db, `SELECT COUNT(*) FROM members ${FILTER}`, [f.status || null, f.search || null]);
    return row!.count;
  }

  async insert(code: string, req: CreateMemberInput, db: Db = this.pool): Promise<MemberRow> {
    const row = await queryOne<MemberRow>(
      db,
      `INSERT INTO members (member_code, first_name, last_name, phone, email, status, joining_date,
         date_of_birth, gender, address, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship)
       VALUES ($1,$2,$3,$4,$5,'ACTIVE',$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        code, req.firstName, req.lastName, req.phone, req.email || null, req.joiningDate,
        req.dateOfBirth ?? null, req.gender ?? null, req.address ?? null,
        req.emergencyContactName ?? null, req.emergencyContactPhone ?? null, req.emergencyContactRelationship ?? null,
      ],
    );
    return row!;
  }

  /** Partial update: null/undefined fields are left unchanged. Undefined result = no such member. */
  update(id: string, req: UpdateMemberInput, db: Db = this.pool) {
    return queryOne<MemberRow>(
      db,
      `UPDATE members
       SET first_name = COALESCE($2, first_name), last_name = COALESCE($3, last_name),
           email = COALESCE($4, email), status = COALESCE($5::member_status, status),
           date_of_birth = COALESCE($6, date_of_birth), gender = COALESCE($7, gender),
           address = COALESCE($8, address), emergency_contact_name = COALESCE($9, emergency_contact_name),
           emergency_contact_phone = COALESCE($10, emergency_contact_phone),
           emergency_contact_relationship = COALESCE($11, emergency_contact_relationship),
           updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [
        id, req.firstName ?? null, req.lastName ?? null, req.email ?? null, req.status ?? null,
        req.dateOfBirth ?? null, req.gender ?? null, req.address ?? null,
        req.emergencyContactName ?? null, req.emergencyContactPhone ?? null, req.emergencyContactRelationship ?? null,
      ],
    );
  }

  delete(id: string, db: Db = this.pool) {
    return exec(db, 'DELETE FROM members WHERE id = $1', [id]);
  }
}
