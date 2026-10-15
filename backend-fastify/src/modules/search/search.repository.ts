import { queryMany, type Db, type DbPool } from '../../db/pool.js';
import type { LeadHitRow, MemberHitRow, TrainerHitRow } from './search.model.js';

/** Top-5 substring matches per entity. */
export class SearchRepository {
  constructor(private readonly pool: DbPool) {}

  members(q: string, db: Db = this.pool) {
    return queryMany<MemberHitRow>(
      db,
      `SELECT id, member_code, first_name, last_name, phone FROM members
       WHERE first_name ILIKE '%' || $1 || '%' OR last_name ILIKE '%' || $1 || '%'
          OR phone ILIKE '%' || $1 || '%' OR member_code ILIKE '%' || $1 || '%' LIMIT 5`,
      [q],
    );
  }

  trainers(q: string, db: Db = this.pool) {
    return queryMany<TrainerHitRow>(
      db,
      `SELECT id, trainer_code, first_name, last_name, phone FROM trainers
       WHERE first_name ILIKE '%' || $1 || '%' OR last_name ILIKE '%' || $1 || '%'
          OR phone ILIKE '%' || $1 || '%' OR trainer_code ILIKE '%' || $1 || '%' LIMIT 5`,
      [q],
    );
  }

  leads(q: string, db: Db = this.pool) {
    return queryMany<LeadHitRow>(
      db,
      `SELECT id, lead_code, name, phone FROM leads
       WHERE name ILIKE '%' || $1 || '%' OR phone ILIKE '%' || $1 || '%' OR lead_code ILIKE '%' || $1 || '%' LIMIT 5`,
      [q],
    );
  }
}
