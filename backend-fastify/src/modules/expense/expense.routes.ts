import type { FastifyInstance } from 'fastify';
import type { ExpenseController } from './expense.controller.js';

/** Route table: path + method + permission -> controller action. */
export function expenseRoutes(c: ExpenseController) {
  return async (app: FastifyInstance) => {
    const perm = (p: Parameters<FastifyInstance['requirePermission']>[0]) => ({ onRequest: [app.requirePermission(p)] });

    app.get('/expense-categories', perm('expenses:view'), c.listCategories);
    app.post('/expense-categories', perm('expenses:create'), c.createCategory);
    app.patch('/expense-categories/:id', perm('expenses:edit'), c.updateCategory);
    app.delete('/expense-categories/:id', perm('expenses:delete'), c.removeCategory);

    app.get('/expenses', perm('expenses:view'), c.listExpenses);
    app.get('/expenses/:id', perm('expenses:view'), c.getExpense);
    app.post('/expenses', perm('expenses:create'), c.createExpense);
    app.patch('/expenses/:id', perm('expenses:edit'), c.updateExpense);
    app.delete('/expenses/:id', perm('expenses:delete'), c.removeExpense);
  };
}
