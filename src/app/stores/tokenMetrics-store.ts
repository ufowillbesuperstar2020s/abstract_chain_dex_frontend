'use client';

import { create } from 'zustand';
import axios, { AxiosResponse } from 'axios';
import { StatusCodes } from 'http-status-codes';
import { useTokenInfoStore } from '@/app/stores/tokenInfo-store';
import { DEFAULT_TOKEN_ADDRESS } from '@/utils/constants';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

type Quote = 'USD' | 'WETH';

type TradeWindowKey = '_1h' | '_12h' | '_1d';

type TradeWindow = {
  buy_vol?: string;
  sell_vol?: string;
};

type MarketApiToken = {
  buy_count?: number;
  sell_count?: number;
  buy_volume?: string;
  sell_volume?: string;
  holders_count?: number;
  liquidity?: string;
  price?: string;
  total_supply?: string;
  tx_count?: number;
  weth_usd_price?: string;
};

type MarketApiTrade = Partial<Record<TradeWindowKey, TradeWindow>>;

type MarketApiResponse = {
  token?: MarketApiToken;
  trade?: MarketApiTrade;
};

export type TokenMetrics = {
  usdPrice: number | null; // token USD (per 1 token)
  liquidityUsd: number | null;
  supplyHuman: number | null;

  // cached raw pieces we need for volume stats
  buyCount?: number | null;
  sellCount?: number | null;
  buyVolumeRaw?: string | null; // all-time, base units
  sellVolumeRaw?: string | null; // all-time, base units
  trade?: MarketApiTrade | null;
};

export type VolumeWindow = '1m' | '5m' | '15m' | '1h' | '4h' | '12h' | '24h';

type TokenMetricsState = {
  pairAddress: string;
  quote: Quote;
  metrics: TokenMetrics | null;
  isLoading: boolean;

  setPairAddress: (addr: string) => void;
  setQuote: (q: Quote) => void;

  fetchMetrics: (pairAddress?: string) => Promise<void>;
  refresh: () => Promise<void>;

  // Derived view for your VolumeStats
  getVolumes: () => {
    buys: { count: number; usd: number };
    sells: { count: number; usd: number };
  };
};

const toNum = (v: unknown): number | null => {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// big-int -> number with decimals
const bigBaseUnitsToNumber = (raw: string | null | undefined, decimals: number): number => {
  if (!raw) return 0;
  try {
    const bi = BigInt(raw);
    if (decimals === 0) return Number(bi);
    // split as integer part + fractional part to avoid precision blowups
    const base = BigInt(10) ** BigInt(decimals);
    const intPart = bi / base;
    const fracPart = bi % base;
    const fracAsNumber = Number(fracPart) / Number(base);
    return Number(intPart) + fracAsNumber;
  } catch {
    return Number(raw) / Math.pow(10, decimals);
  }
};

export const useTokenMetricsStore = create<TokenMetricsState>((set, get) => ({
  pairAddress: DEFAULT_TOKEN_ADDRESS,
  quote: 'WETH',
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
      const trade = res.data?.trade ?? null;

      const priceRaw = toNum(t.price);
      const wethUsd = toNum(t.weth_usd_price);
      const liquidityUsd = toNum(t.liquidity);

      const decimals = useTokenInfoStore.getState().tokenMetadata?.decimals ?? 0;
      const totalSupplyRaw = t.total_supply ?? null;

      // --- compute token USD price ---
      let usdPrice: number | null = null;
      if (priceRaw != null) {
        // If quote is USD, 'price' is already USD per token.
        // If quote is WETH, 'price' is tokens per WETH, so tokenUSD = (1/price)*weth_usd_price
        if (get().quote === 'USD') {
          usdPrice = priceRaw;
        } else {
          usdPrice = wethUsd != null ? wethUsd / priceRaw : null;
        }
      }

      let supplyHuman: number | null = null;
      if (totalSupplyRaw != null) {
        const asNum = Number(totalSupplyRaw);
        if (Number.isFinite(asNum)) {
          supplyHuman = asNum / Math.pow(10, decimals);
        } else {
          supplyHuman = Number(parseFloat(String(totalSupplyRaw))) / Math.pow(10, decimals);
        }
      }

      set({
        metrics: {
          usdPrice,
          liquidityUsd,
          supplyHuman,
          buyCount: t.buy_count ?? null,
          sellCount: t.sell_count ?? null,
          buyVolumeRaw: t.buy_volume ?? null,
          sellVolumeRaw: t.sell_volume ?? null,
          trade
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
  },

  // ---- Derived volumes/counts for your bar ----
  getVolumes: () => {
    const m = get().metrics;
    const decimals = useTokenInfoStore.getState().tokenMetadata?.decimals ?? 0;

    // counts: API only gives all-time counts; use them for now
    const buyCount = m?.buyCount ?? 0;
    const sellCount = m?.sellCount ?? 0;

    const buyVolTokens = bigBaseUnitsToNumber(m?.buyVolumeRaw ?? '0', decimals);

    const sellVolTokens = bigBaseUnitsToNumber(m?.sellVolumeRaw ?? '0', decimals);

    const tokenUsd = m?.usdPrice ?? 0;

    return {
      buys: { count: buyCount, usd: buyVolTokens * tokenUsd },
      sells: { count: sellCount, usd: sellVolTokens * tokenUsd }
    };
  }
}));
