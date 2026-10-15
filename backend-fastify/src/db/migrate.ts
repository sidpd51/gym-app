import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Connection } from 'mysql2/promise';

/**
 * Minimal forward-only migrator. Applies `NNN_name.sql` files in order and records
 * each version in `schema_migrations`. The connection must be created with
 * `multipleStatements: true`. MySQL DDL auto-commits, so a file is not atomic: a
 * failure part-way leaves earlier statements applied — fix and re-run on a fresh DB.
 * A GET_LOCK guards against two instances migrating at once.
 */
export async function migrate(
  conn: Connection,
  dir: string,
  mode: 'up' | 'status' = 'up',
  log: (msg: string) => void = console.log,
): Promise<void> {
  await conn.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version    BIGINT NOT NULL PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
  )`);
  const [rows] = await conn.query('SELECT version FROM schema_migrations');
  const applied = new Set((rows as Array<{ version: number | string }>).map((r) => Number(r.version)));
  const files = readdirSync(dir).filter((f) => /^\d+_.*\.sql$/.test(f)).sort();

  if (mode === 'status') {
    for (const f of files) log(`${applied.has(Number.parseInt(f, 10)) ? 'applied ' : 'pending '} ${f}`);
    return;
  }

  const [lock] = await conn.query("SELECT GET_LOCK('gym_migrate', 60) AS got");
  if ((lock as Array<{ got: number }>)[0].got !== 1) throw new Error('could not acquire migration lock');
  try {
    for (const f of files) {
      const version = Number.parseInt(f, 10);
      if (applied.has(version)) continue;
      log(`migrate: applying ${f}`);
      await conn.query(readFileSync(join(dir, f), 'utf8'));
      await conn.query('INSERT INTO schema_migrations (version, name) VALUES (?, ?)', [version, f]);
    }
    log('migrate: up to date');
  } finally {
    await conn.query("SELECT RELEASE_LOCK('gym_migrate')");
  }
}
