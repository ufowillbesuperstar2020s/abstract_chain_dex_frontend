export type ApiPairLike = {
  pair_address: string;
  token_symbol?: string | null;
  token_name?: string | null;
  token0_address?: string | null;
  token1_address?: string | null;
};

const up = (s?: string | null) => (s ?? '').toUpperCase();

/* Default quote symbols  */
export const DEFAULT_QUOTE_SYMBOLS = new Set(['WETH', 'USDT', 'USDC', 'USDC.e', 'WBTC', 'ETH']);

type Options = {
  /** Symbols to treat as “quote”. Defaults to DEFAULT_QUOTE_SYMBOLS. */
  quoteSymbols?: Set<string> | string[];
};

/* ----------------- Address constants (lowercased) ----------------- */
const USDCe_A = '0x3439153eb7af838ad19d56e1571fbd09333c2809';
const USDCe_B = '0x84a71ccd554cc1b02749b35d22f684cc8ec987e1';
const USDT_ADDR = '0x0709f39376deee2a2dfc94a58edeb2eb9df012bd';
const WETH_ADDR = '0xc325b7e2736a5202bd860f5974d0aa375e57ede5';

const USDC_E_CORE = new Set([USDCe_A, USDCe_B].map((x) => x.toLowerCase()));
const USDT = USDT_ADDR.toLowerCase();
const WETH = WETH_ADDR.toLowerCase();

/* ----------------- Helpers ----------------- */

function lc(addr?: string | null): string {
  return (addr ?? '').toLowerCase();
}

function isPair(a: string, b: string, x: string, y: string): boolean {
  return (a === x && b === y) || (a === y && b === x);
}

/** rows we always want to drop (symbol/name-based fast path) */
function isUSDCeByLabel<T extends ApiPairLike>(p: T): boolean {
  const sym = up(p.token_symbol);
  const name = (p.token_name ?? '').toLowerCase();
  return sym === 'USDC.E' || name.includes('bridged usdc');
}

/** rows we want to drop by address pattern */
function isUSDCeByAddress<T extends ApiPairLike>(p: T): boolean {
  const a0 = lc(p.token0_address);
  const a1 = lc(p.token1_address);
  if (!a0 || !a1) return false;

  // USDC.e <-> USDC.e
  const isPureUSDCe = USDC_E_CORE.has(a0) && USDC_E_CORE.has(a1);

  // USDC.e <-> USDT
  const isUSDCeUSDT =
    (USDC_E_CORE.has(a0) && a1 === USDT) ||
    (USDC_E_CORE.has(a1) && a0 === USDT) ||
    isPair(a0, a1, USDT, Array.from(USDC_E_CORE)[0]) ||
    isPair(a0, a1, USDT, Array.from(USDC_E_CORE)[1] ?? '');

  // USDC.e <-> WETH
  const isUSDCeWETH =
    (USDC_E_CORE.has(a0) && a1 === WETH) ||
    (USDC_E_CORE.has(a1) && a0 === WETH) ||
    isPair(a0, a1, WETH, Array.from(USDC_E_CORE)[0]) ||
    isPair(a0, a1, WETH, Array.from(USDC_E_CORE)[1] ?? '');

  return isPureUSDCe || isUSDCeUSDT || isUSDCeWETH;
}

/** final gate: ban by label OR by address */
function isBanned<T extends ApiPairLike>(p: T): boolean {
  return isUSDCeByLabel(p) || isUSDCeByAddress(p);
}

/**
 * From a list of rows that may contain two entries per pair_address
 * (base token + quote token), keep exactly ONE: the non-quote if present.
 * Falls back to the first row if both are quotes or symbol is missing.
 * Also removes USDC.e (by label) and your listed address patterns entirely.
 */
export function pickBasePerPair<T extends ApiPairLike>(pairs: T[], opts: Options = {}): T[] {
  const quoteSet: Set<string> =
    opts.quoteSymbols instanceof Set
      ? opts.quoteSymbols
      : new Set((opts.quoteSymbols ?? Array.from(DEFAULT_QUOTE_SYMBOLS)).map(up));

  // 1) Hard filter (delete banned rows BEFORE grouping)
  const cleaned = pairs.filter((p) => !isBanned(p));

  // 2) Group by pair and pick base over quote
  const byPair = new Map<string, T[]>();

  for (const p of cleaned) {
    const key = (p.pair_address ?? '').toLowerCase();
    if (!key) continue;
    const arr = byPair.get(key);
    if (arr) arr.push(p);
    else byPair.set(key, [p]);
  }

  const picked: T[] = [];
  for (const arr of byPair.values()) {
    const nonQuote = arr.find((x) => !quoteSet.has(up(x.token_symbol)));
    picked.push(nonQuote ?? arr[0]);
  }

  return picked;
}
