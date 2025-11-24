'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { useTokenInfoStore } from '@/app/stores/tokenInfo-store';
import { useTokenMetricsStore } from '@/app/stores/tokenMetrics-store';
import { IntervalDropdownUI } from '@/components/trading/token-data-container/IntervalDropdownUI';
import type { Interval } from '@/components/trading/token-data-container/IntervalDropdownUI';

/** compact number like 10.9K, 1.2M */
function compact(n: number | null, opts: Intl.NumberFormatOptions = {}): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2, ...opts }).format(n);
}
function usd(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return '$' + compact(n);
}
function usdTiny(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return '—';
  if (n < 1) return `$${n.toFixed(6)}`;
  if (n < 10) return `$${n.toFixed(4)}`;
  if (n < 1000) return `$${n.toFixed(2)}`;
  return '$' + compact(n);
}

type Props = {
  /** Current UI interval value, e.g. '1s' | '1m' | '5m' ... */
  interval: Interval;
  /** Callback when user selects a new interval */
  onIntervalChange: (v: Interval) => void;

  pairAddress: string;
};

export default function TokenDataContainer({ interval, onIntervalChange, pairAddress }: Props) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  // existing token info (name/symbol/address/decimals)
  const tokenMetadata = useTokenInfoStore((s) => s.tokenMetadata);
  const fetchTokenMetadata = useTokenInfoStore((s) => s.fetchTokenMetadata);
  const tokenInfoLoading = useTokenInfoStore((s) => s.isLoading);
  const tokenAddress = tokenMetadata?.address;

  // new metrics store
  const { metrics, isLoading: metricsLoading, quote, setPairAddress, fetchMetrics } = useTokenMetricsStore();

  useEffect(() => {
    if (pairAddress) {
      // fetch base token metadata
      fetchTokenMetadata(pairAddress);
    }
  }, [pairAddress]);

  // keep metrics store in sync with current token/pair
  useEffect(() => {
    if (!pairAddress) return;
    setPairAddress(pairAddress);
    fetchMetrics(pairAddress);
  }, [tokenAddress, pairAddress, setPairAddress, fetchMetrics]);

  // if quote (USD/WETH) changes elsewhere (e.g., your stream), refresh
  useEffect(() => {
    fetchMetrics();
  }, [quote, fetchMetrics]);

  const update = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const left = el.scrollLeft > 0;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setHasOverflow(left || right || el.scrollWidth > el.clientWidth + 1);
  };

  useEffect(() => {
    update();
    const el = scrollerRef.current;
    if (!el) return;
    const opts: AddEventListenerOptions = { passive: true };
    const handleScroll: EventListener = () => update();
    el.addEventListener('scroll', handleScroll, opts);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', handleScroll, opts);
      ro.disconnect();
    };
  }, []);

  const scrollerPad = hasOverflow ? 'px-10 sm:px-12' : 'px-3 sm:px-4';

  const name = tokenMetadata?.token_name ?? '—';
  const symbol = tokenMetadata?.symbol ?? '—';
  const address = tokenMetadata?.address ?? '—';
  const canCopy = address !== '—';

  const handleCopy = async () => {
    if (!canCopy) return;
    try {
      await navigator.clipboard.writeText(address);
      toast.success('Address copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy address, err:' + err);
    }
  };

  // derived display strings
  const usdPrice = metrics?.usdPrice ?? null;
  const liquidityUsd = metrics?.liquidityUsd ?? null;
  const supplyHuman = metrics?.supplyHuman ?? null;

  const priceStr = usdTiny(usdPrice);
  const liqStr = usd(liquidityUsd);
  const supplyStr = compact(supplyHuman);
  const isLoading = tokenInfoLoading || metricsLoading;

  const marketCap: number | null = usdPrice !== null && supplyHuman !== null ? usdPrice * supplyHuman : null;
  const mcStr = usd(marketCap);

  return (
    <div className="relative">
      <div className="flex items-center rounded-xl bg-[rgba(119,136,159,0.16)] backdrop-blur-[111px]">
        <div
          ref={scrollerRef}
          className={`no-scrollbar overflow-x-auto overflow-y-hidden scroll-smooth whitespace-nowrap ${scrollerPad} min-w-0 flex-1`}
        >
          <div className="inline-flex items-center gap-6 py-3 text-white dark:text-white/90">
            {/* avatar + name */}
            <div className="inline-flex shrink-0 items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
                <Image
                  width={40}
                  height={40}
                  src="/images/icons/bela_token.svg"
                  alt="token"
                  className="h-12 w-12 object-cover"
                />
              </div>

              <div className="min-w-0 flex-col items-start">
                <div className="flex min-w-0 items-center gap-2">
                  <h4 className="flex-1 shrink-0 text-lg leading-tight font-bold text-gray-800 dark:text-white/90">
                    {symbol}
                  </h4>
                  <div className="ml-auto flex max-w-[220px] min-w-0 items-center gap-1">
                    <button
                      type="button"
                      className="ml-1 hidden align-middle leading-none text-gray-400 hover:text-gray-200 disabled:opacity-40"
                      onClick={handleCopy}
                      disabled={!canCopy}
                      aria-label="Copy token address"
                      title={canCopy ? 'Copy address' : 'No address'}
                    >
                      <span aria-hidden>
                        <i className="fa-regular fa-copy"></i>
                      </span>
                    </button>
                    <h3 className="truncate text-lg leading-tight text-gray-500 dark:text-gray-400">{name}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-base leading-none text-gray-500 dark:text-gray-400">
                  <span className="align-middle text-lg dark:text-white/90">{mcStr}</span>
                </div>
              </div>
            </div>

            {/* metrics */}
            <div className="inline-flex shrink-0 items-center border-l dark:border-gray-600">
              <div className="inline-flex shrink-0 items-center gap-2">
                <Metric label="Price" value={priceStr} />
                <Metric label="Liquidity" value={liqStr} />
                <Metric label="Supply" value={supplyStr} />
              </div>
            </div>
          </div>
        </div>

        {/* right side interval select */}
        <div className="px-3">
          <IntervalDropdownUI initial={interval} onChange={onIntervalChange} />
        </div>
      </div>

      <style jsx>{`
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {isLoading && (
        <div className="absolute inset-x-0 -bottom-8 text-center text-xs text-gray-400">Loading token…</div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="ml-5 inline-flex min-w-0 flex-col">
      <div className="text-sm tracking-wide text-white/60">{label}</div>
      <div className="mt-1 flex items-center gap-1 truncate text-base font-semibold [font-variant-numeric:tabular-nums]">
        <Image
          width={12}
          height={12}
          src="/images/icons/ethereum_vector.svg"
          alt="token"
          className="h-3 w-3 object-cover"
        />
        {value}
      </div>
    </div>
  );
}
