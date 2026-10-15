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

/**
 * Allocates the next human-readable code, e.g. MEM-007, from the code_sequences
 * counter table (MySQL has no sequences). `LAST_INSERT_ID(expr)` makes the
 * increment atomic and readable on the same connection. Inside a transaction the
 * counter row stays locked until commit, so concurrent creates serialize and a
 * rolled-back create doesn't burn a number.
 */
export async function nextCode(db: Db, kind: CodeKind): Promise<string> {
  const [prefix, seq] = CODES[kind];
  const isPool = 'getConnection' in db;
  const conn = isPool ? await db.getConnection() : db;
  try {
    await conn.query('UPDATE code_sequences SET current_value = LAST_INSERT_ID(current_value + 1) WHERE name = ?', [seq]);
    const [rows] = await conn.query('SELECT LAST_INSERT_ID() AS n');
    return `${prefix}-${String(Number((rows as Array<{ n: number | string }>)[0].n)).padStart(3, '0')}`;
  } finally {
    if (isPool) (conn as import('mysql2/promise').PoolConnection).release();
  }
}
