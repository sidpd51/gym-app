/**
 * Usage: node dist/scripts/migrate.js [up|status] [migrationsDir]
 * (migrationsDir defaults to $MIGRATIONS_DIR or ./migrations)
 */
import 'dotenv/config';
import pg from 'pg';
import { migrate } from '../db/migrate.js';

const [cmd = 'up', dir = process.env.MIGRATIONS_DIR ?? './migrations'] = process.argv.slice(2);

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    await migrate(client, dir, cmd === 'status' ? 'status' : 'up');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
