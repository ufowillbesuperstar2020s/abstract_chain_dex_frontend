'use client';

import React from 'react';
import { useAccount } from 'wagmi';
import PositionsTable from '@/components/trading/PositionsTable';

export default function PortfolioPage() {
  const { address } = useAccount();
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
      <section className="mt-6">
        <PositionsTable walletAddress={address} />
      </section>
    </div>
  );
}
