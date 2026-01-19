import { BadRequestException } from '@nestjs/common';

export type Operator = 'LT' | 'LTE' | 'GT' | 'GTE' | 'EQ' | 'NEQ';

export function toBigIntOrThrow(id: unknown, name = 'id'): bigint {
  try {
    if (typeof id === 'bigint') return id;
    if (typeof id === 'number') {
      if (!Number.isFinite(id)) throw new Error('NaN');
      return BigInt(id);
    }
    if (typeof id === 'string') {
      const s = id.trim();
      if (!s) throw new Error('empty');
      return BigInt(s);
    }
  } catch {
  }
  throw new BadRequestException(`${name} không hợp lệ`);
}

export function idToString(v: unknown): string {
  if (typeof v === 'bigint') return v.toString();
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') return v;
  return String(v ?? '');
}

export function decimalToNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function compare(operator: Operator, value: number, threshold: number): boolean {
  switch (operator) {
    case 'LT':
      return value < threshold;
    case 'LTE':
      return value <= threshold;
    case 'GT':
      return value > threshold;
    case 'GTE':
      return value >= threshold;
    case 'EQ':
      return value === threshold;
    case 'NEQ':
      return value !== threshold;
    default:
      return false;
  }
}
