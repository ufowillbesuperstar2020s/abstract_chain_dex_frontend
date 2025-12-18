import { formatAgeShort } from '@/utils/formatAge';
import { create } from 'zustand';
import type { TokenRow } from '@/types/token-row';

export type PairRealtimeUpdate = {
  pair_address: string;

  usd_price?: string;
  _1h_change?: string;
  _12h_change?: string;
  _24h_change?: string;

  liquidity?: string;
  market_cap?: string;

  age?: number;
  token_decimals?: number;
};

type PairState = {
  pairs: Record<string, TokenRow>;
};

type PairActions = {
  setInitialPairs: (rows: TokenRow[]) => void;
  updatePair: (update: PairRealtimeUpdate) => void;
};

function mapRealtimeUpdate(incoming: PairRealtimeUpdate, prev: TokenRow): TokenRow {
  const decimals = prev.decimals ?? 18;
  const denom = 10 ** decimals;

  const ageSeconds = incoming.age !== undefined ? Math.floor(Number(incoming.age)) : prev.ageSeconds;

  return {
    ...prev,

    priceUsd: incoming.usd_price !== undefined ? Number(incoming.usd_price) : prev.priceUsd,

    change1hPct: incoming._1h_change !== undefined ? Number(incoming._1h_change) : prev.change1hPct,

    change12hPct: incoming._12h_change !== undefined ? Number(incoming._12h_change) : prev.change12hPct,

    change24hPct: incoming._24h_change !== undefined ? Number(incoming._24h_change) : prev.change24hPct,

    liquidityUsd: incoming.liquidity !== undefined ? Number(incoming.liquidity) / denom : prev.liquidityUsd,

    marketcapUsd: incoming.market_cap !== undefined ? Number(incoming.market_cap) / denom : prev.marketcapUsd,

    ageSeconds,
    ageLabel: formatAgeShort(ageSeconds)
  };
}

export const usePairsStore = create<PairState & PairActions>((set) => ({
  pairs: {},

  setInitialPairs: (rows) =>
    set({
      pairs: Object.fromEntries(rows.map((r) => [r.pair_address, r]))
    }),

  updatePair: (incoming) =>
    set((state) => {
      const prev = state.pairs[incoming.pair_address];
      if (!prev) return state;
      const next = mapRealtimeUpdate(incoming, prev);

      return {
        pairs: {
          ...state.pairs,
          [incoming.pair_address]: next
        }
      };
    })
}));

usePairsStore.subscribe((state) => {
  console.log('[PAIRS STORE UPDATED]');
  console.log('size:', Object.keys(state.pairs).length);
  console.log('sample:', Object.values(state.pairs)[0]);
});
