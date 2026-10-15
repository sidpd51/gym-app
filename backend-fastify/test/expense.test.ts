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

describe('expenses', () => {
  it('category + expense lifecycle with audit rows', async () => {
    const { client } = await loggedIn(env.app, env.pool, 'OWNER');
    const cat = await client.post('/expense-categories', { name: 'Utilities' });
    expect(cat.status).toBe(201);
    expect(cat.body).toMatchObject({ name: 'Utilities', description: null, status: 'ACTIVE' });
    expect((await client.post('/expense-categories', {})).body.code).toBe('VALIDATION_FAILED');

    const bad = await client.post('/expenses', {
      categoryId: cat.body.id, description: 'x', amount: 0, expenseDate: '2024-03-01', paymentMethod: 'CASH',
    });
    expect(bad.body.code).toBe('INVALID_AMOUNT');
    expect((await client.post('/expenses', { categoryId: cat.body.id, description: 'x', amount: 5, expenseDate: '2024-03-01', paymentMethod: 'BITCOIN' })).status).toBe(400);
    const missing = await client.post('/expenses', {
      categoryId: '00000000-0000-4000-8000-000000000000', description: 'x', amount: 5, expenseDate: '2024-03-01', paymentMethod: 'CASH',
    });
    expect(missing.body.code).toBe('CATEGORY_NOT_FOUND');

    const created = await client.post('/expenses', {
      categoryId: cat.body.id, description: 'Electricity', amount: '1500.50', expenseDate: '2024-03-01', paymentMethod: 'UPI',
    });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      expenseCode: expect.stringMatching(/^EXP-\d{3}$/), amount: '1500.5', expenseDate: '2024-03-01', vendor: null,
    });

    const upd = await client.patch(`/expenses/${created.body.id}`, { amount: 2000, vendor: 'MSEB' });
    expect(upd.body).toMatchObject({ amount: '2000', vendor: 'MSEB', description: 'Electricity' });
    expect((await client.patch(`/expenses/${created.body.id}`, { amount: -1 })).body.code).toBe('INVALID_AMOUNT');

    const list = await client.get(`/expenses?categoryId=${cat.body.id}&fromDate=2024-03-01&toDate=2024-03-31`);
    expect(list.body.meta.total).toBe(1);
    expect((await client.get('/expenses?categoryId=zzz')).body.code).toBe('INVALID_UUID');
    expect((await client.get('/expenses?fromDate=bad')).body.code).toBe('INVALID_DATE');

    // category referenced -> 409
    expect((await client.delete(`/expense-categories/${cat.body.id}`)).body.code).toBe('CATEGORY_REFERENCED');

    // inactive category rejected
    const inactive = await client.post('/expense-categories', { name: 'Old', status: 'INACTIVE' });
    const rej = await client.post('/expenses', {
      categoryId: inactive.body.id, description: 'x', amount: 5, expenseDate: '2024-03-01', paymentMethod: 'CASH',
    });
    expect(rej.status).toBe(422);
    expect(rej.body.code).toBe('CATEGORY_INACTIVE');

    expect((await client.delete(`/expenses/${created.body.id}`)).status).toBe(204);
    expect((await client.get(`/expenses/${created.body.id}`)).body.code).toBe('EXPENSE_NOT_FOUND');
    expect((await client.patch(`/expense-categories/${cat.body.id}`, { name: 'Utilities2' })).body.name).toBe('Utilities2');
    expect((await client.delete(`/expense-categories/${cat.body.id}`)).status).toBe(204);

    const audit = await env.pool.query("SELECT action, description FROM audit_logs WHERE entity_type='EXPENSE' ORDER BY timestamp");
    expect(audit.rows.length).toBe(7);
    expect(audit.rows.map((r) => r.description)).toContain('Expense 1500.5 UPI');
  });

  it('enforces permissions', async () => {
    const { client } = await loggedIn(env.app, env.pool, 'RECEPTIONIST');
    const r = await client.get('/expenses');
    expect(r.status).toBe(403);
    expect(r.body.code).toBe('FORBIDDEN');
  });
});
