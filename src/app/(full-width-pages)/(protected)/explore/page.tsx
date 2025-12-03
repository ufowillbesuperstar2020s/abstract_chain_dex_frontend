'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Toast from '@/components/ui/toast/Toast';
import { copyToClipboard } from '@/utils/copyToClipboard';
import { formatAgeShort } from '@/utils/formatAge';
import { shortAddress } from '@/utils/shortAddress';
import FixedFooter from '@/components/explore/FixedFooter';
import { fmtUSD } from '@/utils/fmtUSD';
import { getDexLogosForTokens } from '@/utils/token_logo/dexScreenerLogos';
import { getTokenAddress } from '@/utils/getTokenAddress';
import PairFiltersDrawer from '@/components/explore/PairFiltersDrawer';
import { PairFilters, emptyPairFilters, countActiveFilters } from '@/utils/pairFilters';
import { fetchPairListFromApi } from '@/app/actions/pairs';

import { usePairsStore, type PairRealtimeUpdate } from '@/app/stores/pairs-store';
import { subscribePairsStream, type PairsStreamHandle } from '@/utils/websocket_stream/pairs-stream';
// ========= layout constants =========
const APP_HEADER_H = 72; // px — height of the global fixed header
const FOOTER_H = 72; // px — height of the FixedFooter
const FOOTER_SAFE = FOOTER_H + 28;

// ---------- types from UI ----------
type TimeRange = '1h' | '4h' | '12h' | '24h';

type TokenRow = {
  pair_address: string;
  token_address: string;
  iconUrl: string;
  symbol: string;
  name: string;
  ageSeconds: number;
  ageLabel: string;
  priceUsd: number;
  change1hPct: number;
  change12hPct: number;
  change24hPct: number;
  decimals: number;
  volume24hUsd: number;
  liquidityUsd: number;
  marketcapUsd: number;
};

// ---------- API response types ----------
type ApiPair = {
  _12h_change: string;
  _1h_change: string;
  _24h_change: string;
  _24h_volume: string;
  age: number;
  liquidity: string;
  market_cap: string;
  pair_address: string;
  token0_address: string;
  token1_address: string;
  chain_id: number;
  token_logo_url: string;
  token_name: string;
  token_symbol: string;
  token_decimals: number;
  usd_price: string;
};

type ApiResp = {
  index: number;
  limit: number;
  total: number;
  pairs: ApiPair[];
};

type SortKey =
  | 'symbol'
  | 'priceUsd'
  | 'change1hPct'
  | 'change12hPct'
  | 'change24hPct'
  | 'volume24hUsd'
  | 'liquidityUsd'
  | 'marketcapUsd'
  | 'ageSeconds';

type Sort = { key: SortKey; dir: 'asc' | 'desc' };

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(' ');

// parse huge numeric strings safely for display
const toNum = (x: string | number | null | undefined): number => {
  if (typeof x === 'number') return x;
  if (!x) return 0;
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
};

const RESOLUTION_FOR: Record<TimeRange | 'All', '1h' | '4h' | '12h' | '24h'> = {
  All: '24h',
  '1h': '1h',
  '4h': '4h',
  '12h': '12h',
  '24h': '24h'
};

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="p-4 text-white/60">Loading…</div>}>
      <ExplorePageInner />
    </Suspense>
  );
}

function ExplorePageInner() {
  const sp = useSearchParams();

  // URL state
  const initialRange = (sp.get('range') as TimeRange) || '24h';
  const initialSortKey = (sp.get('sort') as SortKey) || 'liquidityUsd';
  const initialSortDir = (sp.get('dir') as Sort['dir']) || 'desc';

  const [timeRange, setTimeRange] = React.useState<TimeRange>(initialRange);
  const [favorites, setFavorites] = React.useState<Set<string>>(new Set());
  const [showFavorites, setShowFavorites] = React.useState(false);

  const [sort, setSort] = React.useState<Sort>({ key: initialSortKey, dir: initialSortDir });

  const [rows, setRows] = React.useState<TokenRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [index, setIndex] = React.useState(0);
  const [limit, setLimit] = React.useState(30);
  const [total, setTotal] = React.useState(0);

  const [toast, setToast] = React.useState(false);
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  // filters actually applied to the API request
  const [filters, setFilters] = React.useState<PairFilters>(emptyPairFilters);

  // local editable draft used inside the drawer, only committed on "Apply"
  const [filterDraft, setFilterDraft] = React.useState<PairFilters>(emptyPairFilters);

  const wsRef = React.useRef<PairsStreamHandle | null>(null);

  const activeFilterCount = React.useMemo(() => countActiveFilters(filters), [filters]);

  const DEFAULT_SORT: Sort = { key: 'liquidityUsd', dir: 'desc' };

  // Keep header/body columns perfectly aligned
  const COL_WIDTHS = ['3%', '20%', '9%', '10%', '10%', '10%', '10%', '10%', '10%', '10%'];

  const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'wss://server23.looter.ai/evm-chart-ws/';

  const handlePageSizeChange = (newLimit: number) => {
    setLimit(newLimit);
    setIndex(0);
  };

  const handleVolumeToggle = () => {
    setSort((s) => {
      if (s.key === 'volume24hUsd') return DEFAULT_SORT;
      return { key: 'volume24hUsd', dir: 'desc' };
    });
  };

  const handleNewToggle = () => {
    setSort((s) => (s.key === 'ageSeconds' && s.dir === 'asc' ? DEFAULT_SORT : { key: 'ageSeconds', dir: 'asc' }));
  };

  const handleToggleFilters = () => {
    setFiltersOpen((open) => {
      const next = !open;
      if (!open) {
        // opening -> sync draft with currently applied filters
        setFilterDraft(filters);
      }
      return next;
    });
  };

  const handleApplyFilters = () => {
    setFilters(filterDraft);
    setIndex(0); // reset pagination when filters change
    setFiltersOpen(false);
  };

  const handleResetFilters = () => {
    setFilters(emptyPairFilters);
    setFilterDraft(emptyPairFilters);
    setIndex(0);
  };

  // map API -> UI row
  const mapPair = (p: ApiPair): TokenRow => {
    const ageSeconds = Math.max(0, Math.floor(p.age ?? 0));
    const decimals = Number(p.token_decimals ?? 18);
    const denom = 10 ** decimals;
    const priceUsd = toNum(p.usd_price);
    const volume24hTokens = toNum(p._24h_volume) / denom;
    const volume24hUsd = volume24hTokens * priceUsd;

    const liquidityUsd = toNum(p.liquidity) / denom;
    const marketcapUsd = toNum(p.market_cap) / denom;

    return {
      pair_address: p.pair_address,
      token_address: getTokenAddress({
        token0_address: p.token0_address,
        token1_address: p.token1_address,
        chain_id: p.chain_id
      }),
      iconUrl: '/images/error/question_mark.png',
      symbol: p.token_symbol || '—',
      name: p.token_name || '—',
      ageSeconds,
      ageLabel: formatAgeShort(ageSeconds),
      priceUsd,
      change1hPct: toNum(p._1h_change),
      change12hPct: toNum(p._12h_change),
      change24hPct: toNum(p._24h_change),
      volume24hUsd,
      liquidityUsd,
      marketcapUsd,
      decimals
    };
  };

  // fetcher
  const fetchPairs = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const resolution = RESOLUTION_FOR[timeRange] ?? '24h';

      const data = await fetchPairListFromApi({
        chain_id: 2741,
        resolution,
        index,
        limit,
        order_by: 'liquidity desc',
        filters
      });

      if (!data) {
        throw new Error('Failed to load pair list.');
      }

      const json: ApiResp = await data;
      setTotal(json?.total ?? 0);
      const mapped = json.pairs.map(mapPair);
      const addrs = mapped.map((r) => r.token_address).filter((a) => !!a);

      let rowsWithLogos = mapped;

      if (addrs.length > 0) {
        try {
          const logoMap = await getDexLogosForTokens(addrs);
          rowsWithLogos = mapped.map((row) => {
            const logo = logoMap[row.token_address.toLowerCase()];
            return logo ? { ...row, iconUrl: logo } : row; // fallback to default icon
          });
        } catch (e) {
          console.warn('Failed to fetch Dex logos, using default icons only', e);
        }
      }

      usePairsStore.getState().setInitialPairs(rowsWithLogos);
      setRows(rowsWithLogos);
    } catch (e: unknown) {
      setError((e as Error)?.message ?? 'Failed to load');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [timeRange, index, limit, filters]);

  React.useEffect(() => {
    fetchPairs();
  }, [fetchPairs]);

  // Create a single persistent WebSocket connection for this page
  React.useEffect(() => {
    wsRef.current = subscribePairsStream({
      wsUrl: WS_URL,
      chainId: 2741,
      pairs: [],
      onMessage: (update: PairRealtimeUpdate) => {
        usePairsStore.getState().updatePair(update);
      }
    });

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [WS_URL]);

  // Update pair subscriptions whenever the visible rows change
  React.useEffect(() => {
    if (!wsRef.current) return;
    const addresses =
