export type ApiPairLike = {
  pair_address: string;
  token_symbol?: string | null;
};

const up = (s?: string | null) => (s ?? '').toUpperCase();

/** Default quote symbols. */
export const DEFAULT_QUOTE_SYMBOLS = new Set(['WETH', 'USDT', 'USDC', 'WBTC', 'ETH']);

type Options = {
  /** Symbols to treat as “quote” (e.g., WETH). Defaults to DEFAULT_QUOTE_SYMBOLS. */
  quoteSymbols?: Set<string> | string[];
};

/**
 * From a list of rows that may contain two entries per pair_address
 * (base token + quote token), keep exactly ONE: the non-quote if present.
 * Falls back to the first row if both are quotes or symbol is missing.
 */
export function pickBasePerPair<T extends ApiPairLike>(pairs: T[], opts: Options = {}): T[] {
  const quoteSet: Set<string> =
    opts.quoteSymbols instanceof Set
      ? opts.quoteSymbols
      : new Set((opts.quoteSymbols ?? Array.from(DEFAULT_QUOTE_SYMBOLS)).map(up));

  const byPair = new Map<string, T[]>();

  for (const p of pairs) {
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
