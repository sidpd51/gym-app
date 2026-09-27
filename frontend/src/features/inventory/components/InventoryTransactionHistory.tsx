import { useInventoryTransactions } from '../hooks/useInventory'
import { INVENTORY_TRANSACTION_TYPE_LABELS } from '../types/inventory.types'
import type { InventoryTransactionType } from '../types/inventory.types'
import { cn } from '@/lib/utils'

function formatLocalDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const TYPE_CONFIG: Record<InventoryTransactionType, { text: string; sign: string }> = {
  STOCK_IN: { text: 'text-green-700', sign: '+' },
  STOCK_OUT: { text: 'text-red-600', sign: '−' },
  ADJUSTMENT: { text: 'text-amber-600', sign: '±' },
}

interface InventoryTransactionHistoryProps {
  itemId: string
}

export function InventoryTransactionHistory({ itemId }: InventoryTransactionHistoryProps) {
  const { transactions: rawTransactions } = useInventoryTransactions(itemId)
  const transactions = [...rawTransactions].sort((a, b) =>
    a.transactionDate < b.transactionDate ? 1 : -1,
  )

  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
        <h2 className="text-sm font-semibold text-zinc-900">Transaction History</h2>
        <div className="mt-6 py-8 text-center">
          <p className="text-sm font-medium text-zinc-500">No transactions recorded</p>
          <p className="mt-1 text-xs text-zinc-400">Stock movements will appear here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-6 py-4">
        <h2 className="text-sm font-semibold text-zinc-900">
          Transaction History
          <span className="ml-2 text-xs font-normal text-zinc-400">({transactions.length})</span>
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
                Date
              </th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
                Type
              </th>
              <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-zinc-500">
                Quantity
              </th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
                Reference
              </th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
                Notes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {transactions.map((txn) => {
              const config = TYPE_CONFIG[txn.type]
              const absQty = Math.abs(txn.quantity)
              return (
                <tr key={txn.id} className="hover:bg-zinc-50">
                  <td className="px-5 py-3 text-zinc-600">
                    {formatLocalDate(txn.transactionDate)}
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn('text-xs font-medium', config.text)}>
                      {INVENTORY_TRANSACTION_TYPE_LABELS[txn.type]}
                    </span>
                  </td>
                  <td className={cn('px-5 py-3 text-right tabular-nums font-medium', config.text)}>
                    {config.sign}{absQty}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-zinc-500">
                    {txn.reference ?? <span className="text-zinc-300">—</span>}
                  </td>
                  <td className="max-w-xs px-5 py-3 text-zinc-500">
                    {txn.notes ? (
                      <span className="truncate">{txn.notes}</span>
                    ) : (
                      <span className="text-zinc-300">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
