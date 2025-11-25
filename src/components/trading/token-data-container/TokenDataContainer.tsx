'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useTokenInfoStore } from '@/app/stores/tokenInfo-store';
import { useTokenMetricsStore } from '@/app/stores/tokenMetrics-store';
import { IntervalDropdownUI, type Interval } from './IntervalDropdownUI';

function compact(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 2
  }).format(n);
}
function usd(n: number | null): string {
  return n == null ? '—' : '$' + compact(n);
}
function usdTiny(n: number | null): string {
  if (n == null) return '—';
  if (n < 1) return `$${n.toFixed(6)}`;
  if (n < 10) return `$${n.toFixed(4)}`;
  if (n < 1000) return `$${n.toFixed(2)}`;
  return '$' + compact(n);
}

export default function TokenDataContainer({
  interval,
  onIntervalChange,
  pairAddress
}: {
  interval: Interval;
  onIntervalChange: (v: Interval) => void;
  pairAddress: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  const tokenMeta = useTokenInfoStore((s) => s.tokenMetadata);
  const tokenLoading = useTokenInfoStore((s) => s.isLoading);
  const decimalsReady = tokenMeta && !tokenLoading && tokenMeta.decimals != null;

  const { metrics, fetchMetrics, setPairAddress } = useTokenMetricsStore();
  const metricsLoading = useTokenMetricsStore((s) => s.isLoading);

  // Load metrics after decimals are available
  useEffect(() => {
    if (!pairAddress) return;
    if (!decimalsReady) return;
    setPairAddress(pairAddress);
    fetchMetrics(pairAddress);
  }, [pairAddress, decimalsReady]);

  const updateOverflow = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setHasOverflow(
      el.scrollWidth > el.clientWidth + 1 || el.scrollLeft > 0 || el.scrollLeft + el.clientWidth < el.scrollWidth - 1
    );
  };

  useEffect(() => {
    updateOverflow();
    const el = scrollerRef.current;
    if (!el) return;

    const onScroll = () => updateOverflow();
    const ro = new ResizeObserver(updateOverflow);
    el.addEventListener('scroll', onScroll, { passive: true });
    ro.observe(el);

    return () => {
      el.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, []);

  const loading = !decimalsReady || metricsLoading || !metrics;

  const symbol = tokenMeta?.symbol ?? '—';
  const marketCap =
    !loading && metrics?.usdPrice && metrics?.supplyHuman ? metrics.usdPrice * metrics.supplyHuman : null;

  const priceDisp = loading ? '—' : usdTiny(metrics?.usdPrice ?? null);
  const liquidityDisp = loading ? '—' : usd(metrics?.liquidityUsd ?? null);
  const supplyDisp = loading ? '—' : compact(metrics?.supplyHuman ?? null);
  const marketCapDisp = loading ? '—' : usd(marketCap);

  return (
    <div className="relative">
      <div className="flex items-center rounded-xl bg-[rgba(119,136,159,0.16)] backdrop-blur-[111px]">
        <div
          ref={scrollerRef}
          className={`no-scrollbar flex-1 overflow-x-auto whitespace-nowrap ${
            hasOverflow ? 'px-10 sm:px-12' : 'px-3 sm:px-4'
          }`}
        >
          <div className="inline-flex items-center gap-6 py-3 text-white/90">
            {/* Token avatar + name */}
            <div className="inline-flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-lg">
                <Image src="/images/icons/bela_token.svg" width={24} height={24} alt="token" className="h-12 w-12" />
              </div>

              <div className="flex flex-col">
                {/* symbol + token_name */}
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold">{symbol}</h4>
                  <h3 className="max-w-[220px] truncate text-lg leading-tight text-gray-500 dark:text-gray-400">
                    {tokenMeta?.token_name ?? '—'}
                  </h3>
                </div>

                {/* Marketcap */}
                <div className="text-base text-gray-300">{marketCapDisp}</div>
              </div>
            </div>

            {/* Metrics */}
            <div className="inline-flex items-center gap-5 border-l border-gray-600 pl-4">
              <Metric label="Price" value={priceDisp} />
              <Metric label="Liquidity" value={liquidityDisp} />
              <Metric label="Supply" value={supplyDisp} />
            </div>
          </div>
        </div>

        <div className="px-3">
          <IntervalDropdownUI initial={interval} onChange={onIntervalChange} />
        </div>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <div className="text-sm text-white/60">{label}</div>
      <div className="flex items-center gap-1 text-base font-semibold">
        <Image src="/images/icons/ethereum_vector.svg" width={12} height={12} alt="eth" />
        {value}
      </div>
    </div>
  );
}
