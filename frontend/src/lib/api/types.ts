export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

export interface ListQueryParams {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  fromDate?: string
  toDate?: string
  [key: string]: string | number | boolean | undefined
}
