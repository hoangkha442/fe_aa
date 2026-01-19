export function toBigInt(id: string | number | bigint): bigint {
  if (typeof id === 'bigint') return id;
  if (typeof id === 'number') return BigInt(id);
  if (typeof id === 'string') return BigInt(id);
  throw new Error('Invalid id for BigInt');
}

export function idToString(v: unknown): string {
  if (typeof v === 'bigint') return v.toString();
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') return v;
  return String(v ?? '');
}

export function decimalToNumber(v: any): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
