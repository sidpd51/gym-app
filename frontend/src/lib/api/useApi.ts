// Shared async data-fetching hooks.
//
// All feature hooks are currently synchronous mocks:
//   useX(): { items } -> repo.list()
// Migration target pattern per feature:
//   const { data, isLoading, error, refetch } = useApiList(query, () => repo.list(query))
//
// These helpers standardize loading/error/refetch so every migrated feature
// behaves the same and pages only need one pattern for skeletons + errors.
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ListQueryParams, PaginatedResponse } from './types'
import { ApiError } from './errors'

interface AsyncState<T> {
  data: T | null
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err
  if (err instanceof Error) {
    return new ApiError({ status: 0, message: err.message, code: 'NETWORK_ERROR' })
  }
  return new ApiError({ status: 0, message: 'Failed to load data', code: 'UNKNOWN' })
}

/** Generic async query: runs fetcher on mount + when depsKey changes. */
export function useApiQuery<T>(fetcher: () => Promise<T>, depsKey = ''): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [nonce, setNonce] = useState(0)
  const activeRef = useRef(true)

  const refetch = useCallback(() => {
    setNonce((n) => n + 1)
  }, [])

  useEffect(() => {
    activeRef.current = true
    setIsLoading(true)
    setError(null)
    fetcher()
      .then((result) => {
        if (activeRef.current) setData(result)
      })
      .catch((err: unknown) => {
        if (activeRef.current) setError(toApiError(err))
      })
      .finally(() => {
        if (activeRef.current) setIsLoading(false)
      })
    return () => {
      activeRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey, nonce])

  return { data, isLoading, error, refetch }
}

interface PaginatedState<T> extends AsyncState<T[]> {
  meta: PaginatedResponse<T>['meta'] | null
}

/** Standard list hook for backend PageResponse<T> = { data, meta }. */
export function useApiList<T>(
  query: ListQueryParams,
  fetcher: (query: ListQueryParams) => Promise<PaginatedResponse<T>>,
): PaginatedState<T> {
  const depsKey = JSON.stringify(query)
  const { data, isLoading, error, refetch } = useApiQuery(
    () => fetcher(query),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    depsKey,
  )
  return {
    data: data?.data ?? null,
    meta: data?.meta ?? null,
    isLoading,
    error,
    refetch,
  }
}

/** Standard detail hook for GET by id. Skips fetch when id is undefined. */
export function useApiDetail<T>(id: string | undefined, fetcher: (id: string) => Promise<T>): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(!!id)
  const [error, setError] = useState<ApiError | null>(null)
  const [nonce, setNonce] = useState(0)
  const activeRef = useRef(true)

  const refetch = useCallback(() => {
    setNonce((n) => n + 1)
  }, [])

  useEffect(() => {
    if (!id) {
      setData(null)
      setIsLoading(false)
      return
    }
    activeRef.current = true
    setIsLoading(true)
    setError(null)
    fetcher(id)
      .then((result) => {
        if (activeRef.current) setData(result)
      })
      .catch((err: unknown) => {
        if (activeRef.current) setError(toApiError(err))
      })
      .finally(() => {
        if (activeRef.current) setIsLoading(false)
      })
    return () => {
      activeRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, nonce])

  return { data, isLoading, error, refetch }
}
