/**
 * Usage: node dist/scripts/migrate.js [up|status] [migrationsDir]
 * (migrationsDir defaults to $MIGRATIONS_DIR or ./migrations)
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';
import { migrate } from '../db/migrate.js';

const [cmd = 'up', dir = process.env.MIGRATIONS_DIR ?? './migrations'] = process.argv.slice(2);

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  const conn = await mysql.createConnection({ uri: url, multipleStatements: true });
  try {
    await migrate(conn, dir, cmd === 'status' ? 'status' : 'up');
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
