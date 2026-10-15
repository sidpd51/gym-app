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

describe('inventory', () => {
  it('items, stock transactions and status transitions', async () => {
    const { client } = await loggedIn(env.app, env.pool, 'OWNER');
    const cat = await client.post('/inventory-categories', { name: 'Supplements', description: 'd' });
    expect(cat.status).toBe(201);

    expect((await client.post('/inventory', { name: 'Whey' })).body.code).toBe('VALIDATION_FAILED');
    expect((await client.post('/inventory', { name: 'Whey', categoryId: cat.body.id, unit: 'kg', currentStock: -1 })).status).toBe(400);
    const badRef = await client.post('/inventory', { name: 'Whey', categoryId: '00000000-0000-4000-8000-000000000000', unit: 'kg' });
    expect(badRef.body.code).toBe('INVALID_REFERENCE');

    const item = await client.post('/inventory', { name: 'Whey', categoryId: cat.body.id, unit: 'kg', currentStock: 10, minimumStock: 5 });
    expect(item.status).toBe(201);
    expect(item.body).toMatchObject({ itemCode: expect.stringMatching(/^INV-\d{3}$/), status: 'IN_STOCK', currentStock: 10, description: null });
    const id = item.body.id;

    const txBody = (type: string, quantity: number) => ({ type, quantity, transactionDate: '2024-03-01' });
    expect((await client.post(`/inventory/${id}/transactions`, txBody('STOCK_OUT', 6))).status).toBe(201);
    expect((await client.get(`/inventory/${id}`)).body).toMatchObject({ currentStock: 4, status: 'LOW_STOCK' });

    const over = await client.post(`/inventory/${id}/transactions`, txBody('STOCK_OUT', 9));
    expect(over.status).toBe(422);
    expect(over.body.code).toBe('INVENTORY_INSUFFICIENT_STOCK');
    expect((await client.post(`/inventory/${id}/transactions`, { ...txBody('STOCK_IN', 0) })).status).toBe(400);

    await client.post(`/inventory/${id}/transactions`, txBody('STOCK_IN', 20));
    expect((await client.get(`/inventory/${id}`)).body).toMatchObject({ currentStock: 24, status: 'IN_STOCK' });
    await client.post(`/inventory/${id}/transactions`, txBody('ADJUSTMENT', 3));
    expect((await client.get(`/inventory/${id}`)).body).toMatchObject({ currentStock: 3, status: 'LOW_STOCK' });

    const txs = await client.get(`/inventory/${id}/transactions`);
    expect(txs.body).toHaveLength(3);
    expect(txs.body[0]).toMatchObject({ itemId: id, reference: null, transactionDate: '2024-03-01' });

    expect((await client.get('/inventory?status=LOW_STOCK')).body.meta.total).toBe(1);
    expect((await client.get('/inventory?status=IN_STOCK')).body.meta.total).toBe(0);
    expect((await client.get('/inventory?categoryId=nope')).body.code).toBe('INVALID_UUID');

    const upd = await client.patch(`/inventory/${id}`, { name: 'Whey Isolate', minimumStock: 1 });
    expect(upd.body).toMatchObject({ name: 'Whey Isolate', minimumStock: 1, unit: 'kg' });

    // conflicts
    expect((await client.delete(`/inventory-categories/${cat.body.id}`)).body.code).toBe('CATEGORY_REFERENCED');
    expect((await client.delete(`/inventory/${id}`)).body.code).toBe('ITEM_REFERENCED');
    expect((await client.get('/inventory/00000000-0000-4000-8000-000000000000')).body.code).toBe('ITEM_NOT_FOUND');

    const lone = await client.post('/inventory', { name: 'Towel', categoryId: cat.body.id, unit: 'pcs' });
    expect(lone.body).toMatchObject({ currentStock: 0, status: 'OUT_OF_STOCK' });
    expect((await client.delete(`/inventory/${lone.body.id}`)).status).toBe(204);

    const catUpd = await client.patch(`/inventory-categories/${cat.body.id}`, { status: 'INACTIVE' });
    expect(catUpd.body.status).toBe('INACTIVE');
    expect((await client.get('/inventory-categories')).body).toHaveLength(1);

    const audit = await env.pool.query("SELECT description FROM audit_logs WHERE entity_type='INVENTORY_ITEM'");
    expect(audit.rows.map((r) => r.description)).toContain('Inventory STOCK_OUT qty=6');
  });

  it('enforces permissions', async () => {
    const { client } = await loggedIn(env.app, env.pool, 'RECEPTIONIST');
    expect((await client.get('/inventory')).status).toBe(200);
    expect((await client.post('/inventory-categories', { name: 'x' })).status).toBe(403);
    const { client: trainer } = await loggedIn(env.app, env.pool, 'TRAINER');
    expect((await trainer.get('/inventory')).status).toBe(403);
  });
});
