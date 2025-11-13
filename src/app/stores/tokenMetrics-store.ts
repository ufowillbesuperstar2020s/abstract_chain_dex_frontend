'use client';

import { create } from 'zustand';
import axios, { AxiosResponse } from 'axios';
import { StatusCodes } from 'http-status-codes';
import { useTokenInfoStore } from '@/app/stores/tokenInfo-store';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'https://server23.looter.ai/evm-chart-api/';

type Quote = 'USD' | 'WETH';

// matches backend: we now have _1h, _4h, _12h, _1d
type TradeWindowKey = '_1h' | '_4h' | '_12h' | '_1d';

type TradeWindow = {
  buy_count?: string | number;
  sell_count?: string | number;
  buy_vol?: string;
  sell_vol?: string;
  // prices exist too, not use them here
  close_price?: string;
  high_price?: string;
  low_price?: string;
  open_price?: string;
  trades_count?: string | number;
};

type MarketApiToken = {
  created_at?: string;
  dev_holders_remaining?: string;
  holders_count?: string | number;
  liquidity?: string;
  migrate?: string;
  price?: string;
  snipers_remaining?: string;
  top_holders_remaining?: string;
  total_supply?: string;
  weth_usd_price?: string;
  buy_count?: number;
  sell_count?: number;
  buy_volume?: string;
  sell_volume?: string;
  tx_count?: number;
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
  buyCount?: number | null;
  sellCount?: number | null;
  buyVolumeRaw?: string | null; // base units
  sellVolumeRaw?: string | null; // base units
  trade?: MarketApiTrade | null;
};

export type VolumeWindow = '1m' | '5m' | '15m' | '1h' | '4h' | '12h' | '24h';

type Volumes = {
  buys: { count: number; usd: number };
  sells: { count: number; usd: number };
};

const DEFAULT_VOLUMES: Volumes = {
  buys: { count: 0, usd: 0 },
  sells: { count: 0, usd: 0 }
};

function computeVolumes(metrics: TokenMetricsState['metrics'] | null, decimals: number): Volumes {
  if (!metrics) return DEFAULT_VOLUMES;

  const buyCount = metrics.buyCount ?? 0;
  const sellCount = metrics.sellCount ?? 0;
  const buyVolTokens = bigBaseUnitsToNumber(metrics.buyVolumeRaw ?? '0', decimals);
  const sellVolTokens = bigBaseUnitsToNumber(metrics.sellVolumeRaw ?? '0', decimals);
  const tokenUsd = metrics.usdPrice ?? 0;

  return {
    buys: { count: buyCount, usd: buyVolTokens * tokenUsd },
    sells: { count: sellCount, usd: sellVolTokens * tokenUsd }
  };
}

type TokenMetricsState = {
  pairAddress: string | null;
  quote: Quote;
  metrics: {
    usdPrice: number | null;
    liquidityUsd: number | null;
    supplyHuman: number | null;
    buyCount: number | null;
    sellCount: number | null;
    buyVolumeRaw: string | null;
    sellVolumeRaw: string | null;
    trade: Partial<Record<TradeWindowKey, TradeWindow>> | null;
  } | null;
  volumes: Volumes;

  isLoading: boolean;

  setPairAddress: (addr: string) => void;
  setQuote: (q: Quote) => void;

  fetchMetrics: (pairAddress?: string) => Promise<void>;
  refresh: () => Promise<void>;
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
  pairAddress: null,
  quote: 'WETH',
  metrics: null,
  isLoading: false,
  volumes: DEFAULT_VOLUMES,

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
      const liquidityUsd = toNum(t.liquidity);

      const decimals = useTokenInfoStore.getState().tokenMetadata?.decimals ?? 0;
      const totalSupplyRaw = t.total_supply ?? null;

      let usdPrice: number | null = null;
      usdPrice = priceRaw;

      let supplyHuman: number | null = null;
      if (totalSupplyRaw != null) {
        const asNum = Number(totalSupplyRaw);
        supplyHuman =
          (Number.isFinite(asNum) ? asNum : Number(parseFloat(String(totalSupplyRaw)))) / Math.pow(10, decimals);
      }

      let buyCount: number | null = null;
      let sellCount: number | null = null;
      let buyVolumeRaw: string | null = null;
      let sellVolumeRaw: string | null = null;

      if (trade) {
        const preferredOrder: TradeWindowKey[] = ['_1h', '_4h', '_12h', '_1d'];
        let window: TradeWindow | undefined;

        for (const key of preferredOrder) {
          const candidate = trade[key];
          if (candidate) {
            window = candidate;
            break;
          }
        }

        if (window) {
          buyCount = toNum(window.buy_count) ?? 0;
          sellCount = toNum(window.sell_count) ?? 0;
          buyVolumeRaw = window.buy_vol ?? null;
          sellVolumeRaw = window.sell_vol ?? null;
        }
      }

      const metrics = {
        usdPrice,
        liquidityUsd,
        supplyHuman,
        buyCount,
        sellCount,
        buyVolumeRaw,
        sellVolumeRaw,
        trade
      };

      const volumes = computeVolumes(metrics, decimals);
      set({ metrics, volumes });
    } catch (e) {
      console.error('Error fetching token metrics:', e);
      set({ metrics: null, volumes: DEFAULT_VOLUMES });
    } finally {
      set({ isLoading: false });
    }
  },

  refresh: async () => {
    await get().fetchMetrics();
  }
}));
