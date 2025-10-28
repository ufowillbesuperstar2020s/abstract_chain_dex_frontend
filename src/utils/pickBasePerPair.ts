export type ApiPairLike = {
  pair_address: string;
  token_symbol?: string | null;
  token_name?: string | null;
  token0_address?: string | null;
  token1_address?: string | null;
};

const up = (s?: string | null) => (s ?? '').toUpperCase();

/** Default quote symbols. */
export const DEFAULT_QUOTE_SYMBOLS = new Set(['WETH', 'USDT', 'USDC', 'USDC.e', 'WBTC', 'ETH']);

type Options = {
  /** Symbols to treat as “quote” (e.g., WETH). Defaults to DEFAULT_QUOTE_SYMBOLS. */
  quoteSymbols?: Set<string> | string[];
};

/* ----------------- Address constants (lowercased) ----------------- */
const USDCe_A = '0x3439153eb7af838ad19d56e1571fbd09333c2809'; // USDC.e token variant A
const USDCe_B = '0x84a71ccd554cc1b02749b35d22f684cc8ec987e1'; // USDC.e token variant B (core)
const USDT_ADDR = '0x0709f39376deee2a2dfc94a58edeb2eb9df012bd';

const USDC_E_CORE = new Set([USDCe_A, USDCe_B].map((x) => x.toLowerCase()));
const USDT = USDT_ADDR.toLowerCase();

/* ----------------- Helpers ----------------- */

function lc(addr?: string | null): string {
  return (addr ?? '').toLowerCase();
}

/** Is (a,b) the unordered pair X–Y ? */
function isPair(a: string, b: string, x: string, y: string): boolean {
  return (a === x && b === y) || (a === y && b === x);
}

/** True if the pair should be removed based on address patterns */
function isBlockedPair<T extends ApiPairLike>(p: T): boolean {
  const a0 = lc(p.token0_address);
  const a1 = lc(p.token1_address);
  if (!a0 || !a1) return false;

  // 1) USDC.e <-> USDC.e (your two USDC.e token addresses, any order)
  const isPureUSDCe = USDC_E_CORE.has(a0) && USDC_E_CORE.has(a1);

  // 2) USDC.e <-> USDT
  const isUSDCeUSDT =
    (USDC_E_CORE.has(a0) && a1 === USDT) ||
    (USDC_E_CORE.has(a1) && a0 === USDT) ||
    isPair(a0, a1, USDCe_B, USDT) ||
    isPair(a0, a1, USDCe_A, USDT);

  return isPureUSDCe || isUSDCeUSDT;
}

/**
 * From a list of rows that may contain two entries per pair_address
 * (base token + quote token), keep exactly ONE: the non-quote if present.
 * Falls back to the first row if both are quotes or symbol is missing.
 * Also removes specific USDC.e patterns entirely.
 */
export function pickBasePerPair<T extends ApiPairLike>(pairs: T[], opts: Options = {}): T[] {
  const quoteSet: Set<string> =
    opts.quoteSymbols instanceof Set
      ? opts.quoteSymbols
      : new Set((opts.quoteSymbols ?? Array.from(DEFAULT_QUOTE_SYMBOLS)).map(up));

  // 1) Remove blocked pairs up front (USDC.e, USDC.e<->USDT, USDC.e<->WETH)
  const cleaned = pairs.filter((p) => !isBlockedPair(p));

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
