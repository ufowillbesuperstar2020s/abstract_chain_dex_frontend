// src/utils/formatters.ts

/**
 * Convert big base-unit string (wei-style) into a JS number.
 */
export function bigBaseUnitsToNumber(raw: string | null | undefined, decimals: number): number {
  if (!raw) return 0;
  try {
    const bi = BigInt(raw);
    const base = BigInt(10) ** BigInt(decimals);
    return Number(bi / base) + Number(bi % base) / Number(base);
  } catch {
    // Fallback for non-BigInt-safe strings
    return Number(raw) / Math.pow(10, decimals);
  }
}

/**
 * Format raw ETH (or other token) balance to a string with given decimals.
 */
export function formatToken(amount: bigint, decimals = 18, maxFraction = 4): string {
  const divisor = BigInt(10) ** BigInt(decimals);
  const asNumber = Number(amount) / Number(divisor);
  return asNumber.toLocaleString(undefined, {
    maximumFractionDigits: maxFraction
  });
}

/**
 * Format a USD value for display.
 */
export function formatUsd(value: number, maxFraction = 0): string {
  return value.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: maxFraction
  });
}
