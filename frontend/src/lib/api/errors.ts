export interface ApiErrorData {
  status: number
  code?: string
  message: string
  details?: unknown
}

export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly details?: unknown

  constructor(data: ApiErrorData) {
    super(data.message)
    this.name = 'ApiError'
    this.status = data.status
    this.code = data.code
    this.details = data.details
  }

  get isNotFound() { return this.status === 404 }
  get isUnauthorized() { return this.status === 401 }
  get isForbidden() { return this.status === 403 }
  get isValidationError() { return this.status === 422 }
  get isConflict() { return this.status === 409 }
  get isServerError() { return this.status >= 500 }
}

export function normalizeError(err: unknown): ApiError {
  if (err instanceof ApiError) return err
  if (err instanceof Error) {
    return new ApiError({ status: 0, message: err.message, code: 'NETWORK_ERROR' })
  }
  return new ApiError({ status: 0, message: 'An unknown error occurred', code: 'UNKNOWN' })
}
