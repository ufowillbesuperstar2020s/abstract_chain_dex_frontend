'use client';

import React, { useState } from 'react';
import HoldingsTable, { HoldingRow } from '@/components/portfolio/HoldingsTable';
import QuickConvert from '@/components/portfolio/QuickConvert';
import Image from 'next/image';

export default function PortfolioPage() {
  // wnag_TODO: swap this mock with real wallet + pricing + cost basis data.
  const [rows] = useState<HoldingRow[]>([
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      balance: 2.5,
      priceUSD: 1740,
      costBasisUSD: 3800,
      iconUrl: '/images/icons/token_dollars.svg'
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      balance: 2.5,
      priceUSD: 1740,
      costBasisUSD: 3800,
      iconUrl: '/images/icons/token_dollars.svg'
    },
    {
      symbol: 'BNB',
      name: 'Binance Coin',
      balance: 2.5,
      priceUSD: 1740,
      costBasisUSD: 3800,
      iconUrl: '/images/icons/token_dollars.svg'
    }
  ]);

  return (
    <div className="mx-auto w-[min(92vw,1700px)] px-6 py-6 xl:px-8">
      {/* decorative glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -z-10 h-[320px] w-[900px] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-emerald-400/25 via-emerald-400/10 to-transparent blur-2xl"
      />

      <header className="mt-2 mb-6">
        <h1 className="text-3xl text-white">My Portfolio</h1>
        <p className="mt-3 text-sm text-white/90">Track your holdings, balance, and profit in real time.</p>
      </header>

      <h5 className="mt-8 text-xl text-white">Token Holdings List</h5>

      {/* Token Holdings List */}
      <section className="mt-4">
        <HoldingsTable rows={rows} />
      </section>

      {/* Quick Convert + actions */}
      <section className="mt-8">
        <QuickConvert onSubmit={(data) => console.log('convert request', data)} />
      </section>

      <div className="mt-8 flex items-start justify-end gap-5">
        <button className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0eb980] px-5 py-3 text-sm font-bold text-black hover:opacity-90">
          Send
          <Image width={4} height={4} src="/images/icons/arrow_right.svg" alt="" className="mr-1 h-4 w-4" />
        </button>
        <button className="flex items-center gap-2 rounded-lg border border-emerald-300 px-4 py-3 text-sm font-medium text-emerald-300 hover:bg-white/5">
          Transfer
          <Image width={4} height={4} src="/images/icons/arrow_back.svg" alt="" className="mr-1 h-4 w-4" />
        </button>
        <button
          className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-transparent px-4 py-3 text-sm font-medium text-emerald-300 hover:bg-white/5"
          onClick={() => {
            const header = ['Token', 'Balance', 'Price(USD)', 'Current Value', 'Cost Basis', 'PnL(USD)'];
            const lines = rows.map((r) => {
              const current = r.balance * r.priceUSD;
              const pnl = current - r.costBasisUSD;
              return [r.name, r.balance, r.priceUSD, current, r.costBasisUSD, pnl].join(',');
            });
            const csv = [header.join(','), ...lines].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'portfolio.csv';
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Export
          <Image width={4} height={4} src="/images/icons/arrow_export.svg" alt="" className="mr-1 h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
