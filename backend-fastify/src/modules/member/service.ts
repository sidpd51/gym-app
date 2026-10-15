import { auditLog } from '../../common/audit.js';
import { nextCode } from '../../common/codegen.js';
import { badRequest, conflict, notFound } from '../../common/errors.js';
import { newPage, pageOffset, type PageQuery } from '../../common/pagination.js';
import { todayIST } from '../../common/validate.js';
import { exec, isForeignKeyViolation, isUniqueViolation, queryMany, queryOne, withTx, type DbPool } from '../../db/pool.js';

interface MemberRow {
  id: string;
  member_code: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  status: string;
  joining_date: string;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  created_at: Date;
  updated_at: Date;
}

export function toMemberResponse(m: MemberRow) {
  return {
    id: m.id,
    memberCode: m.member_code,
    firstName: m.first_name,
    lastName: m.last_name,
    phone: m.phone,
    email: m.email,
    status: m.status,
    joiningDate: m.joining_date,
    dateOfBirth: m.date_of_birth,
    gender: m.gender,
    address: m.address,
    emergencyContactName: m.emergency_contact_name,
    emergencyContactPhone: m.emergency_contact_phone,
    emergencyContactRelationship: m.emergency_contact_relationship,
    createdAt: m.created_at,
    updatedAt: m.updated_at,
  };
}

const FILTER = `WHERE ($1::member_status IS NULL OR status = $1::member_status)
  AND ($2::text IS NULL
       OR first_name ILIKE '%' || $2::text || '%'
       OR last_name  ILIKE '%' || $2::text || '%'
       OR phone      ILIKE '%' || $2::text || '%'
       OR member_code ILIKE '%' || $2::text || '%')`;

type CreateInput = {
  firstName: string; lastName: string; phone: string; email?: string | null; joiningDate: string;
  dateOfBirth?: string | null; gender?: string | null; address?: string | null;
  emergencyContactName?: string | null; emergencyContactPhone?: string | null; emergencyContactRelationship?: string | null;
};
type Nullish<T> = { [K in keyof T]?: T[K] | null };
type UpdateInput = Nullish<Omit<CreateInput, 'phone' | 'joiningDate'>> & { status?: string | null };

export class MemberService {
  constructor(private readonly pool: DbPool) {}

  async getByID(id: string) {
    const row = await queryOne<MemberRow>(this.pool, 'SELECT * FROM members WHERE id = $1', [id]);
    if (!row) throw notFound('MEMBER_NOT_FOUND', 'Member not found.');
    return toMemberResponse(row);
  }

  async list(q: PageQuery, f: { status?: string }) {
    const params = [f.status || null, q.search || null];
    const rows = await queryMany<MemberRow>(
      this.pool,
      `SELECT * FROM members ${FILTER} ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
      [...params, q.pageSize, pageOffset(q)],
    );
    const total = (await queryOne<{ count: number }>(this.pool, `SELECT COUNT(*) FROM members ${FILTER}`, params))!.count;
    return newPage(rows.map(toMemberResponse), q.page, q.pageSize, total);
  }

  async create(actor: string, req: CreateInput) {
    if (await queryOne(this.pool, 'SELECT 1 FROM members WHERE phone = $1', [req.phone])) {
      throw conflict('MEMBER_PHONE_DUPLICATE', 'A member with this phone number already exists.');
    }
    if (req.dateOfBirth && req.dateOfBirth >= todayIST()) {
      throw badRequest('DOB_NOT_PAST', 'dateOfBirth must be in the past.');
    }

    const created = await withTx(this.pool, async (tx) => {
      const code = await nextCode(tx, 'member');
      let m: MemberRow;
      try {
        m = (await queryOne<MemberRow>(
          tx,
          `INSERT INTO members (member_code, first_name, last_name, phone, email, status, joining_date,
             date_of_birth, gender, address, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship)
           VALUES ($1,$2,$3,$4,$5,'ACTIVE',$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
          [
            code, req.firstName, req.lastName, req.phone, req.email || null, req.joiningDate,
            req.dateOfBirth ?? null, req.gender ?? null, req.address ?? null,
            req.emergencyContactName ?? null, req.emergencyContactPhone ?? null, req.emergencyContactRelationship ?? null,
          ],
        ))!;
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

  async update(actor: string, id: string, req: UpdateInput) {
    const updated = await withTx(this.pool, async (tx) => {
      const m = await queryOne<MemberRow>(
        tx,
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
      const existing = await queryOne<MemberRow>(tx, 'SELECT * FROM members WHERE id = $1', [id]);
      if (!existing) throw notFound('MEMBER_NOT_FOUND', 'Member not found.');
      try {
        await exec(tx, 'DELETE FROM members WHERE id = $1', [id]);
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
      member: await this.getByID(id),
      membershipHistory: [],
      paymentHistory: [],
      attendanceHistory: [],
      activeTrainer: null,
    };
  }
}
