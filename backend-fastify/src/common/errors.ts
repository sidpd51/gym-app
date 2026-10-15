/**
 * Single domain error type. The Fastify error handler serializes it as
 * { code, status, message, details? } — the shape the frontend expects
 * (frontend/src/lib/api/errors.ts).
 */
export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
    public details?: unknown,
    public override readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  withDetails(d: unknown): this {
    this.details = d;
    return this;
  }

  toJSON() {
    return {
      code: this.code,
      status: this.status,
      message: this.message,
      ...(this.details !== undefined ? { details: this.details } : {}),
    };
  }
}

export const badRequest = (code: string, message: string) => new AppError(code, 400, message);
export const unauthenticated = (code: string, message: string) => new AppError(code, 401, message);
export const forbidden = (code: string, message: string) => new AppError(code, 403, message);
export const notFound = (code: string, message: string) => new AppError(code, 404, message);
export const conflict = (code: string, message: string) => new AppError(code, 409, message);
export const businessRule = (code: string, message: string) => new AppError(code, 422, message);
export const internalError = (code = 'INTERNAL_SERVER_ERROR') =>
  new AppError(code, 500, 'An internal server error occurred.');
