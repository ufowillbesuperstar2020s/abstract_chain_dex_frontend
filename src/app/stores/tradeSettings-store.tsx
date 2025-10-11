'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TradeSettingsState = {
  slippagePct: number; // e.g. 20  => 20%
  fee: number; // e.g. 0.001
  antiMev: boolean;

  // setters
  setAll: (p: Partial<Pick<TradeSettingsState, 'slippagePct' | 'fee' | 'antiMev'>>) => void;
  setSlippagePct: (n: number) => void;
  setFee: (n: number) => void;
  setAntiMev: (b: boolean) => void;
};

export const useTradeSettingsStore = create<TradeSettingsState>()(
  persist(
    (set) => ({
      slippagePct: 20,
      fee: 0.001,
      antiMev: false,

      setAll: (p) => set((s) => ({ ...s, ...p })),
      setSlippagePct: (n) => set({ slippagePct: Number.isFinite(n) ? n : 20 }),
      setFee: (n) => set({ fee: Number.isFinite(n) ? n : 0.001 }),
      setAntiMev: (b) => set({ antiMev: !!b })
    }),
    { name: 'trade-settings' } // persisted in localStorage
  )
);
