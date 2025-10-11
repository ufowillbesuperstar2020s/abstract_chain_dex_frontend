export type PairLike = {
  token0_address?: string | null;
  token1_address?: string | null;
  // Optional chain id if your pair object carries it
  chain_id?: number | null;
};

export type AssetQuote = {
  asset: string;
  quote: string;
  reason: 'quote-in-allowlist' | 'fallback-heuristic';
  certain: boolean;
};

/** Normalize an address to lowercase 0x…; returns '' for invalid/empty. */
export function normalize(addr?: string | null): string {
  if (!addr) return '';
  const a = String(addr).trim();
  return /^0x[a-fA-F0-9]{40}$/i.test(a) ? a.toLowerCase() : '';
}

/**
 * Default quote allowlist per chain (lowercased).
 * NOTE: Add more chains/tokens here as needed.
 */
const DEFAULT_QUOTES: Record<number, string[]> = {
  // Abstract mainnet (per your data): WETH, USDC
  2741: [
    '0x3439153eb7af838ad19d56e1571fbd09333c2809', // WETH
    '0x34cccd4508458e0dbdbfa291a77673e4636e9b54' // USDC : !!! not confirmed !!!
  ]
};

/** Build the quote set for a chain id. Falls back to 2741 if unknown. */
function getQuoteSet(chainId?: number | null): Set<string> {
  const base = DEFAULT_QUOTES[chainId ?? 2741] ?? DEFAULT_QUOTES[2741] ?? [];
  return new Set(base.map(normalize).filter(Boolean));
}

/**
 * Pick asset/quote from a pair.
 * - If exactly one side is in the quote allowlist ⇒ that side is quote, the other is asset.
 * - Otherwise fall back to { asset = token0, quote = token1 } and mark as uncertain.
 */
export function pickAssetAndQuote(pair: PairLike): AssetQuote {
  const t0 = normalize(pair.token0_address);
  const t1 = normalize(pair.token1_address);

  if (!t0 || !t1) {
    // If something is missing, still return a best-effort result.
    const asset = t0 || t1 || '';
    const quote = t0 && t1 ? (t0 === asset ? t1 : t0) : '';
    return { asset, quote, reason: 'fallback-heuristic', certain: false };
  }

  const quotes = getQuoteSet(pair.chain_id);
  const t0IsQuote = quotes.has(t0);
  const t1IsQuote = quotes.has(t1);

  if (t0IsQuote && !t1IsQuote) {
    return { asset: t1, quote: t0, reason: 'quote-in-allowlist', certain: true };
  }
  if (t1IsQuote && !t0IsQuote) {
    return { asset: t0, quote: t1, reason: 'quote-in-allowlist', certain: true };
  }

  // If both are quotes or neither is, we can’t be sure. Default to token0 as asset.
  return { asset: t0, quote: t1, reason: 'fallback-heuristic', certain: false };
}

/** Convenience: return just the asset token address (non-quote). */
export function getTokenAddress(pair: PairLike): string {
  return pickAssetAndQuote(pair).asset;
}
