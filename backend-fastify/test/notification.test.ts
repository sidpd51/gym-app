import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestDb, type TestDb } from './helpers/testdb.js';
import { loggedIn, setup } from './helpers/client.js';
import { expireOverdueMemberships, queueExpiryReminders } from '../src/modules/notification/jobs.js';
import { NotificationService } from '../src/modules/notification/service.js';
import { newId, withTx } from '../src/db/pool.js';

let db: TestDb;
let env: Awaited<ReturnType<typeof setup>>;

beforeAll(async () => {
  db = await startTestDb();
  env = await setup(db.url);
}, 120_000);
afterAll(async () => {
  await env?.close();
  await db?.stop();
});

const TODAY_IST = 'DATE(DATE_ADD(UTC_TIMESTAMP(), INTERVAL 330 MINUTE))';

async function seedMembership(phone: string, startOffset: number, endOffset: number, status = 'ACTIVE') {
  const memberId = newId();
  const planId = newId();
  const membershipId = newId();
  await env.pool.query(
    `INSERT INTO members (id, member_code, first_name, last_name, phone, joining_date)
     VALUES (?, CONCAT('MEM-', ?), 'Mem', ?, ?, ${TODAY_IST})`, [memberId, phone, phone, phone]);
  await env.pool.query(
    `INSERT INTO membership_plans (id, name, duration_in_days, price) VALUES (?, CONCAT('P', ?), 30, 100)`, [planId, phone]);
  await env.pool.query(
    `INSERT INTO memberships (id, member_id, plan_id, plan_name, start_date, end_date, amount, status)
     VALUES (?, ?, ?, 'P', DATE_ADD(${TODAY_IST}, INTERVAL ? DAY), DATE_ADD(${TODAY_IST}, INTERVAL ? DAY), 100, ?)`,
    [membershipId, memberId, planId, startOffset, endOffset, status]);
  return { memberId, membershipId };
}

describe('notifications', () => {
  it('create, dedupe, validation, list, expiring/expired, permissions', async () => {
    const { client } = await loggedIn(env.app, env.pool, 'OWNER');
    const soon = await seedMembership('1111111111', -20, 3);
    const lapsed = await seedMembership('2222222222', -40, -2);

    const body = { ...soon, type: 'CUSTOM', channel: 'SMS', message: 'hello' };
    const created = await client.post('/notifications', body);
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ status: 'PENDING', sentAt: null, type: 'CUSTOM' });
    expect((await client.post('/notifications', body)).body.code).toBe('NOTIFICATION_DEDUPED');
    expect((await client.post('/notifications', { ...body, type: 'NOPE' })).body.code).toBe('VALIDATION_FAILED');
    const fk = await client.post('/notifications', { ...body, memberId: '00000000-0000-4000-8000-000000000000', type: 'EXPIRED_NOTICE' });
    expect(fk.body.code).toBe('INVALID_REFERENCE');

    expect((await client.get('/notifications?status=PENDING')).body.meta.total).toBe(1);
    expect((await client.get('/notifications?status=SENT')).body.meta.total).toBe(0);

    const expiring = await client.get('/notifications/expiring?days=5');
    expect(expiring.body).toHaveLength(1);
    expect(expiring.body[0]).toMatchObject({ membershipId: soon.membershipId, firstName: 'Mem', phone: '1111111111' });
    expect(expiring.body[0].endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect((await client.get('/notifications/expiring?days=1')).body).toHaveLength(0);
    expect((await client.get('/notifications/expired')).body.map((r: any) => r.membershipId)).toEqual([lapsed.membershipId]);

    const [audit] = await env.pool.query("SELECT 1 FROM audit_logs WHERE entity_type='NOTIFICATION' AND action='CREATE'");
    expect(audit as unknown[]).toHaveLength(1);

    const trainer = await loggedIn(env.app, env.pool, 'TRAINER');
    expect((await trainer.client.get('/notifications')).status).toBe(200);
    expect((await trainer.client.post('/notifications', body)).status).toBe(403);
  });

  it('scheduled job handlers: expiry and idempotent reminders', async () => {
    await env.pool.query('DELETE FROM notification_records');
    const svc = new NotificationService(env.pool);
    const n = await withTx(env.pool, (tx) => expireOverdueMemberships(tx));
    expect(n).toBe(1);
    const [expired] = await env.pool.query("SELECT COUNT(*) AS c FROM memberships WHERE status='EXPIRED'");
    expect(Number((expired as any[])[0].c)).toBe(1);

    const first = await withTx(env.pool, (tx) => queueExpiryReminders(tx, svc));
    expect(first).toEqual({ inserted: 1, candidates: 1 });
    const again = await withTx(env.pool, (tx) => queueExpiryReminders(tx, svc));
    expect(again).toEqual({ inserted: 0, candidates: 1 });
    const [rowsRes] = await env.pool.query('SELECT type, channel, message FROM notification_records');
    const rows = { rows: rowsRes as Array<{ type: string; channel: string; message: string }> };
    expect(rows.rows).toHaveLength(1);
    expect(rows.rows[0]).toMatchObject({ type: 'EXPIRY_REMINDER', channel: 'IN_APP' });
    expect(rows.rows[0].message).toMatch(/^Hi Mem, your membership expires on \d{4}-\d{2}-\d{2}\.$/);
  });
});
