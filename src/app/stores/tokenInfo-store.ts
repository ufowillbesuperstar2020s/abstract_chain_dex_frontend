'use client';

import { create } from 'zustand';
import type { TokenMetadata } from '@/types/api';
import { fetchTokenMetadataFromApi } from '@/app/actions/token';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'https://server23.looter.ai/evm-chart-api/';

type TokenInfoState = {
  tokenAddress: string | null;
  tokenMetadata: TokenMetadata | null;
  isLoading: boolean;

  setTokenAddress: (addr: string | null) => void;
  setTokenMetadata: (data: TokenMetadata | null) => void;
  fetchTokenMetadata: (address: string) => Promise<void>;
  refreshTokenData: () => Promise<void>;
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
    console.log('wang_here');
    if (!address) return;
    set({ isLoading: true });

    try {
      console.log('wang_address', address);
      const normalized = await fetchTokenMetadataFromApi(address);

      set({ tokenMetadata: normalized, tokenAddress: normalized.address });

      if (typeof window !== 'undefined') {
        window.gTokenAddress = normalized.address;
      }
    } catch (e) {
      console.error('Error fetching token data via server action:', e);
      set({ tokenMetadata: null });
    } finally {
      set({ isLoading: false });
    }
  },

  refreshTokenData: async () => {
    const addr = get().tokenAddress ?? get().tokenMetadata?.address;
    if (!addr) return;
    await get().fetchTokenMetadata(addr);
  }
}));
