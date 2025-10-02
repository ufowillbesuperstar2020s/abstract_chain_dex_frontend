'use client';

import { create } from 'zustand';
import axios, { AxiosResponse } from 'axios';
import { StatusCodes } from 'http-status-codes';
import { useTokenInfoStore } from '@/app/stores/tokenInfo-store';
import { DEFAULT_TOKEN_ADDRESS } from '@/utils/constants';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

type Quote = 'USD' | 'WETH';

type MarketApiToken = {
  buy_count?: number;
  holders_count?: number;
  liquidity?: string; // USD
  price?: string; // quoted in WETH or USD depending on pair
  sell_count?: number;
  total_supply?: string; // base units
  tx_count?: number;
  weth_usd_price?: string; // USD per WETH (if present)
};

type MarketApiResponse = {
  token?: MarketApiToken;
  trade?: unknown; // not used here
};

export type TokenMetrics = {
  usdPrice: number | null;
  liquidityUsd: number | null;
  supplyHuman: number | null;
};

type TokenMetricsState = {
  pairAddress: string;
  quote: Quote; // how "price" in API is quoted
  metrics: TokenMetrics | null;
  isLoading: boolean;

  setPairAddress: (addr: string) => void;
  setQuote: (q: Quote) => void;

  fetchMetrics: (pairAddress?: string) => Promise<void>;
  refresh: () => Promise<void>;
};

// helpers
const toNum = (v: unknown): number | null => {
  if (v == null) return null;
  const n = Number(v as any);
  return Number.isFinite(n) ? n : null;
};

export const useTokenMetricsStore = create<TokenMetricsState>((set, get) => ({
  pairAddress: DEFAULT_TOKEN_ADDRESS, // fallback
  quote: 'WETH', // default; switch to 'USD' if your selected pair is a USD pool
  metrics: null,
  isLoading: false,

  setPairAddress: (addr) => set({ pairAddress: addr }),
  setQuote: (q) => set({ quote: q }),

  fetchMetrics: async (pairAddress?: string) => {
    const addr = pairAddress ?? get().pairAddress;
    if (!addr) return;

    set({ isLoading: true });

    try {
      const url = `${API_BASE}/api/info/market/${addr}`;
      const res: AxiosResponse<MarketApiResponse> = await axios.get(url);

      if (res.status !== StatusCodes.OK) {
        throw new Error('Market API returned unsuccessful response');
      }

      const t = res.data?.token ?? {};
      const priceRaw = toNum(t.price);
      const wethUsd = toNum(t.weth_usd_price);
      const liquidityUsd = toNum(t.liquidity);

      // decimals come from token info store
      const decimals = useTokenInfoStore.getState().tokenMetadata?.decimals ?? 0;
      const totalSupplyRaw = t.total_supply ?? null;

      let usdPrice: number | null = null;
      if (priceRaw != null) {
        usdPrice = get().quote === 'USD' ? priceRaw : wethUsd != null ? priceRaw * wethUsd : null;
      }

      let supplyHuman: number | null = null;
      if (totalSupplyRaw != null) {
        // note: big numbers are formatted for display only; precision beyond JS number isn’t necessary for UI
        const asNum = Number(totalSupplyRaw);
        if (Number.isFinite(asNum)) {
          supplyHuman = asNum / Math.pow(10, decimals);
        } else {
          // fallback for scientific/big strings
          supplyHuman = Number(parseFloat(String(totalSupplyRaw))) / Math.pow(10, decimals);
        }
      }

      set({
        metrics: {
          usdPrice,
          liquidityUsd,
          supplyHuman
        }
      });
    } catch (e) {
      console.error('Error fetching token metrics:', e);
      set({ metrics: null });
    } finally {
      set({ isLoading: false });
    }
  },

  refresh: async () => {
    await get().fetchMetrics();
  }
}));
