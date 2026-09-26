import { Link } from 'react-router-dom'
import { InventoryStatusBadge } from './InventoryStatusBadge'
import { getInventoryStatus } from '../utils/inventory.utils'
import type { InventoryItem, InventoryCategory } from '../types/inventory.types'

function formatLocalDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

interface InventoryTableProps {
  items: InventoryItem[]
  categoriesById: Record<string, InventoryCategory>
}

export function InventoryTable({ items, categoriesById }: InventoryTableProps) {
  if (items.length === 0) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="text-sm font-medium text-zinc-700">No inventory items found</p>
        <p className="mt-1 text-xs text-zinc-500">Try changing your search or filters.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 bg-zinc-50">
            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
              Item
            </th>
            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
              Code
            </th>
            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
              Category
            </th>
            <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-zinc-500">
              Stock
            </th>
            <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-zinc-500">
              Minimum
            </th>
            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
              Status
            </th>
            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
              Updated
            </th>
            <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-zinc-500">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {items.map((item) => {
            const category = categoriesById[item.categoryId] as InventoryCategory | undefined
            const derivedStatus = getInventoryStatus(item.currentStock, item.minimumStock)
            return (
              <tr key={item.id} className="hover:bg-zinc-50">
                <td className="px-5 py-3">
                  <Link
                    to={`/inventory/${item.id}`}
                    className="font-medium text-zinc-900 hover:text-blue-600"
                  >
                    {item.name}
                  </Link>
                </td>
                <td className="px-5 py-3">
                  <span className="font-mono text-xs font-medium text-zinc-500">
                    {item.itemCode}
                  </span>
                </td>
                <td className="px-5 py-3 text-zinc-600">
                  {category?.name ?? <span className="text-zinc-400">Unknown</span>}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-zinc-900">
                  {item.currentStock} {item.unit}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-zinc-500">
                  {item.minimumStock} {item.unit}
                </td>
                <td className="px-5 py-3">
                  <InventoryStatusBadge status={derivedStatus} />
                </td>
                <td className="px-5 py-3 text-zinc-500">
                  {formatLocalDate(item.updatedAt)}
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      to={`/inventory/${item.id}`}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                    <Link
                      to={`/inventory/${item.id}/edit`}
                      className="text-xs font-medium text-zinc-500 hover:underline"
                    >
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
