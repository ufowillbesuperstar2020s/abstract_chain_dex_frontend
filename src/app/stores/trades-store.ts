'use client';

import { create } from 'zustand';
import type { Transaction } from '@/types/trades';
import { fetchSwapsByPair } from '@/app/api/looter-server/transactions';

type TradesState = {
  tradesByPair: Record<string, Transaction[]>;
  loadingByPair: Record<string, boolean>;
  errorByPair: Record<string, string | undefined>;

  fetchTrades: (pair: string, opts?: { force?: boolean }) => Promise<void>;
};

// helper to get a human-readable message from an unknown error
function getErrorMessage(err: unknown): string {
  if (err instanceof Error && typeof err.message === 'string') return err.message;
  if (typeof err === 'string') return err;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const maybeMsg = (err as { message?: unknown }).message;
    if (typeof maybeMsg === 'string') return maybeMsg;
  }
  return 'Failed to load';
}

export const useTradesStore = create<TradesState>((set, get) => ({
  tradesByPair: {},
  loadingByPair: {},
  errorByPair: {},

  fetchTrades: async (pair, opts) => {
    const { tradesByPair, loadingByPair } = get();
    if (loadingByPair[pair]) return;
    if (tradesByPair[pair] && !opts?.force) return;

    set((s) => ({
      loadingByPair: { ...s.loadingByPair, [pair]: true },
      errorByPair: { ...s.errorByPair, [pair]: undefined }
    }));

    try {
      const rows = await fetchSwapsByPair(pair);
      set((s) => ({
        tradesByPair: { ...s.tradesByPair, [pair]: rows }
      }));
    } catch (e: unknown) {
      const msg = getErrorMessage(e);
      set((s) => ({
        errorByPair: { ...s.errorByPair, [pair]: msg }
      }));
    } finally {
      set((s) => ({
        loadingByPair: { ...s.loadingByPair, [pair]: false }
      }));
    }
  }
}));
