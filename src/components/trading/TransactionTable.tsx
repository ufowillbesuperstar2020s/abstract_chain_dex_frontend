'use client';

import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTradesStore } from '@/app/stores/trades-store';
import Spinner from '@/components/ui/Spinner';
import PositionsTable from '@/components/trading/PositionsTable';
import HoldersTable from '@/components/trading/holders/HoldersTable';
import { subscribeTradesStream } from '@/utils/trades-stream';
import type { Transaction } from '@/types/trades';
import { useAccount } from 'wagmi';
import { transformHoldersToUi, type UiHolder } from '@/utils/formatHolders';
import { useTokenInfoStore } from '@/app/stores/tokenInfo-store';
import { useTokenMetricsStore } from '@/app/stores/tokenMetrics-store';
import { fetchHoldersFromApi } from '@/app/actions/holders';

interface Props {
  pairAddress: string;
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}
function formatAbsolute(tsSec: number) {
  const d = new Date(tsSec * 1000);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(
    d.getMinutes()
  )}:${pad2(d.getSeconds())}`;
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
const PAGE_SIZE = 100;

export default function TransactionTable({ pairAddress }: Props) {
  // ---- data from store
  const trades = useTradesStore((s) => s.tradesByPair[pairAddress]);
  const loading = useTradesStore((s) => s.loadingByPair[pairAddress]); // initial/refresh loading
  const fetchAPI = useTradesStore((s) => s.fetchTrades);
  const fetchTradesPaged: undefined | ((pair: string, index: number, limit?: number) => Promise<number>) =
    useTradesStore((s) => s.fetchTradesPaged);
  const prependTrades = useTradesStore((s) => s.prependTrades);

  const { address } = useAccount();

  const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'wss://server23.looter.ai/evm-chart-ws/';

  // ---- local ticking for Age mode
  const [, forceTick] = React.useState(0);
  type TimeMode = 'age' | 'time';
  const [timeMode, setTimeMode] = React.useState<TimeMode>('age');

  useEffect(() => {
    if (timeMode !== 'age') return;
    const id = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [timeMode]);

  // ---- persist time mode
  useEffect(() => {
    const saved = window.localStorage.getItem('txTimeMode') as TimeMode | null;
    if (saved === 'age' || saved === 'time') setTimeMode(saved);
  }, []);
  useEffect(() => {
    window.localStorage.setItem('txTimeMode', timeMode);
  }, [timeMode]);

  // ---- map rows from store to display model
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
        totalUsd,
        wallet: t.wallet_address as string,
        tx: t.tx_hash as string
      };
    });
  }, [trades]);

  // ---------- Infinite scroll + live-prepend stability ----------
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const prevCountRef = useRef(0);
  const prevFirstIdRef = useRef<string | null>(null);
  const appendingRef = useRef(false);
  const fetchingMoreRef = useRef(false);
  const pageRef = useRef(0); // last loaded page index (0-based)
  const [hasMore, setHasMore] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  // Keep view stable ONLY when rows were PREPENDED (live updates), not APPENDED
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const prevLen = prevCountRef.current;
    const currLen = rows.length;
    const firstNow = rows[0]?.id ?? null;
    const firstPrev = prevFirstIdRef.current;

    if (currLen > prevLen) {
      const added = currLen - prevLen;

      // Detect prepend: first id changed -> new rows came at TOP
      const wasPrepended = firstPrev && firstNow && firstNow !== firstPrev;

      // Skip adjustments if we are appending pages (bottom adds)
      if (wasPrepended && !appendingRef.current) {
        const nearTop = el.scrollTop <= 8;
        if (!nearTop) {
          // Shift down by the height of the inserted rows to preserve viewport
          el.scrollTop += added * ROW_H;
        } else {
          el.scrollTop = 0;
        }
      }
      // If appended, do nothing so we remain at the same position (and NOT near-bottom).
    }

    prevCountRef.current = currLen;
    prevFirstIdRef.current = firstNow;
  }, [rows.length, rows, timeMode]);

  // Initial fetch (page 0)
  useEffect(() => {
    let mounted = true;
    (async () => {
      setHasMore(true);
      pageRef.current = 0;
      prevCountRef.current = 0;
      prevFirstIdRef.current = null;

      if (fetchTradesPaged) {
        const got = await fetchTradesPaged(pairAddress, 0, PAGE_SIZE);
        if (!mounted) return;
        setHasMore(got === PAGE_SIZE);
        if (scrollerRef.current) {
          scrollerRef.current.scrollTop = 0;
        }
      } else {
        await fetchAPI(pairAddress, { force: true, limit: PAGE_SIZE });
        if (!mounted) return;
        if (scrollerRef.current) {
          scrollerRef.current.scrollTop = 0;
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [pairAddress]);

  useEffect(() => {
    if (!pairAddress) return;

    const makeSubscribeMsg = (address: string) => ({
      type: 'SUBSCRIBE_TX',
      data: { pair_address: address }
    });

    const makeUnsubscribeMsg = (address: string) => ({
      type: 'SUBSCRIBE_TX',
      data: { pair_address: address }
    });

    const unsubscribe = subscribeTradesStream<unknown, unknown, Transaction>({
      wsUrl: WS_URL,
      pairAddress,
      makeSubscribeMsg,
      makeUnsubscribeMsg,
      onMessage: (msgData) => {
        const tx: Transaction = {
          pair_address: msgData.pair_address,
          tx_type: msgData.tx_type ?? 'swap',
          price_native: msgData.price_native,
          price_usd: msgData.price_usd,
          amount: msgData.amount,
          decimals: msgData.decimals,
          wallet_address: msgData.wallet_address,
          tx_hash: msgData.tx_hash,
          block_number: msgData.block_number,
          timestamp: msgData.timestamp
        };
        prependTrades(pairAddress, tx);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [pairAddress, prependTrades]);

  // Load next page at bottom
  const loadMore = useCallback(async () => {
    if (fetchingMoreRef.current || !hasMore) return;
    if (!rows.length && !loading) return;

    fetchingMoreRef.current = true;
    appendingRef.current = true; // <— tell the stabilizer effect this is an append
    setIsLoadingMore(true);
    try {
      if (fetchTradesPaged) {
        const next = pageRef.current + 1;
        const got = await fetchTradesPaged(pairAddress, next, PAGE_SIZE);
        pageRef.current = next;
        if (got < PAGE_SIZE) setHasMore(false);
      } else {
        // --- Fallback: ts-based pagin ---
        const oldest = rows[rows.length - 1];
        await fetchAPI(pairAddress, { before: oldest.ts, limit: PAGE_SIZE });
        const after = useTradesStore.getState().tradesByPair[pairAddress] ?? [];
        if (after.length === rows.length) setHasMore(false);
      }
    } finally {
      fetchingMoreRef.current = false;
      appendingRef.current = false; // <— back to normal
      setIsLoadingMore(false);
    }
  }, [fetchAPI, fetchTradesPaged, hasMore, loading, pairAddress, rows]);

  // Scroll watcher (near bottom triggers loadMore)
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

  const [holders, setHolders] = React.useState<UiHolder[]>([]);
  const [holdersLoading, setHoldersLoading] = React.useState(false);
  const [holdersError, setHoldersError] = React.useState<string | null>(null);

  const tokenMeta = useTokenInfoStore((s) => s.tokenMetadata);
  const tokenAddress = useTokenInfoStore((s) => s.tokenAddress);
  const metrics = useTokenMetricsStore((s) => s.metrics);

  useEffect(() => {
    setHolders([]);
    setHoldersError(null);
  }, [pairAddress]);

  useEffect(() => {
    if (activeTab !== 'holders') return;
    if (!tokenAddress) return;
    if (!tokenMeta || tokenMeta.decimals == null) return;
    if (!metrics || metrics.supplyHuman == null || metrics.usdPrice == null) return;

    // Already loaded? Do nothing.
    if (holders.length > 0) return;

    let cancelled = false;

    (async () => {
      try {
        setHoldersLoading(true);
        setHoldersError(null);

        const raw = await fetchHoldersFromApi(tokenAddress);
        if (cancelled) return;

        const formatted = transformHoldersToUi(
          raw,
          tokenMeta.decimals!,
          metrics.supplyHuman!,
          metrics.usdPrice!,
          tokenMeta.symbol ?? 'TOKEN'
        );
        if (!cancelled) setHolders(formatted);
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load holders:', error);
          setHoldersError('Failed to load holders');
        }
      } finally {
        if (!cancelled) setHoldersLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, tokenAddress, tokenMeta?.decimals, tokenMeta?.symbol, metrics?.supplyHuman, metrics?.usdPrice]);

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

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {/* POSITIONS TAB */}
        {activeTab === 'positions' && (
          <div id="tab-panel-positions" role="tabpanel" className="h-full overflow-auto">
            <PositionsTable walletAddress={address} />
          </div>
        )}

        {activeTab === 'trades' && (
          <div
            ref={scrollerRef}
            id="tab-panel-trades"
            role="tabpanel"
            className="no-scrollbar h-full min-h-0 overflow-x-auto overflow-y-auto"
          >
            <table className="min-w-full table-fixed text-sm">
              <colgroup>
                {colClasses.map((cls, i) => (
                  <col key={i} className={cls} />
                ))}
              </colgroup>

              <thead className="sticky top-0 z-20 border-b border-white/10 bg-gray-900 dark:bg-gray-900">
                <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:font-semibold [&>th]:text-[rgba(130,140,154,1)]">
                  <th className="text-left whitespace-nowrap">
                    <div className="inline-flex items-baseline gap-1">
                      <button
                        type="button"
                        onClick={() => setTimeMode('age')}
                        aria-pressed={timeMode === 'age'}
                        className={`cursor-pointer transition ${
                          timeMode === 'age' ? 'text-emerald-400' : 'text-[rgba(130,140,154,1)] hover:text-white'
                        }`}
                      >
                        Age
                      </button>
                      <span className="text-[rgba(130,140,154,1)]">/</span>
                      <button
                        type="button"
                        onClick={() => setTimeMode('time')}
                        aria-pressed={timeMode === 'time'}
                        className={`cursor-pointer leading-3 transition ${
                          timeMode === 'time' ? 'text-emerald-400' : 'text-[rgba(130,140,154,1)] hover:text-white'
                        }`}
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

              <tbody className="font-semibold [&>tr>td]:px-3 [&>tr>td]:py-2">
                {!rows || rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-10 text-center text-white/60">
                      {loading ? (
                        <span className="inline-flex items-center gap-2">
                          <Spinner className="h-5 w-5" />
                          Loading…
                        </span>
                      ) : (
                        'No transactions'
                      )}
                    </td>
                  </tr>
                ) : (
                  <>
                    {rows.map((r) => (
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
                            : formatNumber(r.totalUsd, {
                                style: 'currency',
                                currency: 'USD',
                                maximumFractionDigits: 2
                              })}
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
                              <Image
                                width={16}
                                height={16}
                                src="/images/icons/tx_scan_link.svg"
                                alt=""
                                className="h-4 w-4"
                              />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {isLoadingMore && (
                      <tr>
                        <td colSpan={8} className="px-3 py-4 text-center text-white/60">
                          <span className="inline-flex items-center gap-2">
                            <Spinner className="h-4 w-4" />
                            Loading…
                          </span>
                        </td>
                      </tr>
                    )}

                    {!isLoadingMore && hasMore && (
                      <tr>
                        <td colSpan={8} className="px-3 py-3 text-center text-xs opacity-60">
                          Scroll to load more
                        </td>
                      </tr>
                    )}
                    {!isLoadingMore && !hasMore && (
                      <tr>
                        <td colSpan={8} className="px-3 py-3 text-center text-xs opacity-60">
                          No more trades
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* simple placeholders for the other tabs, replace later if needed */}
        {activeTab === 'orders' && (
          <div id="tab-panel-orders" role="tabpanel" className="h-full overflow-auto p-6 text-white/60">
            I need Figma design.
          </div>
        )}
        {activeTab === 'holders' && (
          <div
            id="tab-panel-holders"
            role="tabpanel"
            className="no-scrollbar h-full min-h-0 overflow-x-auto overflow-y-auto text-white/60"
          >
            <HoldersTable
              holders={holders}
              loading={
                holdersLoading ||
                !tokenAddress ||
                !tokenMeta ||
                tokenMeta.decimals == null ||
                !metrics ||
                metrics.supplyHuman == null ||
                metrics.usdPrice == null
              }
              error={holdersError}
            />
          </div>
        )}
      </div>
    </div>
  );
}
