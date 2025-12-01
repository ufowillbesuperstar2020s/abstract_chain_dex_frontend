'use client';

import { useState } from 'react';
import Buy from './buy';
import Sell from './sell';
import VolumeStats from '../VolumeStats';
type VolumeWindow = '1h' | '4h' | '12h' | '1d';
enum TAB {
  BUY = 'BUY',
  SELL = 'SELL'
}

export default function BuySellCard() {
  const [active, setActive] = useState<TAB>(TAB.BUY);
  const [selectedWindow] = useState<VolumeWindow>('1h');

  return (
    <div
      className={[
        'rounded-2xl p-4 shadow-lg xl:p-5',
        'bg-[rgba(119,136,159,0.16)] backdrop-blur-[111px]',
        'ring-1 ring-white/10',
        'shadow-[0_8px_30px_rgba(0,0,0,0.45)]',
        'mr-8'
      ].join(' ')}
    >
      {/* Header */}
      <div className="mb-3 text-lg font-bold text-white/90">Order Book</div>

      <VolumeStats timeframe={selectedWindow} className="mb-3" />

      {/* Buy / Sell segmented */}
      <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-white/5 px-1">
        <button
          onClick={() => setActive(TAB.BUY)}
          className={[
            'my-1 rounded-xl py-1 text-sm font-medium transition-colors',
            active === TAB.BUY ? 'bg-emerald-600 text-white' : 'text-white/70 hover:text-white'
          ].join(' ')}
        >
          Buy
        </button>
        <button
          onClick={() => setActive(TAB.SELL)}
          className={[
            'my-1 rounded-xl py-1 text-sm font-medium transition-colors',
            active === TAB.SELL ? 'bg-[#D73900] text-white' : 'text-white/70 hover:text-white'
          ].join(' ')}
        >
          Sell
        </button>
      </div>

      {/* Panel (no extra card wrapper inside) */}
      <div className="mt-4">{active === TAB.BUY ? <Buy /> : <Sell />}</div>
    </div>
  );
}
