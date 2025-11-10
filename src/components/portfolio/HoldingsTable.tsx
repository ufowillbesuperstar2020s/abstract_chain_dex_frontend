'use client';

import React, { useMemo } from 'react';
import { fmtUSD } from '@/utils/fmtUSD';
import Image from 'next/image';

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
          <tr className="bg-white/10 text-left text-white/75">
            <th className="rounded-tl-2xl py-4 pl-7 font-medium">
              <div className="flex items-center">
                <Image
                  width={4}
                  height={4}
                  src="/images/icons/th_token_name_brighter.svg"
                  alt=""
                  className="mr-1 h-4 w-4"
                />
                Token name
              </div>
            </th>
            <th className="px-3 py-4 font-medium">
              <div className="flex items-center">
                <Image
                  width={4}
                  height={4}
                  src="/images/icons/th_balance_brighter.svg"
                  alt=""
                  className="mr-1 h-4 w-4"
                />
                Balance
              </div>
            </th>
            <th className="px-3 py-4 font-medium">
              <div className="flex items-center">
                <Image
                  width={4}
                  height={4}
                  src="/images/icons/th_current_value_brighter.svg"
                  alt=""
                  className="mr-1 h-4 w-4"
                />
                Current Value
              </div>
            </th>
            <th className="px-3 py-4 font-medium">
              <div className="flex items-center">
                <Image
                  width={4}
                  height={4}
                  src="/images/icons/th_current_value_brighter.svg"
                  alt=""
                  className="mr-1 h-4 w-4"
                />
                Cost Basis
              </div>
            </th>
            <th className="px-3 py-4 font-medium">
              <div className="flex items-center">
                <Image
                  width={4}
                  height={4}
                  src="/images/icons/th_entry_price_brighter.svg"
                  alt=""
                  className="mr-1 h-4 w-4"
                />
                Entry Price
              </div>
            </th>
            <th className="rounded-tr-2xl px-3 py-4 font-medium">
              <div className="flex items-center">
                <Image width={4} height={4} src="/images/icons/th_PnL_brighter.svg" alt="" className="mr-1 h-4 w-4" />
                PnL
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {computed.map((r) => (
            <tr key={r.symbol} className="border-b border-white/10">
              <td className="flex items-center gap-2 py-3 pl-7">
                <img src={r.iconUrl} alt="" className="h-5 w-5 rounded-full" />
                <div className="text-white">{r.name}</div>
              </td>
              <td className="px-3 py-3 text-white">
                {r.balance} {r.symbol}
              </td>
              <td className="px-3 py-3 text-white">{fmtUSD(r.currentValue)}</td>
              <td className="px-3 py-3 text-white">{fmtUSD(r.costBasisUSD)}</td>
              <td className="px-3 py-3 text-white">{fmtUSD(r.entryPrice)}</td>
              <td className="px-3 py-3 text-white">
                <div className="flex">
                  <span className="mr-2">{`${fmtUSD(r.pnlUSD)}  /  ${r.pnlPct.toFixed(2)}%`}</span>
                  <img src={'/images/icons/pnl_ascent.svg'} alt="" className="mt-1 h-3 w-3 rounded-full" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
