import { create } from 'zustand';
import type { TokenRow } from '@/types/pairs';

type PairState = {
  pairs: Record<string, TokenRow>; // key = pair_address
};

type PairActions = {
  setInitialPairs: (rows: TokenRow[]) => void;
  updatePair: (row: Partial<TokenRow> & { pair_address: string }) => void;
};

export const usePairsStore = create<PairState & PairActions>((set, get) => ({
  pairs: {},

  setInitialPairs: (rows) =>
    set({
      pairs: Object.fromEntries(rows.map((r) => [r.pair_address, r]))
    }),

  updatePair: (incoming) =>
    set((state) => {
      const prev = state.pairs[incoming.pair_address];
      if (!prev) return state;

      return {
        pairs: {
          ...state.pairs,
          [incoming.pair_address]: {
            ...prev,
            ...incoming // overwrite changed fields
          }
        }
      };
    })
}));
