'use client';

import React, { useState } from 'react';

type ConvertForm = { from: string; to: string; amount: number };
type Props = { onSubmit: (data: ConvertForm) => void };

const TOKENS = ['BTC', 'ETH', 'BNB']; // TODO: replace with wallet tokens

export default function QuickConvert({ onSubmit }: Props) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState<number>(0);

  return (
    <div className="rounded-2xl py-4">
      <h3 className="mb-3 text-xl font-semibold text-white">Quick Convert</h3>
      <div>
        <h3 className="text-sm text-white/90">Swap or rebalance instantly without leaving your portfolio.</h3>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
        <div className="flex flex-col gap-1 text-sm">
          <select
            className="appearance-none rounded-xl border border-white/10 px-4 py-3 text-gray-400 outline-none dark:bg-[#77889F0A] dark:text-gray-400"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          >
            <option value="" disabled hidden className="text-gray-400">
              From
            </option>
            {TOKENS.map((t) => (
              <option key={t} value={t} className="text-white">
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 text-sm">
          <select
            className="appearance-none rounded-xl border border-white/10 px-4 py-3 text-gray-400 outline-none dark:bg-[#77889F0A] dark:text-gray-400"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          >
            <option value="" disabled hidden className="text-gray-400">
              To
            </option>

            {TOKENS.map((t) => (
              <option key={t} value={t} className="text-white">
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 text-sm">
          <input
            type="number"
            min={0}
            className="rounded-xl border border-white/10 bg-[#77889F0A] px-4 py-3 text-white outline-none"
            placeholder="Amount"
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </div>

        <div className="flex w-[100px] flex-col">
          <button
            className="w-full rounded-lg border border-white/10 bg-white px-3 py-2 font-medium text-black hover:opacity-90"
            onClick={() => onSubmit({ from, to, amount })}
          >
            Convert
          </button>
        </div>
      </div>
    </div>
  );
}
