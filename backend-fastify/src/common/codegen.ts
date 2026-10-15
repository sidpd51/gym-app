import type { Db } from '../db/pool.js';

const CODES = {
  user: ['USR', 'user_code_seq'],
  member: ['MEM', 'member_code_seq'],
  trainer: ['TRN', 'trainer_code_seq'],
  lead: ['LEAD', 'lead_code_seq'],
  expense: ['EXP', 'expense_code_seq'],
  inventoryItem: ['INV', 'item_code_seq'],
  equipment: ['EQP', 'equipment_code_seq'],
} as const;

export type CodeKind = keyof typeof CODES;

/** Allocates the next human-readable code, e.g. MEM-007. Pass a tx client to allocate inside a wider write. */
export async function nextCode(db: Db, kind: CodeKind): Promise<string> {
  const [prefix, seq] = CODES[kind];
  // seq comes from the closed set above, never user input.
  const res = await db.query(`SELECT nextval('${seq}') AS n`);
  return `${prefix}-${String(Number(res.rows[0].n)).padStart(3, '0')}`;
}
