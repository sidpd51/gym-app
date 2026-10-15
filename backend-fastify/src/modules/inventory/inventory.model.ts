export interface CategoryRow {
  id: string;
  name: string;
  description: string | null;
  status: string;
}

export interface ItemRow {
  id: string;
  item_code: string;
  name: string;
  category_id: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  status: string;
  description: string | null;
  created_at: Date;
}

export interface TxRow {
  id: string;
  item_id: string;
  type: string;
  quantity: number;
  transaction_date: string;
  reference: string | null;
  notes: string | null;
  created_at: Date;
}

export interface CategoryResponse {
  id: string;
  name: string;
  description: string | null;
  status: string;
}

export interface ItemResponse {
  id: string;
  itemCode: string;
  name: string;
  categoryId: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  status: string;
  description: string | null;
  createdAt: Date;
}

export interface TransactionResponse {
  id: string;
  itemId: string;
  type: string;
  quantity: number;
  transactionDate: string;
  reference: string | null;
  notes: string | null;
  createdAt: Date;
}

/** Stock status derived from current vs minimum level. */
export function statusFor(current: number, minimum: number): string {
  if (current <= 0) return 'OUT_OF_STOCK';
  if (current <= minimum) return 'LOW_STOCK';
  return 'IN_STOCK';
}

export const toCategoryResponse = (c: CategoryRow): CategoryResponse => ({
  id: c.id,
  name: c.name,
  description: c.description,
  status: c.status,
});

export const toItemResponse = (it: ItemRow): ItemResponse => ({
  id: it.id,
  itemCode: it.item_code,
  name: it.name,
  categoryId: it.category_id,
  unit: it.unit,
  currentStock: it.current_stock,
  minimumStock: it.minimum_stock,
  status: it.status,
  description: it.description,
  createdAt: it.created_at,
});

export const toTransactionResponse = (t: TxRow): TransactionResponse => ({
  id: t.id,
  itemId: t.item_id,
  type: t.type,
  quantity: t.quantity,
  transactionDate: t.transaction_date,
  reference: t.reference,
  notes: t.notes,
  createdAt: t.created_at,
});
