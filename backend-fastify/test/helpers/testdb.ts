import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import EmbeddedPostgres from 'embedded-postgres';
import pg from 'pg';
import { migrate } from '../../src/db/migrate.js';

export interface TestDb {
  url: string;
  stop: () => Promise<void>;
}

/** Boots a throwaway real PostgreSQL (embedded binaries), migrated to head. */
export async function startTestDb(port = 54000 + Math.floor(Math.random() * 1000)): Promise<TestDb> {
  const dir = mkdtempSync(join(tmpdir(), 'gym-pg-'));
  const server = new EmbeddedPostgres({
    databaseDir: dir, user: 'gymuser', password: 'dev', port, persistent: false,
    onLog: () => {}, onError: () => {},
  });
  await server.initialise();
  await server.start();
  await server.createDatabase('gymdb');
  const url = `postgres://gymuser:dev@localhost:${port}/gymdb`;
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  await migrate(client, join(import.meta.dirname, '../../migrations'), 'up', () => {});
  await client.end();
  return {
    url,
    stop: async () => {
      await server.stop();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
