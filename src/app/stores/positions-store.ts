'use client';

import { create } from 'zustand';
import axios, { AxiosResponse } from 'axios';
import { StatusCodes } from 'http-status-codes';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

export type ApiPosition = {
  balance: string;
  chain_id: number;
  cost: string;
  current_value: string;
  entry_price: string;
  token_address: string;
};

type RowsMap = Record<string, ApiPosition[] | undefined>;
type LoadingMap = Record<string, boolean | undefined>;
type ErrorMap = Record<string, string | null | undefined>;

type State = {
  positionsByWallet: RowsMap;
  loadingByWallet: LoadingMap;
  errorByWallet: ErrorMap;

  /** Fetch positions for a wallet; caches by wallet */
  fetchPositions: (wallet: string, opts?: { force?: boolean }) => Promise<void>;
};

export const usePositionsStore = create<State>((set, get) => ({
  positionsByWallet: {},
  loadingByWallet: {},
  errorByWallet: {},

  fetchPositions: async (wallet: string, opts?: { force?: boolean }) => {
    if (!wallet) return;
    const { positionsByWallet, loadingByWallet } = get();
    if (!opts?.force && positionsByWallet[wallet] && !loadingByWallet[wallet]) {
      return; // cached
    }

    set((s) => ({
      loadingByWallet: { ...s.loadingByWallet, [wallet]: true },
      errorByWallet: { ...s.errorByWallet, [wallet]: null }
    }));

    try {
      const url = `${API_BASE}/api/info/positions/${wallet}`;
      const res: AxiosResponse<ApiPosition[]> = await axios.get<ApiPosition[]>(url);

      if (res.status !== StatusCodes.OK || !Array.isArray(res.data)) {
        throw new Error(`Unexpected response (${res.status})`);
      }

      set((s) => ({
        positionsByWallet: { ...s.positionsByWallet, [wallet]: res.data },
        loadingByWallet: { ...s.loadingByWallet, [wallet]: false }
      }));
    } catch (e: unknown) {
      console.error('fetchPositions error', e);
      const message = e instanceof Error ? e.message : 'Failed to load positions';
      set((s) => ({
        loadingByWallet: { ...s.loadingByWallet, [wallet]: false },
        errorByWallet: { ...s.errorByWallet, [wallet]: message }
      }));
    }
  }
}));
