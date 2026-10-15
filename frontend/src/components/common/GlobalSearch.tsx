import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usePermissions } from '@/features/auth/hooks/usePermissions'
import { useDebounce } from '@/features/search/hooks/useDebounce'
import { searchAll } from '@/features/search/utils/search.utils'
import type { GlobalSearchResult, SearchPermissions, SearchResultType, SearchGroup } from '@/features/search/types/search.types'

function useSearchPermissions(): SearchPermissions {
  const { hasPermission } = usePermissions()
  return useMemo(
    () => ({
      members: hasPermission('members:view'),
      membershipPlans: hasPermission('membership-plans:view'),
      memberships: hasPermission('memberships:view'),
      payments: hasPermission('payments:view'),
      trainers: hasPermission('trainers:view'),
      leads: hasPermission('leads:view'),
      expenses: hasPermission('expenses:view'),
      inventory: hasPermission('inventory:view'),
      equipment: hasPermission('equipment:view'),
    }),
    [hasPermission],
  )
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const permissions = useSearchPermissions()
  const debouncedQuery = useDebounce(query, 200)
  const [groups, setGroups] = useState<Partial<Record<SearchResultType, SearchGroup>>>({})
  const [totalResults, setTotalResults] = useState(0)

  // Listen for global shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus input on open, clear state on close
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    } else {
      setQuery('')
      setGroups({})
      setTotalResults(0)
    }
  }, [open])

  // Fetch search results ONLY when dialog is open and query is non-empty
  useEffect(() => {
    if (!open) return

    const trimmed = debouncedQuery.trim()
    if (!trimmed) {
      setGroups({})
      setTotalResults(0)
      return
    }

    let active = true

    searchAll(trimmed, permissions)
      .then((result) => {
        if (!active) return
        setGroups(result)
        const entries = Object.entries(result)
        setTotalResults(entries.reduce((sum, [, g]) => sum + (g?.results.length ?? 0), 0))
      })
      .catch(() => {
        if (!active) return
        setGroups({})
        setTotalResults(0)
      })

    return () => {
      active = false
    }
  }, [open, debouncedQuery, permissions])

  function handleSelect(result: GlobalSearchResult) {
    setOpen(false)
    navigate(result.to)
  }

  function handleClose() {
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-sm text-zinc-400 hover:border-zinc-300 hover:bg-white transition-colors"
        aria-label="Open search"
      >
        <Search size={14} aria-hidden="true" />
        <span className="hidden sm:inline text-xs">Search...</span>
        <span className="hidden sm:inline text-xs text-zinc-300">⌘K</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
          <div
            className="absolute inset-0 bg-black/40"
            aria-hidden="true"
            onClick={handleClose}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Global search"
            className="relative z-10 w-full max-w-lg rounded-xl border border-zinc-200 bg-white shadow-xl overflow-hidden"
          >
            <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3">
              <Search size={16} className="shrink-0 text-zinc-400" aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search members, trainers, equipment..."
                className="flex-1 bg-transparent text-sm text-zinc-900 placeholder-zinc-400 outline-none"
                aria-label="Search query"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-zinc-400 hover:text-zinc-600"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="text-xs text-zinc-400 hover:text-zinc-600 border border-zinc-200 rounded px-1.5 py-0.5"
                aria-label="Close search"
              >
                Esc
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {!query && (
                <p className="px-4 py-8 text-center text-sm text-zinc-400">
                  Start typing to search across the app
                </p>
              )}

              {query && totalResults === 0 && (
                <p className="px-4 py-8 text-center text-sm text-zinc-400">
                  No results for &ldquo;{query}&rdquo;
                </p>
              )}

              {Object.entries(groups).map(([type, group]) => {
                if (!group) return null
                return (
                  <div key={type}>
                    <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                      {group.label}
                    </p>
                    {group.results.map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => handleSelect(result)}
                        className="flex w-full flex-col gap-0.5 px-4 py-2.5 text-left hover:bg-zinc-50"
                      >
                        <span className="text-sm font-medium text-zinc-900">{result.title}</span>
                        <span className="text-xs text-zinc-500">{result.subtitle}</span>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>

            {query && totalResults > 0 && (
              <div className="border-t border-zinc-100 px-4 py-2">
                <p className="text-xs text-zinc-400">
                  {totalResults} result{totalResults !== 1 ? 's' : ''} found
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}