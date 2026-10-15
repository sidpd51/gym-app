import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestDb, type TestDb } from './helpers/testdb.js';
import { loggedIn, setup } from './helpers/client.js';

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

describe('payments', () => {
  it('records, lists with filters, validates', async () => {
    const { client } = await loggedIn(env.app, env.pool, 'RECEPTIONIST');
    const m = (await client.post('/members', { firstName: 'P', lastName: 'Q', phone: '9000000003', joiningDate: '2024-01-01' })).body;

    expect((await client.post('/payments', { memberId: m.id, amount: 100, paymentMethod: 'BITCOIN', paymentDate: '2024-01-01' })).body.code).toBe('VALIDATION_FAILED');
    expect((await client.post('/payments', { memberId: m.id, amount: 0, paymentMethod: 'CASH', paymentDate: '2024-01-01' })).body.code).toBe('INVALID_AMOUNT');
    expect((await client.post('/payments', { memberId: '00000000-0000-4000-8000-000000000000', amount: 5, paymentMethod: 'CASH', paymentDate: '2024-01-01' })).body.code).toBe('INVALID_REFERENCE');

    const p1 = await client.post('/payments', { memberId: m.id, amount: '250.50', paymentMethod: 'UPI', paymentDate: '2024-01-10', reference: 'ref1' });
    expect(p1.status).toBe(201);
    expect(p1.body).toMatchObject({ amount: '250.5', paymentMethod: 'UPI', status: 'COMPLETED', membershipId: null, reference: 'ref1', notes: null, paymentDate: '2024-01-10' });
    await client.post('/payments', { memberId: m.id, amount: 100, paymentMethod: 'CASH', paymentDate: '2024-02-10', status: 'PENDING' });

    expect((await client.get('/payments')).body.meta.total).toBe(2);
    expect((await client.get('/payments?status=PENDING')).body.meta.total).toBe(1);
    expect((await client.get('/payments?fromDate=2024-02-01&toDate=2024-02-28')).body.meta.total).toBe(1);
    expect((await client.get('/payments?fromDate=bad')).body.code).toBe('INVALID_DATE');
    expect((await client.get(`/payments?memberId=${m.id}`)).body.data[0].paymentDate).toBe('2024-02-10');
    expect((await client.get(`/payments/${p1.body.id}`)).body.id).toBe(p1.body.id);
    expect((await client.get('/payments/00000000-0000-4000-8000-000000000000')).body.code).toBe('PAYMENT_NOT_FOUND');

    const [audit] = await env.pool.query("SELECT description FROM audit_logs WHERE entity_type='PAYMENT' ORDER BY timestamp");
    expect((audit as Array<{ description: string }>)[0].description).toBe('Payment 250.5 UPI');
  });

  it('trainer cannot view payments', async () => {
    const { client } = await loggedIn(env.app, env.pool, 'TRAINER');
    expect((await client.get('/payments')).status).toBe(403);
  });
});
