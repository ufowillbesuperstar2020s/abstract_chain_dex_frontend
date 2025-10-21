'use client';

import { useMemo, useState } from 'react';
import AmountInput from './AmountInput';
import type { TradeType, TabItem } from './types';
import { TABS } from './types';
import Image from 'next/image';
import { useTokenInfoStore } from '@/app/stores/tokenInfo-store';
import TradeExeSettingModal from '@/components/trading/modal/TradeExeSettingModal';
import { useModal } from '@/hooks/useModal';
import { useTradeSettingsStore } from '@/app/stores/tradeSettings-store';

export default function TradeInterface({
  tradeType,
  onSubmit
}: {
  tradeType: TradeType;
  onSubmit: (payload: { tradeType: TradeType; tab: TabItem; amount: number; price?: number }) => void;
}) {
  const [tab, setTab] = useState<TabItem>('Market');
  const [amount, setAmount] = useState('');

  const parsedAmount = useMemo(() => Number(amount || '0'), [amount]);
  const accentBg =
    tradeType === 'BUY' ? 'bg-emerald-400 hover:bg-emerald-300' : 'bg-[rgba(255,68,0,1)] hover:bg-[rgba(255,80,0,1)]';

  const tokenMetadata = useTokenInfoStore((s) => s.tokenMetadata);
  const tokenSymbol = tokenMetadata?.symbol ?? 0;

  const { isOpen, openModal, closeModal } = useModal();

  const { slippagePct, fee, antiMev } = useTradeSettingsStore();

  return (
    <div className="text-white/80">
      <div className="mb-3 flex items-center">
        <div className="flex items-center gap-5 text-[13px]">
          {TABS.map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={[
                  'relative pb-1 transition-colors',
                  active ? 'text-white' : 'text-white/60 hover:text-white'
                ].join(' ')}
              >
                {t}
                <span
                  className={[
                    'absolute -bottom-[2px] left-0 h-[2px] w-full rounded-full',
                    active ? 'bg-white/80' : 'bg-transparent'
                  ].join(' ')}
                />
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex items-center text-base">
          <span>
            <Image width={12} height={12} src="/images/icons/wallet.png" alt="token" className="h-4 w-4 object-cover" />
          </span>
          <span className="px-2 py-1">
            <Image
              width={8}
              height={8}
              src="/images/icons/ethereum_vector.svg"
              alt="token"
              className="h-4 w-3 object-cover"
            />
          </span>
          <span>10</span>
        </div>
      </div>

      <AmountInput value={amount} onChange={setAmount} placeholder="Amount" />

      <div className="mt-3 flex items-center justify-between gap-2">
        {['0.01', '0.05', '0.1', '0.5', '1'].map((v, i) => (
          <button
            key={i}
            type="button"
            className="w-30 rounded-md border border-white/10 bg-white/5 py-0.5 text-sm text-white/100 hover:bg-white/10"
            onClick={() => setAmount(v)}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="flex">
        <div className="mt-3 flex flex-1 flex-row gap-2 text-sm text-emerald-600">
          <span className="flex flex-row items-center gap-1">
            <Image
              width={10}
              height={10}
              src="/images/icons/percentage.svg"
              alt="token"
              className="h-4 w-4 object-cover"
            />
            {slippagePct}%
          </span>
          <span className="ml-2 flex flex-row items-center gap-1">
            <Image width={10} height={10} src="/images/icons/gas.svg" alt="token" className="h-5 w-5 object-cover" />
            {fee}
          </span>
          <span className="ml-2 flex flex-row items-center gap-1">
            <Image width={10} height={10} src="/images/icons/robot.svg" alt="token" className="h-4 w-4 object-cover" />
            {antiMev ? 'On' : 'Off'}
          </span>
        </div>
        <button className="flex h-10 items-end" onClick={openModal}>
          <Image width={10} height={10} src="/images/icons/options.svg" alt="token" className="h-6 w-6 object-cover" />
        </button>
      </div>

      <button
        disabled={parsedAmount <= 0 || tokenSymbol == 0}
        onClick={() =>
          onSubmit({
            tradeType,
            tab,
            amount: parsedAmount
          })
        }
        className={[
          'mt-5 w-full rounded-2xl py-2.5 text-sm font-bold text-[rgba(0,0,0,1)] shadow',
          'transition-colors disabled:cursor-not-allowed disabled:opacity-50',
          accentBg
        ].join(' ')}
      >
        {tradeType === 'BUY'
          ? `Buy${tokenSymbol !== 0 ? ' ' + tokenSymbol : ''}`
          : `Sell${tokenSymbol !== 0 ? ' ' + tokenSymbol : ''}`}
      </button>

      <div className="mt-3 flex justify-between border-b text-sm dark:border-gray-600">
        {[
          ['Bought', '0'],
          ['Sold', '0'],
          ['Holding', '0'],
          ['PnL', '+0 (+0%)']
        ].map(([k, v]) => (
          <div key={k} className="py-2 text-left">
            <div className="text-white/45">{k}</div>
            <div className="mt-0.5 flex items-center text-base text-white/80">
              <Image
                width={10}
                height={10}
                src="/images/icons/ethereum_vector.svg"
                alt="token"
                className="h-3 w-2 object-cover"
              />
              <span className="px-1 text-sm">{v}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Token Info */}
      <div className="flex">
        <div className="mt-4 flex flex-1 flex-row gap-2 text-base">
          <span className="ml-2 flex flex-row items-center gap-1 text-white/100">Token Info</span>
        </div>
        <div className="flex h-10 items-end">
          <Image width={10} height={10} src="/images/icons/update.svg" alt="token" className="h-5 w-5 object-cover" />
        </div>
      </div>

      <div className="flex flex-col">
        <div className="mt-3 flex flex-row justify-around gap-2">
          <div className="flex flex-col">
            <div className="flex flex-row items-center gap-1 text-emerald-300">
              <div>
                <Image
                  width={10}
                  height={10}
                  src="/images/icons/gas.svg"
                  alt="token"
                  className="h-4 w-4 object-cover"
                />
              </div>
              <div>19.1%</div>
            </div>
            <div>
              <span className="text-sm text-white/40">Top 10 H.</span>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex flex-row items-center gap-1 text-[rgba(255,68,0,1)]">
              <div>
                <Image
                  width={10}
                  height={10}
                  src="/images/icons/gas_red.svg"
                  alt="token"
                  className="h-4 w-4 object-cover"
                />
              </div>
              <div>%0</div>
            </div>
            <div>
              <span className="text-sm text-white/40">Dev H.</span>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex flex-row items-center gap-1 text-emerald-300">
              <div>
                <Image
                  width={10}
                  height={10}
                  src="/images/icons/gas.svg"
                  alt="token"
                  className="h-4 w-4 object-cover"
                />
              </div>
              <div>0%</div>
            </div>
            <div>
              <span className="text-sm text-white/40">Sniper H.</span>
            </div>
          </div>
        </div>
      </div>

      {/* modal */}
      <TradeExeSettingModal isOpen={isOpen} onClose={closeModal} />
    </div>
  );
}
