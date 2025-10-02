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

  return (
    <div className={['w-full', 'border-b', 'dark:border-gray-600', 'pb-5', className].join(' ')}>
      {/* Buys row */}
      <div className="mb-2">
        <div className="flex items-end text-base">
          <div className="flex flex-col text-[rgba(130,140,154,1)]">
            <span>Buys</span>
            <span>
              {buys.count} / <span className="text-white">${fmtK(buys.usd)}</span>
            </span>
          </div>
          <div className="ml-auto text-right text-white/70">
            <span className="text-white">$177k</span>
          </div>
        </div>
        <div className="mt-1 h-[6px] w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `90%` }} />
        </div>
      </div>

      {/* Sells row */}
      <div>
        <div className="flex items-end text-base">
          <div className="flex flex-col text-[rgba(130,140,154,1)]">
            <span>Sells</span>
            <span>
              {sells.count} / <span className="text-white">${fmtK(sells.usd)}</span>
            </span>
          </div>
          <div className="ml-auto text-right text-white/70">
            <span className="text-white">-$801.8</span>
          </div>
        </div>
        <div className="mt-1 h-[6px] w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-[rgba(255,68,0,1)]" style={{ width: `60%` }} />
        </div>
      </div>
    </div>
  );
}
