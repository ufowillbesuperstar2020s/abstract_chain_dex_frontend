'use client';

import { create } from 'zustand';
import type { TokenMetadata } from '@/types/api';
import { fetchTokenMetadataFromApi } from '@/app/actions/token';

type TokenInfoState = {
  // playing game?
  tokenAddress: string | null;
  tokenMetadata: TokenMetadata | null;
  isLoading: boolean;

  setTokenAddress: (addr: string | null) => void;
  setTokenMetadata: (data: TokenMetadata | null) => void;
  fetchTokenMetadata: (address: string) => Promise<void>;
  refreshTokenData: () => Promise<void>;

  metaMap: Record<string, TokenMetadata>;
  getTokenMetadata: (addr: string) => TokenMetadata | undefined;
  loadTokenMetadata: (addr: string) => Promise<void>;
};

declare global {
  interface Window {
    gTokenAddress?: string;
  }
}

export const useTokenInfoStore = create<TokenInfoState>((set, get) => ({
  tokenAddress: null,
  tokenMetadata: null,
  isLoading: false,

  setTokenAddress: (addr) => set({ tokenAddress: addr }),
  setTokenMetadata: (data) => set({ tokenMetadata: data }),

  fetchTokenMetadata: async (address: string) => {
    if (!address) return;
    set({ isLoading: true });

    try {
      const normalized = await fetchTokenMetadataFromApi(address);
      set({
        tokenMetadata: normalized,
        tokenAddress: normalized.address
      });

      if (typeof window !== 'undefined') {
        window.gTokenAddress = normalized.address;
      }
    } catch (e) {
      console.error('[tokenInfo] fetch error:', e);
      set({ tokenMetadata: null });
    } finally {
      set({ isLoading: false });
    }
  },

  refreshTokenData: async () => {
    const addr = get().tokenAddress ?? get().tokenMetadata?.address;
    if (!addr) return;
    await get().fetchTokenMetadata(addr);
  },

  metaMap: {},

  getTokenMetadata: (addr) => {
    return get().metaMap[addr.toLowerCase()];
  },

  loadTokenMetadata: async (addr: string) => {
    const key = addr.toLowerCase();
    if (get().metaMap[key]) return;

    try {
      const data = await fetchTokenMetadataFromApi(addr);
      set((s) => ({
        metaMap: { ...s.metaMap, [key]: data }
      }));
    } catch (err) {
      console.error('[tokenInfo] map load failed:', err);
    }
  }
}));
