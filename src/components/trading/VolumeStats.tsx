'use client';

import React from 'react';
import { useTokenMetricsStore, type VolumeWindow } from '@/app/stores/tokenMetrics-store';

export type VolumeStatsProps = {
  timeframe?: VolumeWindow;
  className?: string;
};

export default function VolumeStats({ className = '' }: VolumeStatsProps) {
  const { buys, sells } = useTokenMetricsStore((s) => s.volumes);

  const fmtK = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toFixed(0);
  };

  const buyCount = buys?.count ?? 0;
  const sellCount = sells?.count ?? 0;
  const totalCount = buyCount + sellCount;

  const buysPct = totalCount > 0 ? (buyCount / totalCount) * 100 : 50;
  const sellsPct = Math.max(0, 100 - buysPct);

  const buysUsdDisp = `$${fmtK(Math.max(0, buys.usd || 0))}`;
  const sellsUsdDisp = `$${fmtK(Math.max(0, sells.usd || 0))}`;

  return (
    <div className={['w-full', 'border-b', 'dark:border-gray-600', 'pb-5', className].join(' ')}>
      {/* Top labels */}
      <div className="mb-2 flex items-end justify-between text-base">
        <div className="flex flex-col text-[rgba(130,140,154,1)]">
          <span>Buys</span>
          <span>
            {(buys.count ?? 0).toLocaleString()} / <span className="text-white">{buysUsdDisp}</span>
          </span>
        </div>
        <div className="flex flex-col text-right text-[rgba(130,140,154,1)]">
          <span>Sells</span>
          <span>
            {(sells.count ?? 0).toLocaleString()} / <span className="text-white">{sellsUsdDisp}</span>
          </span>
        </div>
      </div>

      {/* Shared bar */}
      <div className="mt-1 h-[6px] w-full overflow-hidden rounded-full bg-white/10">
        <div className="flex h-full w-full">
          <div
            className="mr-[2px] h-full rounded-full bg-emerald-500"
            style={{ width: `${buysPct}%` }}
            title={`Buys ${buysPct.toFixed(1)}%`}
          />
          <div
            className="ml-[2px] h-full rounded-full bg-[rgba(255,68,0,1)]"
            style={{ width: `${sellsPct}%` }}
            title={`Sells ${sellsPct.toFixed(1)}%`}
          />
        </div>
      </div>
    </div>
  );
}
