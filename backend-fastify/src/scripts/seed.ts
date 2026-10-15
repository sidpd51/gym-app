/**
 * Inserts an initial OWNER user. Idempotent: exits 0 if the email already exists.
 * Env: DATABASE_URL, SEED_EMAIL, SEED_PASSWORD (>= 8 chars), SEED_FIRST_NAME, SEED_LAST_NAME.
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { nextCode } from '../common/codegen.js';
import { createPool, newId, queryOne, withTx } from '../db/pool.js';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const email = (process.env.SEED_EMAIL ?? '').toLowerCase();
  const password = process.env.SEED_PASSWORD ?? '';
  const firstName = process.env.SEED_FIRST_NAME || 'Owner';
  const lastName = process.env.SEED_LAST_NAME || 'Admin';

  if (!databaseUrl || !email || !password) {
    console.error('missing required env: DATABASE_URL, SEED_EMAIL, SEED_PASSWORD');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('SEED_PASSWORD must be at least 8 characters');
    process.exit(1);
  }

  const pool = await createPool(databaseUrl);
  try {
    if (await queryOne(pool, 'SELECT 1 FROM users WHERE email = ?', [email])) {
      console.log(`seed skipped: user already exists (${email})`);
      return;
    }
    const hash = await bcrypt.hash(password, 12);
    await withTx(pool, async (tx) => {
      const code = await nextCode(tx, 'user');
      await tx.query(
        `INSERT INTO users (id, user_code, first_name, last_name, email, phone, role, status, password_hash)
         VALUES (?, ?, ?, ?, ?, NULL, 'OWNER', 'ACTIVE', ?)`,
        [newId(), code, firstName, lastName, email, hash],
      );
    });
    console.log(`seeded OWNER user: ${email}`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
