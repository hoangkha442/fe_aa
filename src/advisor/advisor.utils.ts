import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export type Operator = 'LT' | 'LTE' | 'GT' | 'GTE' | 'EQ' | 'NEQ';

export function compare(op: Operator, a: number, b: number): boolean {
  switch (op) {
    case 'LT':
      return a < b;
    case 'LTE':
      return a <= b;
    case 'GT':
      return a > b;
    case 'GTE':
      return a >= b;
    case 'EQ':
      return a === b;
    case 'NEQ':
      return a !== b;
    default:
      return false;
  }
}

export function decimalToNumber(v: any): number | null {
  if (v == null) return null;
  // Prisma Decimal -> decimal.js
  if (typeof v === 'object' && typeof v.toNumber === 'function') return v.toNumber();
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function idToString(v: any): string {
  if (v == null) return '';
  if (typeof v === 'bigint') return v.toString();
  return String(v);
}

export function toBigIntOrThrow(input: any, fieldName: string): bigint {
  try {
    if (typeof input === 'bigint') return input;
    if (typeof input === 'number') {
      if (!Number.isFinite(input)) throw new Error('invalid number');
      return BigInt(Math.trunc(input));
    }
    const s = String(input).trim();
    if (!s) throw new Error('empty');
    // only digits
    if (!/^\d+$/.test(s)) throw new Error('not integer');
    return BigInt(s);
  } catch {
    throw new BadRequestException(`Trường ${fieldName} không hợp lệ`);
  }
}

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function safeJson(details: any): Prisma.InputJsonValue {
  return (details ?? null) as any;
}
