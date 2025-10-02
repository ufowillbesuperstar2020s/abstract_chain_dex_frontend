'use client';

import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTradesStore } from '@/app/stores/trades-store';

interface Props {
  pairAddress: string;
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}
function formatAbsolute(tsSec: number) {
  const d = new Date(tsSec * 1000);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}
function toRelative(tsSec: number) {
  const diffMs = Date.now() - tsSec * 1000;
  if (diffMs < 0) return 'now';
  const s = Math.floor(diffMs / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}
function formatNumber(n: number, opts?: Intl.NumberFormatOptions) {
  return Number(n).toLocaleString(undefined, opts);
}

const ROW_H = 44;

export default function TransactionTable({ pairAddress }: Props) {
  const trades = useTradesStore((s) => s.tradesByPair[pairAddress]);
  const loading = useTradesStore((s) => s.loadingByPair[pairAddress]);
  const fetchAPI = useTradesStore((s) => s.fetchTrades);

  const [, forceTick] = React.useState(0);
  type TimeMode = 'age' | 'time';
  const [timeMode, setTimeMode] = React.useState<TimeMode>('age');

  // Tick every second for "Age"
  useEffect(() => {
    if (timeMode !== 'age') return;
    const id = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [timeMode]);

  // Initial fetch
  useEffect(() => {
    fetchAPI(pairAddress, { force: true });
  }, [pairAddress, fetchAPI]);

  // Persist time mode
  useEffect(() => {
    const saved = window.localStorage.getItem('txTimeMode') as TimeMode | null;
    if (saved === 'age' || saved === 'time') setTimeMode(saved);
  }, []);
  useEffect(() => {
    window.localStorage.setItem('txTimeMode', timeMode);
  }, [timeMode]);

  // Map rows
  const rows = useMemo(() => {
    if (!trades) return [];
    return trades.map((t) => {
      let humanAmount: number | null = null;
      try {
        humanAmount = Number(t.amount) / Math.pow(10, t.decimals);
      } catch {
        humanAmount = null;
      }
      const priceUsd = Number(t.price_usd);
      const humanPriceUsd = Number(priceUsd.toFixed(6));
      const totalUsd = humanAmount != null ? humanAmount * priceUsd : null;

      return {
        id: t.tx_hash as string,
        ts: t.timestamp as number,
        txType: t.tx_type as string,
        price_usd: humanPriceUsd,
        amount: humanAmount,
        totalUsd: totalUsd,
        wallet: t.wallet_address as string,
        tx: t.tx_hash as string
      };
    });
  }, [trades]);

  // ---------- Infinite scroll + live-prepend stability ----------
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const prevCountRef = useRef(0);
  const fetchingMoreRef = useRef(false);
  const [hasMore, setHasMore] = React.useState(true);

  // Keep view stable when new trades are prepended by store
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const prev = prevCountRef.current;
    const curr = rows.length;
    if (curr > prev) {
      const nearTop = el.scrollTop <= 8;
      const added = curr - prev;
      if (!nearTop) el.scrollTop += added * ROW_H;
      else el.scrollTop = 0;
    }
    prevCountRef.current = curr;
  }, [rows.length]);

  const loadMore = useCallback(async () => {
    if (fetchingMoreRef.current || !rows.length || !hasMore) return;
    fetchingMoreRef.current = true;
    try {
      const oldest = rows[rows.length - 1];
      await fetchAPI(pairAddress, { before: oldest.ts, limit: 50 } as any);
      const after = useTradesStore.getState().tradesByPair[pairAddress] ?? [];
      if (after.length === rows.length) setHasMore(false);
    } finally {
      fetchingMoreRef.current = false;
    }
  }, [rows, hasMore, fetchAPI, pairAddress]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const remain = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (remain < ROW_H * 2) void loadMore();
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [loadMore]);

  type TabKey = 'trades' | 'positions' | 'orders' | 'holders';
  const [activeTab, setActiveTab] = React.useState<TabKey>('trades');
  const counts = { holders: 4, devTokens: 6082 };
  const colClasses = ['w-28', 'w-24', '', 'w-36', 'w-28'] as const;

  return (
    // The component is a column: tabs fixed; ONLY the table scroller scrolls.
    <div className="flex h-full min-h-0 flex-col">
      {/* Tabs (fixed) */}
      <div className="flex-none border-b border-white/10">
        <div className="flex h-12 items-center gap-6 px-4">
          <nav className="flex items-center gap-6">
            {[
              { key: 'trades', label: 'Trades' },
              { key: 'positions', label: 'Positions' },
              { key: 'orders', label: 'Orders' },
              { key: 'holders', label: `Holders (${counts.holders ?? 0})` }
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as TabKey)}
                className={`relative px-0.5 text-sm tracking-wide transition ${
                  activeTab === t.key ? 'text-white' : 'text-[rgba(130,140,154,1)] hover:text-white'
                }`}
              >
                {t.label}
                {activeTab === t.key && (
                  <span className="absolute right-0 -bottom-[11px] left-0 h-0.5 rounded-full bg-emerald-500" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* SCROLLER (both X and Y) — header sticks to top of THIS container */}
      <div ref={scrollerRef} className="no-scrollbar min-h-0 flex-1 overflow-x-auto overflow-y-auto">
        <table className="min-w-full table-fixed text-sm">
          <colgroup>
            {colClasses.map((cls, i) => (
              <col key={i} className={cls} />
            ))}
          </colgroup>

          {/* Sticky header — fixed within the scroller */}
          <thead className="sticky top-0 z-20 border-b border-white/10 bg-gray-900 dark:bg-gray-900">
            <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:font-semibold [&>th]:text-[rgba(130,140,154,1)]">
              <th className="text-left whitespace-nowrap">
                <div className="inline-flex items-baseline gap-1">
                  <button
                    type="button"
                    onClick={() => setTimeMode('age')}
                    aria-pressed={timeMode === 'age'}
                    className={`cursor-pointer transition ${timeMode === 'age' ? 'text-emerald-400' : 'text-[rgba(130,140,154,1)] hover:text-white'}`}
                  >
                    Age
                  </button>
                  <span className="text-[rgba(130,140,154,1)]">/</span>
                  <button
                    type="button"
                    onClick={() => setTimeMode('time')}
                    aria-pressed={timeMode === 'time'}
                    className={`cursor-pointer leading-3 transition ${timeMode === 'time' ? 'text-emerald-400' : 'text-[rgba(130,140,154,1)] hover:text-white'}`}
                  >
                    Time
                  </button>
                </div>
              </th>
              <th className="text-center">Type</th>
              <th className="text-left">Price</th>
              <th className="text-left">Amount</th>
              <th className="text-left">Total USD</th>
              <th className="text-left">Trader</th>
              <th className="text-right"></th>
            </tr>
          </thead>

          {/* Only the tbody flows */}
          <tbody className="font-semibold [&>tr>td]:px-3 [&>tr>td]:py-2">
            {(!rows || rows.length === 0) && !loading ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-white/50">
                  No transactions
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.id}
                  className="odd:bg-rgb(34, 34, 34) border-b border-white/5 transition-colors even:bg-[rgba(119,136,159,0.04)] hover:bg-white/10"
                  style={{ height: ROW_H }}
                >
                  <td className="whitespace-nowrap text-[rgba(154,170,192,1)]">
                    {timeMode === 'age' ? toRelative(r.ts) : formatAbsolute(r.ts)}
                  </td>
                  <td
                    className={`text-center font-medium ${
                      r.txType === 'buy'
                        ? 'text-emerald-300'
                        : r.txType === 'sell'
                          ? 'text-[rgba(255,68,0,1)]'
                          : 'text-[rgba(154,170,192,1)]'
                    }`}
                  >
                    {r.txType}
                  </td>
                  <td className="text-left text-[rgba(154,170,192,1)]">${r.price_usd ?? '-'}</td>
                  <td className="text-left text-[rgba(154,170,192,1)]">
                    {r.amount == null ? '-' : formatNumber(r.amount, { maximumFractionDigits: 6 })}
                  </td>
                  <td className="text-left text-[rgba(154,170,192,1)]">
                    {r.totalUsd == null
                      ? '-'
                      : formatNumber(r.totalUsd, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })}
                  </td>
                  <td className="text-left font-mono text-[rgba(154,170,192,1)]">
                    <span className="mr-2">{r.wallet}</span>
                  </td>
                  <td>
                    <div className="flex justify-end">
                      <Link
                        href={`https://abscan.org/tx/${r.tx}`}
                        target="_blank"
                        aria-label="View on explorer"
                        className="inline-flex"
                      >
                        <Image width={16} height={16} src="/images/icons/tx_scan_link.svg" alt="" className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="py-3 text-center text-xs opacity-60">
          {loading ? 'Loading…' : hasMore ? 'Scroll to load more' : 'No more trades'}
        </div>
      </div>
    </div>
  );
}
