'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

type TimeRange = '1h' | '4h' | '12h' | '24h';

type TokenRow = {
  address: string;
  iconUrl: string;
  symbol: string;
  name: string;
  ageMinutes: number; // e.g., "31m" badge
  isNew?: boolean;
  priceUsd: number;
  change1hPct: number;
  change12hPct: number;
  change24hPct: number;
  volume24hUsd: number;
  liquidityUsd: number;
  marketcapUsd: number;
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

// --- mock data (replace with your real fetcher) ------------------------------
const mock: TokenRow[] = Array.from({ length: 12 }).map((_, i) => ({
  address: `0xIND${i.toString(16).padStart(4, '0')}16z`,
  iconUrl: `/images/icons/bela_token.png`,
  symbol: i % 3 === 1 ? 'IND2b12y' : 'IND1a16z',
  name: i % 3 === 1 ? 'USA Medium Blend' : i % 4 === 0 ? 'India Large Cap' : 'India Large Growth',
  ageMinutes: 30 + (i % 4) * 5,
  isNew: i % 5 === 0,
  priceUsd: i % 3 === 1 ? 0.0025 : 0.00136,
  change1hPct: i % 3 === 1 ? 850 : 1018,
  change12hPct: i % 3 === 1 ? 850 : 1018,
  change24hPct: i % 3 === 1 ? 850 : 1018,
  volume24hUsd: i % 3 === 1 ? 2_100_000 : 1_690_000,
  liquidityUsd: 68_790,
  marketcapUsd: 1_360_000 + i * 1000
}));

// --- helpers -----------------------------------------------------------------
const fmtUSD = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2)}M`
    : n >= 1_000
      ? `$${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 2)}K`
      : `$${n.toFixed(2)}`;

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(' ');

export default function ExplorePage() {
  const router = useRouter();
  const sp = useSearchParams();

  // URL state (so refresh/back keeps selection)
  const initialRange = (sp.get('range') as TimeRange) || '4h';
  const initialSortKey = (sp.get('sort') as SortKey) || 'volume24hUsd';
  const initialSortDir = (sp.get('dir') as Sort['dir']) || 'desc';

  const [timeRange, setTimeRange] = React.useState<TimeRange>(initialRange);
  const [query, setQuery] = React.useState('');
  const [favorites, setFavorites] = React.useState<Set<string>>(new Set());
  const [showFavorites, setShowFavorites] = React.useState(false);
  const [onlyNew, setOnlyNew] = React.useState(false);
  const [sort, setSort] = React.useState<Sort>({
    key: initialSortKey,
    dir: initialSortDir
  });

  // Persist state to URL (shallow)
  React.useEffect(() => {
    const params = new URLSearchParams();
    params.set('range', timeRange);
    params.set('sort', sort.key);
    params.set('dir', sort.dir);
    const qs = params.toString();
    router.replace(`?${qs}`);
  }, [timeRange, sort, router]);

  // Derived rows
  const filtered = React.useMemo(() => {
    let rows = mock;

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          r.symbol.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || r.address.toLowerCase().includes(q)
      );
    }
    if (showFavorites) rows = rows.filter((r) => favorites.has(r.address));
    if (onlyNew) rows = rows.filter((r) => r.isNew);

    type NumericSortKey = Exclude<SortKey, 'symbol'>;

    const getSortValue = (row: TokenRow, key: SortKey): number | string =>
      key === 'symbol' ? row.symbol : row[key as NumericSortKey];

    const cmp = (a: TokenRow, b: TokenRow) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      const av = getSortValue(a, sort.key);
      const bv = getSortValue(b, sort.key);

      if (typeof av === 'string' && typeof bv === 'string') {
        return av.localeCompare(bv) * dir;
      }
      if (typeof av === 'number' && typeof bv === 'number') {
        // avoid float issues with boolean compare
        if (av < bv) return -1 * dir;
        if (av > bv) return 1 * dir;
        return 0;
      }
      // Fallback (shouldn't happen with current keys)
      return 0;
    };

    return [...rows].sort(cmp);
  }, [query, showFavorites, onlyNew, favorites, sort]);

  // Column change based on selected timeRange
  const changeKey: SortKey =
    timeRange === '1h'
      ? 'change1hPct'
      : timeRange === '12h'
        ? 'change12hPct'
        : timeRange === '24h'
          ? 'change24hPct'
          : 'change12hPct'; // for '4h' we'll still show 12h col in table headings but style indicates active

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
        'inline-flex h-8 items-center gap-2 rounded-md border px-3 text-sm',
        active
          ? 'border-white/20 bg-white/15 text-white'
          : 'border-white/10 bg-white/10 text-white/80 hover:bg-white/15'
      )}
    >
      {leftIcon}
      {children}
    </button>
  );

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-white/90">Trending</h1>

          {/* Range tabs */}
          <div className="ml-2 flex items-center gap-1 rounded-md bg-white/10 p-1">
            {(['1h', '4h', '12h', '24h'] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={cx(
                  'h-8 rounded-md px-3 text-sm',
                  timeRange === r ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'
                )}
              >
                {r}
              </button>
            ))}
          </div>

          {/* quick toggles */}
          <div className="ml-4 hidden items-center gap-2 md:flex">
            <FilterPill
              active={sort.key === 'volume24hUsd'}
              onClick={() => setSortKey('volume24hUsd')}
              leftIcon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                  <path fill="currentColor" d="M4 18h4V6H4v12zm6 0h4V10h-4v8zm6 0h4V3h-4v15z" />
                </svg>
              }
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
            <FilterPill active={onlyNew} onClick={() => setOnlyNew((v) => !v)}>
              New
            </FilterPill>
          </div>
        </div>

        {/* search + filters */}
        <div className="flex items-center gap-3">
          <div className="relative w-[320px]">
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
            className="hidden h-10 items-center gap-2 rounded-md border border-white/10 bg-white/10 px-3 text-sm text-white/80 hover:bg-white/15 md:inline-flex"
            title="Filters"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4">
              <path fill="currentColor" d="M10 18h4v-2h-4v2zm-7-8v2h18v-2H3zm3-6v2h12V4H6z" />
            </svg>
            Filters
            <span className="ml-1 rounded-full bg-emerald-400/20 px-2 py-0.5 text-xs text-emerald-300">5</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="h-11 text-white/60">
                <th className="pr-2 pl-4 text-left font-medium"> </th>
                <Th
                  label="Token name"
                  onClick={() => setSortKey('symbol')}
                  active={sort.key === 'symbol'}
                  dir={sort.dir}
                />
                <Th
                  label="Price"
                  onClick={() => setSortKey('priceUsd')}
                  active={sort.key === 'priceUsd'}
                  dir={sort.dir}
                />
                <Th
                  label={`${timeRange} change`}
                  onClick={() => setSortKey(changeKey)}
                  active={sort.key === changeKey}
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
              {filtered.map((t) => (
                <tr key={t.address} className="group h-[60px] hover:bg-white/5">
                  {/* fav */}
                  <td className="w-8 pr-1 pl-3">
                    <button
                      aria-label="Toggle favorite"
                      onClick={() => toggleFav(t.address)}
                      className="rounded p-1 text-white/50 hover:bg-white/10 hover:text-emerald-300"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className={cx('h-5 w-5', favorites.has(t.address) && 'text-emerald-300')}
                      >
                        <path
                          fill="currentColor"
                          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.74 0 3.41.81 4.5 2.09C12.59 4.81 14.26 4 16 4 18.5 4 20.5 6 20.5 8.5c0 3.78-3.4 6.86-8.05 11.54L12 21.35z"
                        />
                      </svg>
                    </button>
                  </td>

                  {/* token */}
                  <td className="pr-2">
                    <Link href={`/token/${t.address}`} className="flex items-center gap-3 pl-1">
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
                          <span className="max-w-[220px] truncate font-medium text-white">{t.symbol}</span>
                          {t.isNew && (
                            <span className="rounded bg-emerald-400/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
                              NEW
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/50">
                          <span className="max-w-[220px] truncate">{t.name}</span>
                          <span className="inline-flex items-center gap-1 rounded bg-white/10 px-1.5 py-0.5">
                            <svg viewBox="0 0 24 24" className="h-3 w-3">
                              <path fill="currentColor" d="M12 7v10l5-5-5-5z" />
                            </svg>
                            {t.ageMinutes}m
                          </span>
                        </div>
                      </div>
                    </Link>
                  </td>

                  {/* price */}
                  <td className="pr-2 text-white/90 tabular-nums">${t.priceUsd.toFixed(6)}</td>

                  {/* changes */}
                  <PctCell value={t.change1hPct} active={timeRange === '1h'} />
                  <PctCell value={t.change12hPct} active={timeRange === '12h' || timeRange === '4h'} />
                  <PctCell value={t.change24hPct} active={timeRange === '24h'} />

                  {/* numbers */}
                  <td className="pr-2 text-white/90 tabular-nums">{fmtUSD(t.volume24hUsd)}</td>
                  <td className="pr-2 text-white/90 tabular-nums">{fmtUSD(t.liquidityUsd)}</td>
                  <td className="pr-4 text-white/90 tabular-nums">{fmtUSD(t.marketcapUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* footer hint */}
      <p className="mt-3 text-xs text-white/40">Click a row to open the token page. Sorting persists in the URL.</p>
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
      <button
        onClick={onClick}
        className={cx(
          'inline-flex items-center gap-1.5 text-xs',
          active ? 'text-white' : 'text-white/60 hover:text-white/80'
        )}
      >
        {label}
        <svg viewBox="0 0 24 24" className={cx('h-4 w-4 transition-transform', dir === 'asc' && 'rotate-180')}>
          <path fill="currentColor" d="M7 10l5 5 5-5z" />
        </svg>
      </button>
    </th>
  );
}

function PctCell({ value, active }: { value: number; active?: boolean }) {
  const positive = value >= 0;
  return (
    <td className={cx('pr-2 tabular-nums', active ? 'text-white' : 'text-white/80')}>
      <span
        className={cx(
          'rounded px-1.5 py-0.5 text-xs',
          positive
            ? active
              ? 'bg-emerald-400/15 text-emerald-300'
              : 'text-emerald-300'
            : active
              ? 'bg-red-400/15 text-red-300'
              : 'text-red-300'
        )}
      >
        {value.toLocaleString()}%
      </span>
    </td>
  );
}
