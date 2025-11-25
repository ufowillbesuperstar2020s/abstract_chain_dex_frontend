'use client';

import React from 'react';
import { useTokenMetricsStore } from '@/app/stores/tokenMetrics-store';
import { useTokenInfoStore } from '@/app/stores/tokenInfo-store';

export default function VolumeStats({ className = '' }) {
  const { volumes } = useTokenMetricsStore();
  const { tokenMetadata, isLoading } = useTokenInfoStore();

  const decimalsReady = tokenMetadata && !isLoading && tokenMetadata.decimals != null;

  // Do not render until decimals + metrics are ready
  if (!decimalsReady) {
    return <div className="text-sm text-gray-500">Loading volumes...</div>;
  }

  const buys = volumes.buys;
  const sells = volumes.sells;

  const fmtK = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1_000).toFixed(1)}K` : n.toFixed(0);

  const totalCount = buys.count + sells.count;
  const buysPct = totalCount > 0 ? (buys.count / totalCount) * 100 : 50;
  const sellsPct = Math.max(0, 100 - buysPct);

  return (
    <div className={`w-full border-b pb-5 dark:border-gray-600 ${className}`}>
      <div className="mb-2 flex justify-between text-base text-[rgba(130,140,154,1)]">
        <div className="flex flex-col">
          <span>Buys</span>
          <span>
            {buys.count.toLocaleString()} / <span className="text-white">${fmtK(buys.usd)}</span>
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span>Sells</span>
          <span>
            {sells.count.toLocaleString()} / <span className="text-white">${fmtK(sells.usd)}</span>
          </span>
        </div>
      </div>

      <div className="mt-1 h-[6px] w-full overflow-hidden rounded-full bg-white/10">
        <div className="flex h-full w-full">
          <div className="mr-[2px] rounded-full bg-emerald-500" style={{ width: `${buysPct}%` }} />
          <div className="ml-[2px] rounded-full bg-[rgba(255,68,0,1)]" style={{ width: `${sellsPct}%` }} />
        </div>
      </div>
    </div>
  );
}
