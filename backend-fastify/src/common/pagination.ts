const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export interface PageQuery {
  page: number;
  pageSize: number;
  search: string;
  status: string;
  fromDate: string;
  toDate: string;
}

export interface PageResponse<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export const pageOffset = (q: { page: number; pageSize: number }) => (q.page - 1) * q.pageSize;

function atoiOr(v: unknown, def: number): number {
  if (typeof v !== 'string' || v === '') return def;
  const n = Number.parseInt(v, 10);
  return Number.isNaN(n) ? def : n;
}

const str = (v: unknown) => (typeof v === 'string' ? v : '');

/** page defaults to 1; pageSize defaults to 20, clamped to [1, 100]. */
export function parsePageQuery(query: unknown): PageQuery {
  const q = (query ?? {}) as Record<string, unknown>;
  const page = Math.max(1, atoiOr(q.page, DEFAULT_PAGE));
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, atoiOr(q.pageSize, DEFAULT_PAGE_SIZE)));
  return {
    page,
    pageSize,
    search: str(q.search),
    status: str(q.status),
    fromDate: str(q.fromDate),
    toDate: str(q.toDate),
  };
}

export function newPage<T>(data: T[] | null | undefined, page: number, pageSize: number, total: number): PageResponse<T> {
  return {
    data: data ?? [],
    meta: { page, pageSize, total, totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0 },
  };
}
