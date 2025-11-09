'use client';

import React, { useMemo, useState } from 'react';
import HoldingsTable, { HoldingRow } from '@/components/portfolio/HoldingsTable';
import QuickConvert from '@/components/portfolio/QuickConvert';
import { fmtUSD } from '@/utils/fmtUSD';

export default function PortfolioPage() {
  // wnag_TODO: swap this mock with real wallet + pricing + cost basis data.
  const [rows] = useState<HoldingRow[]>([
    { symbol: 'BTC', name: 'Bitcoin', balance: 2.5, priceUSD: 1740, costBasisUSD: 3800 },
    { symbol: 'ETH', name: 'Ethereum', balance: 2.5, priceUSD: 1740, costBasisUSD: 3800 },
    { symbol: 'BNB', name: 'Binance Coin', balance: 2.5, priceUSD: 1740, costBasisUSD: 3800 }
  ]);

  const totals = useMemo(() => {
    const current = rows.reduce((s, r) => s + r.balance * r.priceUSD, 0);
    const basis = rows.reduce((s, r) => s + r.costBasisUSD, 0);
    const pnl = current - basis;
    const pnlPct = basis > 0 ? (pnl / basis) * 100 : 0;
    return { current, basis, pnl, pnlPct };
  }, [rows]);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6">
      {/* decorative glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed left-1/2 -z-10 hidden h-[320px] w-[min(900px,60vw)] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-emerald-400/25 via-emerald-400/10 to-transparent blur-2xl xl:block"
      />

      <header className="mb-6">
        <h1 className="text-3xl font-semibold text-white">My Portfolio</h1>
        <p className="mt-1 text-sm text-white/60">Track your holdings, balance, and profit in real time.</p>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/70">
          <span>
            Current Value: <b className="text-white">{fmtUSD(totals.current)}</b>
          </span>
          <span>
            Cost Basis: <b className="text-white">{fmtUSD(totals.basis)}</b>
          </span>
          <span>
            PnL:{' '}
            <b className={totals.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {fmtUSD(totals.pnl)} ({totals.pnlPct.toFixed(2)}%)
            </b>
          </span>
        </div>
      </header>

      {/* Token Holdings List */}
      <section className="rounded-2xl border border-white/10 bg-[#121212] p-3 sm:p-4">
        <HoldingsTable rows={rows} />
      </section>

      {/* Quick Convert + actions */}
      <section className="mt-8 grid gap-4 md:grid-cols-[1fr_auto_auto]">
        <QuickConvert onSubmit={(data) => console.log('convert request', data)} />

        <div className="flex items-start gap-2">
          <button className="rounded-2xl border border-white/10 bg-[#0eb980] px-5 py-3 font-medium text-black hover:opacity-90">
            Send
          </button>
          <button className="rounded-2xl border border-white/10 bg-transparent px-5 py-3 font-medium text-white hover:bg-white/5">
            Transfer
          </button>
          <button
            className="rounded-2xl border border-white/10 bg-transparent px-5 py-3 font-medium text-white hover:bg-white/5"
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
          </button>
        </div>
      </section>
    </div>
  );
}
