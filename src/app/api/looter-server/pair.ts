export type Resolution = '1h' | '12h' | '1d';
export interface PairListParams {
  resolution: Resolution;
  index: number;
  limit: number;
}

type NumLike = number | string;

interface TradeStats {
  volumeUsd?: NumLike;
  volumeToken?: NumLike;
  txCount?: number;
  priceOpenUsd?: NumLike;
  priceCloseUsd?: NumLike;
  changePct?: number;
  [k: string]: unknown; // allows extra fields without `any`
}

export async function fetchPairs({ resolution, index, limit }: PairListParams) {
  const base = process.env.NEXT_PUBLIC_API_BASE ?? 'https://server23.looter.ai/evm-chart-api/';
  const url = `${base}/api/info/pair/list?resolution=${resolution}&index=${index}&limit=${limit}`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Pair list fetch failed: ${res.status}`);
  return (await res.json()) as {
    pairs: Array<{
      created_at: number;
      pair_address: string;
      token0: { address: string; decimals: number; name: string; symbol: string };
      token1: { address: string; decimals: number; name: string; symbol: string };
      market: {
        token: { price: string; total_supply: string; liquidity: string; migrate: string };
        trade: {
          _1h?: TradeStats;
          _12h?: TradeStats;
          _1d?: TradeStats;
        };
      };
    }>;
  };
}
