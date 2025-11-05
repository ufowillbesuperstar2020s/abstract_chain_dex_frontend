export type ApiPairLike = {
  pair_address: string;
  token_symbol?: string | null;
  token_name?: string | null;
  token0_address?: string | null;
  token1_address?: string | null;
};

const up = (s?: string | null) => (s ?? '').trim().toUpperCase();

/** Default symbols to treat as quote and therefore REMOVE. */
export const DEFAULT_QUOTE_SYMBOLS = new Set(['WETH', 'USDT', 'USDC', 'USDC.E', 'WBTC', 'ETH']);

type Options = {
  /** Symbols to treat as “quote”. Defaults to DEFAULT_QUOTE_SYMBOLS. */
  quoteSymbols?: Set<string> | string[];
};

/**
 * Keep rows whose token_symbol is NOT a quote symbol.
 * Also de-duplicate by pair_address (first occurrence wins to keep list stable).
 */
export function pickBasePerPair<T extends ApiPairLike>(pairs: T[], opts: Options = {}): T[] {
  const quoteSet: Set<string> =
    opts.quoteSymbols instanceof Set
      ? opts.quoteSymbols
      : new Set((opts.quoteSymbols ?? Array.from(DEFAULT_QUOTE_SYMBOLS)).map(up));

  // 1) Remove ONLY quote-symbol rows (case/space tolerant)
  const nonQuotes = pairs.filter((p) => !quoteSet.has(up(p.token_symbol)));

  // 2) Deduplicate by pair_address (stable)
  const seen = new Set<string>();
  const result: T[] = [];

  for (const p of nonQuotes) {
    const key = (p.pair_address ?? '').toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(p);
  }

  return result;
}
