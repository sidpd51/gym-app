import { z } from 'zod';

/** Accepts a JSON number or numeric string (shopspring/decimal decodes both); normalised to a string. */
export const decimalInput = z
  .union([z.number().finite(), z.string().regex(/^-?\d+(\.\d+)?$/, 'must be a decimal number')])
  .transform((v) => String(v));

/** pg NUMERIC string -> shopspring-style JSON string (trailing zeros trimmed: "1500.00" -> "1500"). */
export function decimalOut(v: string | null | undefined): string | null {
  if (v == null) return null;
  return v.includes('.') ? v.replace(/0+$/, '').replace(/\.$/, '') : v;
}

export const isPositive = (v: string) => Number(v) > 0;
