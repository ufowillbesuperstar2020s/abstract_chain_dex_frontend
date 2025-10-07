import React from 'react';

export type VolumeWindow = '1m' | '5m' | '15m' | '1h' | '4h' | '24h';

export type VolumeStatsProps = {
  timeframe?: VolumeWindow;
  totalUsd?: number;
  buys?: { count: number; usd: number };
  sells?: { count: number; usd: number };
  className?: string;
};

export default function VolumeStats({
  buys = { count: 807, usd: 88100 },
  sells = { count: 807, usd: 88100 },
  className = ''
}: VolumeStatsProps) {
  const fmtK = (n: number) => `${(n / 1000).toFixed(1)}k`;

  // Use USD if available, else fall back to counts
  const totalUsd = (buys?.usd ?? 0) + (sells?.usd ?? 0);
  const totalCount = (buys?.count ?? 0) + (sells?.count ?? 0);
  const total = totalUsd > 0 ? totalUsd : totalCount;

  const buysBase = totalUsd > 0 ? buys.usd : buys.count;
  const sellsBase = totalUsd > 0 ? sells.usd : sells.count;

  const buysPct = total > 0 ? (buysBase / total) * 100 : 50;
  const sellsPct = Math.max(0, 100 - buysPct); // guarantees sum = 100

  return (
    <div className={['w-full', 'border-b', 'dark:border-gray-600', 'pb-5', className].join(' ')}>
      {/* Top labels in one row */}
      <div className="mb-2 flex items-end justify-between text-base">
        <div className="flex flex-col text-[rgba(130,140,154,1)]">
          <span>Buys</span>
          <span>
            {buys.count} / <span className="text-white">${fmtK(buys.usd)}</span>
          </span>
        </div>
        <div className="flex flex-col text-right text-[rgba(130,140,154,1)]">
          <span>Sells</span>
          <span>
            {sells.count} / <span className="text-white">${fmtK(sells.usd)}</span>
          </span>
        </div>
      </div>

      {/* One shared bar (buys left, sells right). Widths always add to 100%. */}
      <div className="mt-1 h-[6px] w-full overflow-hidden rounded-full bg-white/10">
        <div className="flex h-full w-full">
          <div
            className="mr-0.5 h-full rounded-full bg-emerald-500"
            style={{ width: `${buysPct}%` }}
            title={`Buys ${buysPct.toFixed(1)}%`}
          />
          <div
            className="ml-0.5 h-full rounded-full bg-[rgba(255,68,0,1)]"
            style={{ width: `${sellsPct}%` }}
            title={`Sells ${sellsPct.toFixed(1)}%`}
          />
        </div>
      </div>
    </div>
  );
}
