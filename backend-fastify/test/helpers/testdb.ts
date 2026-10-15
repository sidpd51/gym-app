import { join } from 'node:path';
import { createDB } from 'mysql-memory-server';
import mysql from 'mysql2/promise';
import { migrate } from '../../src/db/migrate.js';

export interface TestDb {
  url: string;
  stop: () => Promise<void>;
}

/**
 * Boots a throwaway real MySQL 8.4 (downloaded once, then cached), migrated to head.
 * Linux needs libaio and libnuma installed (apt: libaio1t64 libnuma1).
 */
export async function startTestDb(): Promise<TestDb> {
  const db = await createDB({ version: '8.4.x', dbName: 'gymdb', logLevel: 'ERROR' });
  const url = `mysql://${db.username}@127.0.0.1:${db.port}/gymdb`;
  const conn = await mysql.createConnection({ uri: url, multipleStatements: true });
  await migrate(conn, join(import.meta.dirname, '../../migrations'), 'up', () => {});
  await conn.end();
  return { url, stop: () => db.stop() };
}
