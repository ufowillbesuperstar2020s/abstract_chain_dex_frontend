import { create } from 'zustand';

export type PairRealtimeUpdate = {
  pair_address: string;

  priceUsd?: number;
  change1hPct?: number;
  change12hPct?: number;
  change24hPct?: number;
  volume24hUsd?: number;
  liquidityUsd?: number;
  marketcapUsd?: number;
};

type PairState = {
  pairs: Record<string, any>;
};

type PairActions = {
  setInitialPairs: (rows: any[]) => void;
  updatePair: (update: PairRealtimeUpdate) => void;
};

export const usePairsStore = create<PairState & PairActions>((set, get) => ({
  pairs: {},

  setInitialPairs: (rows) =>
    set({
      pairs: Object.fromEntries(rows.map((r) => [r.pair_address, r]))
    }),

  updatePair: (incoming: PairRealtimeUpdate) =>
    set((state) => {
      const prev = state.pairs[incoming.pair_address];
      if (!prev) return state;
      return {
        pairs: {
          ...state.pairs,
          [incoming.pair_address]: {
            ...prev,
            ...incoming
          }
        }
      };
    })
}));
