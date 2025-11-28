'use client';

import { create } from 'zustand';
import { useTokenInfoStore } from '@/app/stores/tokenInfo-store';
import { fetchMarketDataFromApi } from '@/app/actions/market';
import { bigBaseUnitsToNumber } from '@/utils/formatters';

type TradeWindowKey = '_1h' | '_4h' | '_12h' | '_1d';

type TradeWindow = {
  buy_count?: string | number;
  sell_count?: string | number;
  buy_vol?: string;
  sell_vol?: string;
  close_price?: string;
  high_price?: string;
  low_price?: string;
  open_price?: string;
  trades_count?: string | number;
};

type MarketApiTrade = Partial<Record<TradeWindowKey, TradeWindow>>;

export type TokenMetrics = {
  usdPrice: number | null;
  liquidityUsd: number | null;
  supplyHuman: number | null;
  buyCount?: number | null;
  sellCount?: number | null;
  buyVolumeRaw?: string | null;
  sellVolumeRaw?: string | null;
  trade?: MarketApiTrade | null;
};

export type Volumes = {
  buys: { count: number; usd: number };
  sells: { count: number; usd: number };
};

const DEFAULT_VOLUMES: Volumes = {
  buys: { count: 0, usd: 0 },
  sells: { count: 0, usd: 0 }
};

const toNum = (v: unknown): number | null => {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

function computeVolumes(metrics: TokenMetrics | null, decimals: number): Volumes {
  if (!metrics) return DEFAULT_VOLUMES;

  const buyVol = bigBaseUnitsToNumber(metrics.buyVolumeRaw ?? '0', decimals);
  const sellVol = bigBaseUnitsToNumber(metrics.sellVolumeRaw ?? '0', decimals);
  const tokenUsd = metrics.usdPrice ?? 0;

  return {
    buys: { count: metrics.buyCount ?? 0, usd: buyVol * tokenUsd },
    sells: { count: metrics.sellCount ?? 0, usd: sellVol * tokenUsd }
  };
}

/* --------------------------------------------------------
 * Multi-token type for PositionsTable
 * -------------------------------------------------------- */

export type MarketDataLite = {
  usdPrice: number;
  liquidityUsd: number;
  supplyHuman: number;
};

/* --------------------------------------------------------
 * COMBINED STORE (WORKS FOR BOTH TRADING PAGE + POSITIONS PAGE)
 * -------------------------------------------------------- */

type TokenMetricsState = {
  pairAddress: string | null;
  metrics: TokenMetrics | null;
  volumes: Volumes;
  isLoading: boolean;
  setPairAddress: (addr: string) => void;
  fetchMetrics: (pairAddress?: string) => Promise<void>;
  refresh: () => Promise<void>;

  /* PositionsTable multi-token support */
  metricsMap: Record<string, MarketDataLite | undefined>;
  getMetrics: (addr: string) => MarketDataLite | undefined;
  loadMetrics: (addr: string) => Promise<void>;
};

export const useTokenMetricsStore = create<TokenMetricsState>((set, get) => ({
  pairAddress: null,
  metrics: null,
  volumes: DEFAULT_VOLUMES,
  isLoading: false,

  setPairAddress: (addr) => set({ pairAddress: addr }),

  fetchMetrics: async (pairAddress?: string) => {
    const addr = pairAddress ?? get().pairAddress;
    if (!addr) return;

    const { tokenMetadata, isLoading: metaLoading } = useTokenInfoStore.getState();
    if (metaLoading || !tokenMetadata?.decimals) return;

    const decimals = tokenMetadata.decimals;

    set({ isLoading: true });

    try {
      const data = await fetchMarketDataFromApi(addr);
      if (!data) return set({ metrics: null, volumes: DEFAULT_VOLUMES });

      const t = data.token ?? {};
      const trade = data.trade ?? null;

      const priceRaw = toNum(t.price);
      const liquidityUsd = toNum(t.liquidity);

      let supplyHuman: number | null = null;
      if (t.total_supply) {
        supplyHuman = bigBaseUnitsToNumber(String(t.total_supply), decimals);
      }

      let buyCount = 0;
      let sellCount = 0;
      let buyVolumeRaw = '0';
      let sellVolumeRaw = '0';

      if (trade) {
        const order: TradeWindowKey[] = ['_1h', '_4h', '_12h', '_1d'];
        for (const k of order) {
          if (trade[k]) {
            const window = trade[k]!;
            buyCount = toNum(window.buy_count) ?? 0;
            sellCount = toNum(window.sell_count) ?? 0;
            buyVolumeRaw = window.buy_vol ?? '0';
            sellVolumeRaw = window.sell_vol ?? '0';
            break;
          }
        }
      }

      const metrics: TokenMetrics = {
        usdPrice: priceRaw,
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
    } catch (err) {
      console.error('[metrics] fetch error:', err);
      set({ metrics: null, volumes: DEFAULT_VOLUMES });
    } finally {
      set({ isLoading: false });
    }
  },

  refresh: async () => {
    await get().fetchMetrics();
  },

  /* ================ MULTI-TOKEN SYSTEM (PositionsTable) ================ */
  metricsMap: {},

  getMetrics: (addr) => {
    return get().metricsMap[addr.toLowerCase()];
  },

  loadMetrics: async (addr: string) => {
    const key = addr.toLowerCase();

    const meta = useTokenInfoStore.getState().getTokenMetadata(key);
    if (!meta) return;

    try {
      const data = await fetchMarketDataFromApi(addr);
      if (!data) return;

      const t = data.token ?? {};

      const metricsLite: MarketDataLite = {
        usdPrice: Number(t.price ?? 0),
        liquidityUsd: Number(t.liquidity ?? 0),
        supplyHuman: t.total_supply ? bigBaseUnitsToNumber(String(t.total_supply), meta.decimals) : 0
      };

      set((s) => ({
        metricsMap: { ...s.metricsMap, [key]: metricsLite }
      }));
    } catch (err) {
      console.error('[metricsMap] load error:', err);
    }
  }
}));
