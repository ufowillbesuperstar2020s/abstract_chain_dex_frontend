'use client';

import React, { Suspense, useState, useEffect, useMemo, useRef, useCallback } from 'react';
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

  const [timeRange, setTimeRange] = useState<TimeRange>(initialRange);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavorites, setShowFavorites] = useState(false);

  const [sort, setSort] = useState<Sort>({ key: initialSortKey, dir: initialSortDir });

  const [rows, setRows] = useState<TokenRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [limit, setLimit] = useState(30);
  const [total, setTotal] = useState(0);

  const [toast, setToast] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // filters actually applied to the API request
  const [filters, setFilters] = useState<PairFilters>(emptyPairFilters);

  // local editable draft used inside the drawer, only committed on "Apply"
  const [filterDraft, setFilterDraft] = useState<PairFilters>(emptyPairFilters);

  const wsRef = useRef<PairsStreamHandle | null>(null);

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

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
  const fetchPairs = useCallback(async () => {
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

  useEffect(() => {
    fetchPairs();
  }, [fetchPairs]);

  // Create a single persistent WebSocket connection for this page
  useEffect(() => {
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
  useEffect(() => {
    if (!wsRef.current) return;
    const addresses = rows.map((r) => r.pair_address);
    wsRef.current.updatePairs(addresses);
  }, [rows]);

  const pairMap = usePairsStore((s) => s.pairs);

  useEffect(() => {
    setRows(Object.values(pairMap));
  }, [pairMap]);

  // derived (filter + sort)
  const filtered = useMemo(() => {
    let r = rows;
    if (showFavorites) r = r.filter((x) => favorites.has(x.pair_address));

    type NumericSortKey = Exclude<SortKey, 'symbol'>;
    const getSortVal = (row: TokenRow, key: SortKey): number | string =>
      key === 'symbol' ? row.symbol : row[key as NumericSortKey];

    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...r].sort((a, b) => {
      const av = getSortVal(a, sort.key);
      const bv = getSortVal(b, sort.key);
      if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv) * dir;
      if (typeof av === 'number' && typeof bv === 'number') return (av < bv ? -1 : av > bv ? 1 : 0) * dir;
      return 0;
    });
  }, [rows, showFavorites, favorites, sort]);

  const toggleFav = (addr: string) =>
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(addr)) next.delete(addr);
      else next.add(addr);
      return next;
    });

  const setSortKey = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }));

  const FilterPill = ({
    active,
    onClick,
    children,
    leftIcon,
    leftIconActive,
    activeVariant = 'default'
  }: {
    active?: boolean;
    onClick?: () => void;
    children: React.ReactNode;
    leftIcon?: React.ReactNode;
    leftIconActive?: React.ReactNode;
    activeVariant?: 'default' | 'green';
  }) => {
    const base = 'inline-flex h-8 items-center gap-2 px-3 py-2 text-xs rounded-md transition-colors';
    const style = active
      ? activeVariant == 'green'
        ? 'border border-emerald-500 bg-emerald-500/15 text-emerald-400'
        : 'border border-white/20 text-white'
      : 'text-white/50 hover:bg-white/10';
    return (
      <button onClick={onClick} className={`${base} ${style}`}>
        {active ? (leftIconActive ?? leftIcon) : leftIcon}
        {children}
      </button>
    );
  };

  const TIME_OPTIONS = ['All', '1h', '4h', '12h', '24h'] as const;
  type TimeOption = (typeof TIME_OPTIONS)[number];
  const [activeTab, setActiveTab] = useState<TimeOption>('All');
  const normalize = (r: TimeOption): TimeRange => (r === 'All' ? '24h' : r);

  return (
    <div
      className="fixed inset-x-0 bottom-0 mx-auto w-full px-10"
      style={{
        top: `${APP_HEADER_H}px`,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        overflow: 'hidden' // prevents whole-page scroll
      }}
    >
      {/* decorative glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed top-1/2 right-0 -z-10 hidden h-[720px] w-[min(800px,30vw)] -translate-y-1/2 bg-gradient-to-l from-emerald-400/25 via-emerald-400/10 to-transparent blur-2xl xl:block"
      />

      {/* Page header (stays put) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl text-white/90">Trending</h1>

          {/* Range tabs */}
          <div className="ml-2 flex items-center gap-1 rounded-xl bg-white/10 p-0.5">
            {TIME_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => {
                  setActiveTab(r);
                  setTimeRange(normalize(r));
                }}
                className={cx(
                  'h-6 rounded-md px-4 text-sm',
                  r === activeTab ? 'bg-emerald-700 text-white' : 'text-white/70 hover:text-white'
                )}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="ml-4 hidden items-center gap-2 md:flex">
            <FilterPill
              active={sort.key === 'volume24hUsd'}
              onClick={handleVolumeToggle}
              activeVariant="green"
              leftIcon={<Image width={12} height={12} src="/images/icons/volume.svg" alt="Volume" />}
              leftIconActive={
                <Image width={12} height={12} src="/images/icons/volume_active.svg" alt="Volume active" />
              }
            >
              Volume
            </FilterPill>
            <FilterPill
              active={showFavorites}
              onClick={() => setShowFavorites((v) => !v)}
              activeVariant="green"
              leftIcon={
                <svg viewBox="0 0 24 24" className="h-4 w-4">
                  <path
                    fill="currentColor"
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.74 0 3.41.81 4.5 2.09C12.59 4.81 14.26 4 16 4 18.5 4 20.5 6 20.5 8.5c0 3.78-3.4 6.86-8.05 11.54L12 21.35z"
                  />
                </svg>
              }
              leftIconActive={
                <svg viewBox="0 0 24 24" className="h-4 w-4 drop-shadow-[0_0_6px_rgba(16,185,129,0.7)]">
                  <path
                    fill="currentColor"
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.74 0 3.41.81 4.5 2.09C12.59 4.81 14.26 4 16 4 18.5 4 20.5 6 20.5 8.5c0 3.78-3.4 6.86-8.05 11.54L12 21.35z"
                  />
                </svg>
              }
            >
              Favorites
            </FilterPill>
            <FilterPill
              active={sort.key === 'ageSeconds' && sort.dir === 'asc'}
              onClick={handleNewToggle}
              activeVariant="green"
              leftIcon={<Image width={12} height={12} src="/images/icons/new.svg" alt="New" />}
              leftIconActive={<Image width={12} height={12} src="/images/icons/new_active.svg" alt="New" />}
            >
              New
            </FilterPill>
          </div>
        </div>

        {/* search + filters */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleFilters}
            className="hidden h-10 items-center gap-2 rounded-md px-3 text-sm text-white/80 hover:bg-white/15 md:inline-flex"
            title="Filters"
          >
            <Image width={15} height={15} src="/images/icons/filters.svg" alt="Filters" />
            Filters
            {activeFilterCount > 0 && <span className="text-emerald-500">({activeFilterCount})</span>}
          </button>
        </div>
      </div>

      {/* Table card: header (static) + body (scroll only here) */}
      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl">
        {/* HEADER TABLE (not scrollable) */}
        <div className="overflow-hidden">
          <table className="min-w-full border-collapse text-sm">
            <colgroup>
              {COL_WIDTHS.map((w, i) => (
                <col key={`h-${i}`} style={{ width: w }} />
              ))}
            </colgroup>
            <thead className="bg-[#303030]">
              <tr className="h-11 text-white/90">
                <th className="pr-2 pl-4 text-left font-medium"> </th>
                <Th label="Token name" active={sort.key === 'symbol'} />
                <th> </th>
                <Th label="Price" onClick={() => setSortKey('priceUsd')} active={sort.key === 'priceUsd'} />
                <Th label="1h change" onClick={() => setSortKey('change1hPct')} active={sort.key === 'change1hPct'} />
                <Th
                  label="12h change"
                  onClick={() => setSortKey('change12hPct')}
                  active={sort.key === 'change12hPct'}
                />
                <Th
                  label="24h change"
                  onClick={() => setSortKey('change24hPct')}
                  active={sort.key === 'change24hPct'}
                />
                <Th
                  label="24h volume"
                  onClick={() => setSortKey('volume24hUsd')}
                  active={sort.key === 'volume24hUsd'}
                />
                <Th label="Liquidity" onClick={() => setSortKey('liquidityUsd')} active={sort.key === 'liquidityUsd'} />
                <Th label="MC" onClick={() => setSortKey('marketcapUsd')} active={sort.key === 'marketcapUsd'} />
              </tr>
            </thead>
          </table>
        </div>

        {/* BODY TABLE (the ONLY scroller -> scrollbar shows only beside rows) */}
        <div
          className="pretty-scroll overflow-x-auto overflow-y-auto"
          style={{
            height: `calc(100% - ${FOOTER_SAFE}px)`, // shorten the scrollable area
            paddingBottom: 8 // a little inner space for the last row
          }}
        >
          <table className="min-w-full border-collapse text-sm">
            <colgroup>
              {COL_WIDTHS.map((w, i) => (
                <col key={`b-${i}`} style={{ width: w }} />
              ))}
            </colgroup>

            <tbody className="divide-y divide-white/5">
              {loading && (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-white/60">
                    Loading pairs…
                  </td>
                </tr>
              )}
              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-white/60">
                    No items
                  </td>
                </tr>
              )}
              {error && !loading && (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-red-400">
                    Failed to load: {error}
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                filtered.map((t) => (
                  <tr key={t.pair_address} className="group h-[60px] hover:bg-white/5">
                    {/* fav */}
                    <td className="w-8 pr-1 pl-3">
                      <button
                        aria-label="Toggle favorite"
                        onClick={() => toggleFav(t.pair_address)}
                        className="rounded p-1 text-white/50 hover:bg-white/10 hover:text-emerald-500"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className={cx('h-5 w-5', favorites.has(t.pair_address) && 'text-emerald-600')}
                        >
                          <path
                            fill="currentColor"
                            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.74 0 3.41.81 4.5 2.09C12.59 4.81 14.26 4 16 4 18.5 4 20.5 6 20.5 8.5c0 3.78-3.4 6.86-8.05 11.54L12 21.35z"
                          />
                        </svg>
                      </button>
                    </td>

                    {/* token */}
                    <td>
                      <a href={`/token/${t.pair_address}`} className="flex items-center gap-3 pl-1">
                        <Image
                          src={t.iconUrl}
                          alt=""
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-md object-cover ring-1 ring-white/10"
                          draggable={false}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="max-w-[220px] truncate text-base font-bold text-white">{t.symbol}</span>
                            <span className="max-w-[220px] truncate text-sm text-white/60">{t.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-white/50">
                            <span className="max-w-[220px]">{shortAddress(t.pair_address)}</span>
                            <button
                              aria-label="Copy pair address"
                              title="Copy address"
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const ok = await copyToClipboard(t.pair_address);
                                if (ok) setToast(true);
                              }}
                              className="rounded p-1 hover:bg-white/10 focus:ring-2 focus:ring-white/20 focus:outline-none"
                            >
                              <Image width={15} height={15} src="/images/icons/copy.svg" alt="Copy" />
                            </button>
                          </div>
                        </div>
                      </a>
                    </td>

                    {/* age pill */}
                    <td className="w-8 pr-1 pl-3">
                      <span className="inline-flex w-15 items-center justify-center rounded-xl bg-emerald-600/20 py-0.5 text-xs text-white">
                        <Image
                          src="/images/icons/sprout.svg"
                          width={12}
                          height={12}
                          alt=""
                          className="mr-2 h-3 w-3 rounded-lg object-cover"
                        />
                        {t.ageLabel}
                      </span>
                    </td>

                    {/* price */}
                    <td className="pr-2 text-white/90 tabular-nums">{fmtUSD(t.priceUsd)}</td>

                    {/* changes */}
                    <PctCell value={t.change1hPct} active={timeRange === '1h'} />
                    <PctCell value={t.change12hPct} active={timeRange === '12h'} />
                    <PctCell value={t.change24hPct} active={timeRange === '24h'} />

                    <td className="pr-2 text-white/90 tabular-nums">{fmtUSD(t.volume24hUsd)}</td>
                    <td className="pr-2 text-white/90 tabular-nums">{fmtUSD(t.liquidityUsd)}</td>
                    <td className="pr-4 text-white/90 tabular-nums">{fmtUSD(t.marketcapUsd)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right-side filter drawer */}
      <PairFiltersDrawer
        open={filtersOpen}
        draft={filterDraft}
        onChangeDraft={setFilterDraft}
        onClose={() => setFiltersOpen(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {/* Fixed footer (external fixed component) */}
      <FixedFooter
        index={index}
        total={total}
        limit={limit}
        loading={loading}
        onChange={(next) => setIndex(next)}
        onPageSizeChange={handlePageSizeChange}
        currentCount={filtered.length}
      />

      <Toast message="Address copied to clipboard" show={toast} onClose={() => setToast(false)} />
    </div>
  );
}

function Th({
  label,
  onClick,
  active
}: {
  label: string;
  onClick?: () => void;
  active?: boolean;
  dir?: 'asc' | 'desc';
}) {
  return (
    <th className="px-2 text-left font-medium">
      <span className="inline-flex items-center gap-1.5 text-xs">
        {label === 'Token name' && <Image width={15} height={15} src="/images/icons/token.svg" alt="Token" />}
        {label}
        <button onClick={onClick} className={cx(active ? 'text-white' : 'text-white/60 hover:text-white/80')}>
          {['Price', 'Liquidity', 'MC', '1h change', '12h change', '24h change', '24h volume'].includes(label) && (
            <Image width={15} height={15} src="/images/icons/sort.svg" alt="Sort" />
          )}
        </button>
      </span>
    </th>
  );
}

function PctCell({ value, active }: { value: number; active?: boolean }) {
  return (
    <td className={cx('pr-2 tabular-nums', active ? 'text-white' : 'text-white/80')}>
      <span>{value.toLocaleString()}%</span>
    </td>
  );
}
