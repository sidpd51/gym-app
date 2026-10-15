import { randomUUID } from 'node:crypto';
import mysql from 'mysql2/promise';

export type DbPool = mysql.Pool;
export type DbClient = mysql.PoolConnection;
/** Anything that can run a query: the pool or a transaction connection. */
export type Db = mysql.Pool | mysql.PoolConnection;

/** App-generated primary key (MySQL has no INSERT ... RETURNING, so repositories pick the id up front). */
export const newId = (): string => randomUUID();

export async function createPool(databaseUrl: string): Promise<DbPool> {
  const pool = mysql.createPool({
    uri: databaseUrl,
    connectionLimit: 10,
    charset: 'utf8mb4',
    // DATETIME columns hold UTC; read/write them as UTC regardless of the server's zone.
    timezone: 'Z',
    supportBigNumbers: true,
    bigNumberStrings: false, // COUNT(*) etc. -> number
    // affectedRows = rows MATCHED (not changed), like PostgreSQL's rowCount.
    flags: ['+FOUND_ROWS'],
    typeCast(field, next) {
      // DATE -> 'YYYY-MM-DD' string (never a JS Date; avoids timezone shifts).
      if (field.type === 'DATE') return field.string();
      // BOOLEAN is TINYINT(1).
      if (field.type === 'TINY' && field.length === 1) {
        const v = field.string();
        return v === null ? null : v === '1';
      }
      // DECIMAL stays a string (mysql2 default) — modules convert where the API emitted a number.
      return next();
    },
  });
  // An idle connection erroring (e.g. server restart) must not crash the process; the pool replaces it.
  pool.on('connection', (c) => c.on('error', (err) => console.error('mysql connection error', err.message)));
  await pool.query('SELECT 1');
  return pool;
}

/** Cheap liveness probe for /health. */
export async function ping(pool: DbPool): Promise<void> {
  await pool.query('SELECT 1');
}

/** Runs fn in a transaction; commits on success, rolls back on throw. */
export async function withTx<T>(pool: DbPool, fn: (tx: DbClient) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    try {
      await conn.rollback();
    } catch {
      /* connection already broken; original error wins */
    }
    throw err;
  } finally {
    conn.release();
  }
}

/** First row or undefined (the "no rows" case). */
export async function queryOne<T = any>(db: Db, sql: string, params: unknown[] = []): Promise<T | undefined> {
  const [rows] = await db.query(sql, params);
  return (rows as T[])[0];
}

export async function queryMany<T = any>(db: Db, sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await db.query(sql, params);
  return rows as T[];
}

/** Returns the number of matched rows (INSERT/UPDATE/DELETE). */
export async function exec(db: Db, sql: string, params: unknown[] = []): Promise<number> {
  const [res] = await db.query(sql, params);
  return (res as mysql.ResultSetHeader).affectedRows ?? 0;
}

const errno = (err: unknown): number => (err as { errno?: number } | null)?.errno ?? 0;

/** ER_DUP_ENTRY */
export const isUniqueViolation = (err: unknown) => errno(err) === 1062;
/** ER_ROW_IS_REFERENCED_2 (delete/update blocked by a child row) and ER_NO_REFERENCED_ROW_2 (insert points at a missing parent). */
export const isForeignKeyViolation = (err: unknown) => errno(err) === 1451 || errno(err) === 1452;
/** ER_CHECK_CONSTRAINT_VIOLATED */
export const isCheckViolation = (err: unknown) => errno(err) === 3819;

/**
 * Name of the violated key/constraint, parsed from the server message, or ''.
 * Duplicate: "... for key 'members.phone'" -> 'phone' (also handles a bare 'phone').
 * FK: "... CONSTRAINT `fk_payments_member_id` FOREIGN KEY ..." -> 'fk_payments_member_id'.
 * Check: "Check constraint 'chk_x' is violated." -> 'chk_x'.
 */
export function constraintName(err: unknown): string {
  const msg = (err as { sqlMessage?: string } | null)?.sqlMessage ?? '';
  const m =
    /for key '(?:[^'.]*\.)?([^']+)'/.exec(msg) ??
    /CONSTRAINT `([^`]+)`/.exec(msg) ??
    /[Cc]heck constraint '([^']+)'/.exec(msg);
  return m?.[1] ?? '';
}
