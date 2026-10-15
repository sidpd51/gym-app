import type { FastifyRequest } from 'fastify';
import { z } from 'zod';
import { badRequest } from './errors.js';

/**
 * Parse with a zod schema. A failure throws ZodError, which the global error
 * handler renders as 400 VALIDATION_FAILED with { details: { fields } }.
 */
export function parse<S extends z.ZodType>(schema: S, data: unknown): z.infer<S> {
  return schema.parse(data ?? {});
}

/** Reads a route param and requires it to be a UUID (else 400 INVALID_UUID). */
export function uuidParam(req: FastifyRequest, name: string, message: string): string {
  const v = (req.params as Record<string, string>)[name];
  if (!z.uuid().safeParse(v).success) throw badRequest('INVALID_UUID', message);
  return v;
}

/** YYYY-MM-DD calendar date (rejects 2024-02-31). Equivalent to validator `datetime=2006-01-02`. */
export const dateString = z.string().refine(
  (s) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  },
  { message: 'must be YYYY-MM-DD' },
);

/** Go validator `omitempty` treats "" as absent; use for optional string fields where "" is allowed. */
export const emptyToUndefined = (v: unknown) => (v === '' ? undefined : v);

export { todayIST } from './time.js';
