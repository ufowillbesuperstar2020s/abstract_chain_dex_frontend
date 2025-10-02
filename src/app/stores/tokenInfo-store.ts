'use client';

import { create } from 'zustand';
import axios, { AxiosResponse } from 'axios';
import { StatusCodes } from 'http-status-codes';
import type { TokenMetadata } from '@/types/api';
import { DEFAULT_TOKEN_ADDRESS } from '@/utils/constants';

const TOKEN_ADDRESS = DEFAULT_TOKEN_ADDRESS;
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

type TokenInfoState = {
  tokenAddress: string;
  tokenMetadata: TokenMetadata | null;
  isLoading: boolean;

  setTokenAddress: (addr: string) => void;
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
  tokenAddress: TOKEN_ADDRESS,
  tokenMetadata: null,
  isLoading: false,

  setTokenAddress: (addr) => set({ tokenAddress: addr }),
  setTokenMetadata: (data) => set({ tokenMetadata: data }),

  fetchTokenMetadata: async (address: string) => {
    if (!address) return;
    set({ isLoading: true });
    try {
      const res: AxiosResponse<Partial<TokenMetadata>> = await axios.get<Partial<TokenMetadata>>(
        `${API_BASE}/api/info/token/${address}`
      );

      if (res.status !== StatusCodes.OK) {
        throw new Error('Looter API returned unsuccessful response');
      }

      const fromApis = res.data ?? {};

      const normalized: TokenMetadata = {
        name: fromApis.name ?? 'Noot Noot',
        symbol: fromApis.symbol ?? 'NOOT',
        decimals: fromApis.decimals ?? 8,
        address: fromApis.address ?? address
      };

      set({ tokenMetadata: normalized });
      if (typeof window !== 'undefined') window.gTokenAddress = address;
    } catch (e) {
      console.error('Error fetching token data:', e);
      set({ tokenMetadata: null });
    } finally {
      set({ isLoading: false });
    }
  },

  refreshTokenData: async () => {
    const addr = get().tokenAddress;
    await get().fetchTokenMetadata(addr);
  }
}));
