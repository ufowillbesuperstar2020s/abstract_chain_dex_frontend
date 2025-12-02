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

  // 🔥 KEEP iconUrl and all UI fields on initial hydration
  setInitialPairs: (rows) =>
    set((state) => {
      const newPairs = { ...state.pairs };

      for (const r of rows) {
        const prev = state.pairs[r.pair_address];

        newPairs[r.pair_address] = {
          ...(prev ?? {}),
          ...r, // includes iconUrl
          iconUrl: r.iconUrl // 🔥 force logo value
        };
      }

      return { pairs: newPairs };
    }),

  // 🔥 DO NOT overwrite iconUrl during realtime updates
  updatePair: (incoming: PairRealtimeUpdate) =>
    set((state) => {
      const prev = state.pairs[incoming.pair_address];
      if (!prev) return state;

      return {
        pairs: {
          ...state.pairs,
          [incoming.pair_address]: {
            ...prev,
            ...incoming,

            // 🔥 always preserve existing iconUrl
            iconUrl: prev.iconUrl
          }
        }
      };
    })
}));
