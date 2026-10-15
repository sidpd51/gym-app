import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type pg from 'pg';

/** Extracts the "+goose Up" section; StatementBegin/End markers are stripped (the block is sent as one query). */
function upSql(file: string): string {
  const text = readFileSync(file, 'utf8');
  const up = text.split(/^-- \+goose Down\s*$/m)[0].replace(/^-- \+goose Up\s*$/m, '');
  return up.replace(/^-- \+goose Statement(Begin|End)\s*$/gm, '');
}

/**
 * Minimal goose-compatible migrator. Records applied versions in the same
 * `goose_db_version` table, so a database previously migrated by goose (the Go
 * backend) is recognised as up to date.
 */
export async function migrate(
  client: pg.Client,
  dir: string,
  mode: 'up' | 'status' = 'up',
  log: (msg: string) => void = console.log,
): Promise<void> {
  await client.query(`CREATE TABLE IF NOT EXISTS goose_db_version (
    id SERIAL PRIMARY KEY, version_id BIGINT NOT NULL, is_applied BOOLEAN NOT NULL,
    tstamp TIMESTAMP NOT NULL DEFAULT now())`);
  const hasZero = await client.query('SELECT 1 FROM goose_db_version WHERE version_id = 0');
  if (hasZero.rowCount === 0) await client.query('INSERT INTO goose_db_version (version_id, is_applied) VALUES (0, true)');

  const applied = new Set<number>(
    (await client.query(`SELECT version_id FROM (
       SELECT DISTINCT ON (version_id) version_id, is_applied FROM goose_db_version ORDER BY version_id, id DESC
     ) t WHERE is_applied`)).rows.map((r) => Number(r.version_id)),
  );
  const files = readdirSync(dir).filter((f) => /^\d+_.*\.sql$/.test(f)).sort();

  for (const f of files) {
    const version = Number.parseInt(f.split('_')[0], 10);
    if (mode === 'status') {
      log(`${applied.has(version) ? 'applied ' : 'pending '} ${f}`);
      continue;
    }
    if (applied.has(version)) continue;
    log(`migrate: applying ${f}`);
    await client.query('BEGIN');
    try {
      await client.query(upSql(join(dir, f)));
      await client.query('INSERT INTO goose_db_version (version_id, is_applied) VALUES ($1, true)', [version]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  }
  if (mode === 'up') log('migrate: up to date');
}
