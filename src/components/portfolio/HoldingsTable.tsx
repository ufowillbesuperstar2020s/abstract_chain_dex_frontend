'use client';

import React, { useMemo } from 'react';
import { fmtUSD } from '@/utils/fmtUSD';

export type HoldingRow = {
  symbol: string;
  name: string;
  balance: number; // token units
  priceUSD: number; // price per token
  costBasisUSD: number; // user's total cost basis for this asset
  iconUrl?: string;
};

type Props = { rows: HoldingRow[] };

export default function HoldingsTable({ rows }: Props) {
  const computed = useMemo(() => {
    return rows.map((r) => {
      const currentValue = r.balance * r.priceUSD;
      const pnlUSD = currentValue - r.costBasisUSD;
      const entryPrice = r.balance > 0 ? r.costBasisUSD / r.balance : 0;
      const pnlPct = r.costBasisUSD > 0 ? (pnlUSD / r.costBasisUSD) * 100 : 0;
      return { ...r, currentValue, pnlUSD, pnlPct, entryPrice };
    });
  }, [rows]);

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="text-left text-white/60">
            <th className="px-3 py-3 font-medium">Token name</th>
            <th className="px-3 py-3 font-medium">Balance</th>
            <th className="px-3 py-3 font-medium">Current Value</th>
            <th className="px-3 py-3 font-medium">Cost Basis</th>
            <th className="px-3 py-3 font-medium">Entry Price</th>
            <th className="px-3 py-3 font-medium">PnL</th>
          </tr>
        </thead>
        <tbody>
          {computed.map((r) => (
            <tr key={r.symbol} className="border-t border-white/10">
              <td className="flex items-center gap-2 px-3 py-3">
                {r.iconUrl ? (
                  <img src={r.iconUrl} alt="" className="h-5 w-5 rounded-full" />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-white/10" />
                )}
                <div>
                  <div className="text-white">{r.name}</div>
                  <div className="text-[11px] tracking-wide text-white/50 uppercase">{r.symbol}</div>
                </div>
              </td>
              <td className="px-3 py-3 text-white">
                {r.balance} {r.symbol}
              </td>
              <td className="px-3 py-3 text-white">{fmtUSD(r.currentValue)}</td>
              <td className="px-3 py-3 text-white">{fmtUSD(r.costBasisUSD)}</td>
              <td className="px-3 py-3 text-white">{fmtUSD(r.entryPrice)}</td>
              <td className="px-3 py-3">
                <span className={r.pnlUSD >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {`${fmtUSD(r.pnlUSD)}  /  ${r.pnlPct.toFixed(2)}%`}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
