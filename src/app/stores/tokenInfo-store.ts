'use client';

import { create } from 'zustand';
import axios, { AxiosResponse } from 'axios';
import { StatusCodes } from 'http-status-codes';
import type { TokenMetadata } from '@/types/api';

const TOKEN_ADDRESS = '0x85Ca16Fd0e81659e0b8Be337294149E722528731'; //'wang_tmp_TOKEN_ADDRESS'
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'https://server23.looter.ai/evm-chart-api/';

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
        token_name: fromApis.token_name ?? 'Noot Noot',
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
