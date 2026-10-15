import pg from 'pg';

const { Pool, types } = pg;

// DATE -> 'YYYY-MM-DD' string (never a JS Date; avoids timezone shifts).
types.setTypeParser(1082, (v) => v);
// int8 (COUNT(*), BIGINT) -> number.
types.setTypeParser(20, (v) => Number.parseInt(v, 10));
// NUMERIC stays a string (pg default) — modules convert to Number() where the Go DTO emitted a float.

export type DbPool = pg.Pool;
export type DbClient = pg.PoolClient;
/** Anything that can run a query: the pool or a transaction client. */
export type Db = pg.Pool | pg.PoolClient;

export async function createPool(databaseUrl: string): Promise<DbPool> {
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 30 * 60_000,
    maxLifetimeSeconds: 3600,
  });
  // An idle client erroring (e.g. server restart) must not crash the process; the pool replaces it.
  pool.on('error', (err) => console.error('pg pool idle client error', err.message));
  await pool.query('SELECT 1');
  return pool;
}

/** Runs fn in a transaction; commits on success, rolls back on throw. */
export async function withTx<T>(pool: DbPool, fn: (tx: DbClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* connection already broken; original error wins */
    }
    throw err;
  } finally {
    client.release();
  }
}

/** First row or undefined (the Go code's pgx.ErrNoRows case). */
export async function queryOne<T = any>(db: Db, sql: string, params: unknown[] = []): Promise<T | undefined> {
  const res = await db.query(sql, params);
  return res.rows[0] as T | undefined;
}

export async function queryMany<T = any>(db: Db, sql: string, params: unknown[] = []): Promise<T[]> {
  const res = await db.query(sql, params);
  return res.rows as T[];
}

/** Returns number of affected rows (the Go code's `:exec` + RowsAffected). */
export async function exec(db: Db, sql: string, params: unknown[] = []): Promise<number> {
  const res = await db.query(sql, params);
  return res.rowCount ?? 0;
}

const pgCode = (err: unknown): string => ((err as { code?: string } | null)?.code ?? '');
export const pgConstraint = (err: unknown): string => (err as { constraint?: string } | null)?.constraint ?? '';
export const isUniqueViolation = (err: unknown) => pgCode(err) === '23505';
// 23503 foreign_key_violation; 23001 restrict_violation (raised by ON DELETE RESTRICT, which the schema uses).
export const isForeignKeyViolation = (err: unknown) => ['23503', '23001'].includes(pgCode(err));
export const isCheckViolation = (err: unknown) => pgCode(err) === '23514';
