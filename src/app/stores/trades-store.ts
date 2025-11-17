import { create } from 'zustand';
import type { Transaction } from '@/types/trades';
import { fetchSwapsByPairPage } from '@/app/api/looter-server/transactions';

type LoadingMap = Record<string, boolean>;
type RowsMap = Record<string, Transaction[]>;
type PageMap = Record<string, number>; // last successfully loaded page index per pair

// compatibility signature used by some components
type FetchTradesOpts =
  | { force?: boolean; limit?: number } // initial refresh (page 0)
  | { before?: number; limit?: number }; // legacy ts-based paging (we’ll map to pages)

type State = {
  tradesByPair: RowsMap;
  pagesByPair: PageMap;
  loadingByPair: LoadingMap;
};

type Actions = {
  /** Clear rows & page index for a pair (called on pair switch) */
  resetPair: (pair: string) => void;

  /**
   * Page-indexed fetch. Loads `index` (0-based) with `limit`,
   * appends for index > 0, replaces for index === 0.
   * Returns the number of rows fetched.
   */
  fetchPage: (pair: string, index: number, limit?: number) => Promise<number>;

  /** Push new live trades to the *top* of the list (websocket). */
  prependTrades: (pair: string, items: Transaction | Transaction[]) => void;

  /** Alias so components can call either name */
  fetchTradesPaged: (pair: string, index: number, limit?: number) => Promise<number>;

  /**
   * Backward-compatible API used in older components.
   * - { force, limit }  -> fetch page 0
   * - { before, limit } -> fetch next page after the last loaded (ignores `before`)
   * Returns number of rows fetched when meaningful.
   */
  fetchTrades: (pair: string, opts?: FetchTradesOpts) => Promise<number | void>;
};

export const useTradesStore = create<State & Actions>((set, get) => ({
  tradesByPair: {},
  pagesByPair: {},
  loadingByPair: {},

  resetPair: (pair) =>
    set((s) => ({
      tradesByPair: { ...s.tradesByPair, [pair]: [] },
      pagesByPair: { ...s.pagesByPair, [pair]: -1 },
      loadingByPair: { ...s.loadingByPair, [pair]: false }
    })),

  fetchPage: async (pair, index, limit = 100) => {
    // mark loading
    set((s) => ({ loadingByPair: { ...s.loadingByPair, [pair]: true } }));
    try {
      const rows = await fetchSwapsByPairPage(pair, index, limit);

      set((s) => {
        const prev = s.tradesByPair[pair] ?? [];
        const next = index === 0 ? rows : [...prev, ...rows];
        return {
          tradesByPair: { ...s.tradesByPair, [pair]: next },
          pagesByPair: { ...s.pagesByPair, [pair]: index }
        };
      });

      return rows.length;
    } finally {
      // clear loading
      set((s) => ({ loadingByPair: { ...s.loadingByPair, [pair]: false } }));
    }
  },

  prependTrades: (pair, items) => {
    const list = Array.isArray(items) ? items : [items];
    if (!list.length) return;

    set((s) => {
      const prev = s.tradesByPair[pair] ?? [];

      const existing = new Set(prev.map((t) => t.tx_hash));
      const fresh = list.filter((t) => !existing.has(t.tx_hash));

      if (!fresh.length) {
        // nothing new
        return s;
      }

      // newest first (WS normally sends newest first)
      const merged = [...fresh, ...prev];

      // hard limit to avoid huge memory
      const MAX_ROWS = 1000;
      const trimmed = merged.slice(0, MAX_ROWS);

      return {
        tradesByPair: { ...s.tradesByPair, [pair]: trimmed }
      };
    });
  },

  // simple alias
  fetchTradesPaged: async (pair, index, limit = 100) => {
    return get().fetchPage(pair, index, limit);
  },

  fetchTrades: async (pair, opts) => {
    const limit = opts?.limit ?? 100;

    // If caller passed "before", they intended to load older rows.
    // We don’t have ts-based upstream here, so just load the *next page*
    // after the last one we loaded for this pair.
    const last = get().pagesByPair[pair] ?? -1;
    const next = last + 1;
    return get().fetchPage(pair, next, limit);
  }
}));
