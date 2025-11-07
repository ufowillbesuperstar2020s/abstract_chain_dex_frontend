'use client';

import React, { useState } from 'react';

type ConvertForm = { from: string; to: string; amount: number };
type Props = { onSubmit: (data: ConvertForm) => void };

const TOKENS = ['BTC', 'ETH', 'BNB']; // wang_TODO: replace with wallet tokens

export default function QuickConvert({ onSubmit }: Props) {
  const [from, setFrom] = useState('BTC');
  const [to, setTo] = useState('ETH');
  const [amount, setAmount] = useState<number>(0);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#121212] p-4">
      <h3 className="mb-3 text-base font-semibold text-white">Quick Convert</h3>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/60">From</label>
          <select
            className="rounded-xl border border-white/10 bg-transparent px-3 py-2 text-white outline-none"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          >
            {TOKENS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/60">To</label>
          <select
            className="rounded-xl border border-white/10 bg-transparent px-3 py-2 text-white outline-none"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          >
            {TOKENS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/60">Amount</label>
          <input
            type="number"
            min={0}
            className="rounded-xl border border-white/10 bg-transparent px-3 py-2 text-white outline-none"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="mt-4">
        <button
          className="rounded-2xl border border-white/10 bg-[#0eb980] px-5 py-3 font-medium text-black hover:opacity-90"
          onClick={() => onSubmit({ from, to, amount })}
        >
          Convert
        </button>
      </div>
    </div>
  );
}
