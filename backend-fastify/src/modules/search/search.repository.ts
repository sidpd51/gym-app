import { queryMany, type Db, type DbPool } from '../../db/pool.js';
import type { LeadHitRow, MemberHitRow, TrainerHitRow } from './search.model.js';

/** Top-5 substring matches per entity. */
export class SearchRepository {
  constructor(private readonly pool: DbPool) {}

  members(q: string, db: Db = this.pool) {
    return queryMany<MemberHitRow>(
      db,
      `SELECT id, member_code, first_name, last_name, phone FROM members
       WHERE first_name LIKE CONCAT('%', ?, '%') OR last_name LIKE CONCAT('%', ?, '%')
          OR phone LIKE CONCAT('%', ?, '%') OR member_code LIKE CONCAT('%', ?, '%') LIMIT 5`,
      [q, q, q, q],
    );
  }

  trainers(q: string, db: Db = this.pool) {
    return queryMany<TrainerHitRow>(
      db,
      `SELECT id, trainer_code, first_name, last_name, phone FROM trainers
       WHERE first_name LIKE CONCAT('%', ?, '%') OR last_name LIKE CONCAT('%', ?, '%')
          OR phone LIKE CONCAT('%', ?, '%') OR trainer_code LIKE CONCAT('%', ?, '%') LIMIT 5`,
      [q, q, q, q],
    );
  }

  leads(q: string, db: Db = this.pool) {
    return queryMany<LeadHitRow>(
      db,
      `SELECT id, lead_code, name, phone FROM leads
       WHERE name LIKE CONCAT('%', ?, '%') OR phone LIKE CONCAT('%', ?, '%') OR lead_code LIKE CONCAT('%', ?, '%') LIMIT 5`,
      [q, q, q],
    );
  }
}
