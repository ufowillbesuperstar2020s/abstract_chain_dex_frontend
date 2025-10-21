'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { pickBasePerPair, DEFAULT_QUOTE_SYMBOLS } from '@/utils/pickBasePerPair';
import Toast from '@/components/ui/Toast';
import { copyToClipboard } from '@/utils/copyToClipboard';
import { formatAgeShort } from '@/utils/formatAge';
import { shortAddress } from '@/utils/shortAddress';
import FixedFooter from '@/components/explore/FixedFooter';

// ---------- types from UI ----------
type TimeRange = '1h' | '4h' | '12h' | '24h';

type TokenRow = {
  pair_address: string; // pair_address (used for navigation)
  iconUrl: string; // token_logo_url
  symbol: string; // token_symbol
  name: string; // token_name
  ageSeconds: number;
  ageLabel: string;
  priceUsd: number; // usd_price
  change1hPct: number; // _1h_change
  change12hPct: number; // _12h_change
  change24hPct: number; // _24h_change
  decimals: number;
  volume24hUsd: number; // _24h_volume
  liquidityUsd: number; // liquidity
  marketcapUsd: number; // market_cap
};

// ---------- API response types ----------
type ApiPair = {
  _12h_change: string;
  _1h_change: string;
  _24h_change: string;
  _24h_volume: string;
  age: number; // seconds
  liquidity: string;
  market_cap: string;
  pair_address: string;
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
  | 'marketcapUsd';

type Sort = { key: SortKey; dir: 'asc' | 'desc' };
const fmtUSD = (n: number): string => {
  if (!Number.isFinite(n)) return '$0.00';
  const abs = Math.abs(n);

  // Handle very small prices (e.g. token prices)
  if (abs < 1) return `$${n.toFixed(4)}`; // small prices like $0.0001, $0.2345

  // Handle normal/large numbers
  if (abs >= 1_000_000_000_000) return `$${(n / 1_000_000_000_000).toFixed(2)}T`; // Trillion
  if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`; // Billion
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`; // Million
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(2)}K`; // Thousand

  return `$${n.toFixed(2)}`;
};

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(' ');

// parse huge numeric strings safely for display (falls back to 0 on NaN)
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
  const router = useRouter();
  const sp = useSearchParams();

  // URL state
  const initialRange = (sp.get('range') as TimeRange) || '4h';
  const initialSortKey = (sp.get('sort') as SortKey) || 'liquidityUsd';
  const initialSortDir = (sp.get('dir') as Sort['dir']) || 'desc';

  const [timeRange, setTimeRange] = React.useState<TimeRange>(initialRange);
  const [query, setQuery] = React.useState('');
  const [favorites, setFavorites] = React.useState<Set<string>>(new Set());
  const [showFavorites, setShowFavorites] = React.useState(false);
  const [onlyNew, setOnlyNew] = React.useState(false);

  const [sort, setSort] = React.useState<Sort>({ key: initialSortKey, dir: initialSortDir });

  const [rows, setRows] = React.useState<TokenRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [index, setIndex] = React.useState(0); // page index for the API
  const [limit] = React.useState(1000);
  const [total, setTotal] = React.useState(0);

  const [toast, setToast] = React.useState(false);

  // map API -> UI row
  const mapPair = (p: ApiPair): TokenRow => {
    const ageSeconds = Math.max(0, Math.floor(p.age ?? 0));
    const decimals = Number(p.token_decimals ?? 18);
    const denom = 10 ** decimals;
    const priceUsd = toNum(p.usd_price);
    const volume24hTokens = toNum(p._24h_volume) / denom;
    const volume24hUsd = volume24hTokens * priceUsd;

    //const liquidityUsd = (toNum(p.liquidity) / denom) * priceUsd;
    const liquidityUsd = toNum(p.liquidity) / denom;

    // const marketcapUsd = (toNum(p.market_cap) / denom) * priceUsd;
    const marketcapUsd = toNum(p.market_cap) / denom;

    return {
      pair_address: p.pair_address,
      iconUrl: p.token_logo_url || '/images/icons/bela_token.svg',
      symbol: p.token_symbol || '—',
      name: p.token_name || '—',
      ageSeconds,
      ageLabel: formatAgeShort(ageSeconds),
      priceUsd: toNum(p.usd_price),
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

      const resolution = RESOLUTION_FOR[timeRange === '4h' ? '4h' : timeRange] ?? '12h';

      // If you hit CORS, switch this to `/api/pairs?...` and add the proxy below.
      const url = `http://160.202.131.23:8081/api/info/pair/list?chain_id=2741&resolution=${resolution}&index=${index}&limit=${limit}&order_by=liquidity desc`;

      const res = await fetch(url, { cache: 'no-store' });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ApiResp = await res.json();

      const baseOnly = pickBasePerPair(json?.pairs ?? [], { quoteSymbols: DEFAULT_QUOTE_SYMBOLS });
      setTotal(json?.total ?? 0);
      const mapped = baseOnly.map(mapPair);
      setRows(mapped);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [timeRange, index, limit]);

  // refetch when range / page changes
  React.useEffect(() => {
    fetchPairs();
  }, [fetchPairs]);

  // derived (filter + sort) from fetched rows
  const filtered = React.useMemo(() => {
    let r = rows;

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      r = r.filter(
        (x) =>
          x.symbol.toLowerCase().includes(q) ||
          x.name.toLowerCase().includes(q) ||
          x.pair_address.toLowerCase().includes(q)
      );
    }

    if (showFavorites) r = r.filter((x) => favorites.has(x.pair_address));

    if (onlyNew) r = r.filter((x) => x.ageSeconds <= 3600);

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
  }, [rows, query, showFavorites, onlyNew, favorites, sort]);

  const changeKey: SortKey =
    timeRange === '1h'
      ? 'change1hPct'
      : timeRange === '12h'
        ? 'change12hPct'
        : timeRange === '24h'
          ? 'change24hPct'
          : 'change12hPct';

  const toggleFav = (addr: string) =>
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(addr) ? next.delete(addr) : next.add(addr);
      return next;
    });

  const setSortKey = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }));

  const FilterPill = ({
    active,
    onClick,
    children,
    leftIcon
  }: {
    active?: boolean;
    onClick?: () => void;
    children: React.ReactNode;
    leftIcon?: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={cx(
        'inline-flex h-8 items-center gap-2 px-3 py-2 text-xs',
        active
          ? 'rounded-md border border-white/20 text-white'
          : 'rounded-md border-white/10 text-white/50 hover:bg-white/10'
      )}
    >
      {leftIcon}
      {children}
    </button>
  );

  return (
    <div className="mx-auto w-full px-10 py-3">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl text-white/90">Trending</h1>

          {/* Range tabs */}
          <div className="ml-2 flex items-center gap-1 rounded-xl bg-white/10 p-0.5">
            {(['All', '1h', '4h', '12h', '24h'] as any[]).map((r: 'All' | TimeRange) => (
              <button
                key={r}
                onClick={() => setTimeRange((r === 'All' ? '12h' : r) as TimeRange)}
                className={cx(
                  'h-6 rounded-md px-4 text-sm',
                  (r === 'All' ? '12h' : r) === timeRange
                    ? 'bg-emerald-700 text-white'
                    : 'text-white/70 hover:text-white'
                )}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="ml-4 hidden items-center gap-2 md:flex">
            <FilterPill
              active={sort.key === 'volume24hUsd'}
              onClick={() => setSortKey('volume24hUsd')}
              leftIcon={<Image width={12} height={12} src="/images/icons/volume.svg" alt="User" />}
            >
              Volume
            </FilterPill>
            <FilterPill
              active={showFavorites}
              onClick={() => setShowFavorites((v) => !v)}
              leftIcon={
                <svg viewBox="0 0 24 24" className="h-4 w-4">
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
              active={onlyNew}
              onClick={() => setOnlyNew((v) => !v)}
              leftIcon={<Image width={12} height={12} src="/images/icons/new.svg" alt="User" />}
            >
              New
            </FilterPill>
          </div>
        </div>

        {/* search + filters */}
        <div className="flex items-center gap-3">
          <div className="relative w-[280px]">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="h-10 w-full rounded-md border border-white/10 bg-white/5 pr-3 pl-9 text-sm text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-white/20"
            />
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-white/50"
            >
              <path
                fill="currentColor"
                d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zM4 9.5C4 6.46 6.46 4 9.5 4S15 6.46 15 9.5 12.54 15 9.5 15 4 12.54 4 9.5z"
              />
            </svg>
          </div>
          <button
            className="hidden h-10 items-center gap-2 rounded-md px-3 text-sm text-white/80 hover:bg-white/15 md:inline-flex"
            title="Filters"
          >
            <Image width={15} height={15} src="/images/icons/filters.svg" alt="User" />
            Filters
            <span className="text-emerald-500">(5)</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <colgroup>
              <col style={{ width: '3%' }} /> {/* Fav icon column */}
              <col style={{ width: '21%' }} /> {/* Token name */}
              <col style={{ width: '9%' }} /> {/* age */}
              <col style={{ width: '10%' }} /> {/* Price */}
              <col style={{ width: '7%' }} /> {/* 1h change */}
              <col style={{ width: '7%' }} /> {/* 12h change */}
              <col style={{ width: '7%' }} /> {/* 24h change */}
              <col style={{ width: '10%' }} /> {/* 24h volume */}
              <col style={{ width: '13%' }} /> {/* Liquidity */}
              <col style={{ width: '13%' }} /> {/* MC */}
            </colgroup>
            <thead>
              <tr className="h-11 border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] text-white/60">
                <th className="pr-2 pl-4 text-left font-medium"> </th>
                <Th label="Token name" active={sort.key === 'symbol'} dir={sort.dir} />
                <th> </th>
                <Th
                  label="Price"
                  onClick={() => setSortKey('priceUsd')}
                  active={sort.key === 'priceUsd'}
                  dir={sort.dir}
                />
                <Th
                  label="1h change"
                  onClick={() => setSortKey('change1hPct')}
                  active={sort.key === 'change1hPct'}
                  dir={sort.dir}
                />
                <Th
                  label="12h change"
                  onClick={() => setSortKey('change12hPct')}
                  active={sort.key === 'change12hPct'}
                  dir={sort.dir}
                />
                <Th
                  label="24h change"
                  onClick={() => setSortKey('change24hPct')}
                  active={sort.key === 'change24hPct'}
                  dir={sort.dir}
                />
                <Th
                  label="24h volume"
                  onClick={() => setSortKey('volume24hUsd')}
                  active={sort.key === 'volume24hUsd'}
                  dir={sort.dir}
                />
                <Th
                  label="Liquidity"
                  onClick={() => setSortKey('liquidityUsd')}
                  active={sort.key === 'liquidityUsd'}
                  dir={sort.dir}
                />
                <Th
                  label="MC"
                  onClick={() => setSortKey('marketcapUsd')}
                  active={sort.key === 'marketcapUsd'}
                  dir={sort.dir}
                />
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {loading && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-white/60">
                    Loading pairs…
                  </td>
                </tr>
              )}
              {error && !loading && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-red-400">
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
                      <Link href={`/token/${t.pair_address}`} className="flex items-center gap-3 pl-1">
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
                                if (ok) {
                                  setToast(true);
                                }
                              }}
                              className="rounded p-1 hover:bg-white/10 focus:ring-2 focus:ring-white/20 focus:outline-none"
                            >
                              <Image width={15} height={15} src="/images/icons/copy.svg" alt="Copy" />
                            </button>
                          </div>
                        </div>
                      </Link>
                    </td>

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

      {/* Fixed footer */}
      <FixedFooter index={index} total={total} limit={limit} loading={loading} onChange={(next) => setIndex(next)} />

      <Toast message="Address copied to clipboard" show={toast} onClose={() => setToast(false)} />
    </div>
  );
}

function Th({
  label,
  onClick,
  active,
  dir
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
          {['Price', 'Liquidity', 'MC'].includes(label) && (
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
