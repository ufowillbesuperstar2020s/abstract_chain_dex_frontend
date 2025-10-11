'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/modal';
import { useTradeSettingsStore } from '@/app/stores/tradeSettings-store';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function TradeExeSettingModal({ isOpen, onClose }: Props) {
  const { slippagePct, fee, antiMev, setAll } = useTradeSettingsStore();

  const [slippage, setSlippage] = useState<string>(String(slippagePct ?? 20));
  const [feeStr, setFeeStr] = useState<string>(String(fee ?? 0.001));
  const [anti, setAnti] = useState<boolean>(!!antiMev);

  // validation
  const slippageNum = Number(slippage);
  const feeNum = Number(feeStr);
  const slippageErr = slippage.trim() === '' || Number.isNaN(slippageNum) || slippageNum < 0;
  const feeErr = feeStr.trim() === '' || Number.isNaN(feeNum) || feeNum < 0;
  const formInvalid = slippageErr || feeErr;

  const handleSave = () => {
    if (formInvalid) return;
    setAll({
      slippagePct: slippageNum,
      fee: feeNum,
      antiMev: anti
    });
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    setSlippage(String(slippagePct ?? 20));
    setFeeStr(String(fee ?? 0.001));
    setAnti(!!antiMev);
  }, [isOpen, slippagePct, fee, antiMev]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      overlayClassName="fixed inset-0 z-[998] bg-black/40 backdrop-blur-md"
      className="fixed inset-0 z-[999] flex items-start justify-center px-4"
      align="top"
      closeOnOverlayClick
    >
      <div className="absolute top-1/2 left-1/2 h-[540px] w-[620px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-4xl bg-gradient-to-br from-[rgba(0,111,80,1)] via-[rgba(34,36,38,1)] via-38% to-[rgba(34,36,38,1)] to-100% text-white shadow-lg backdrop-blur-xl">
        <div className="mt-10 mr-30 flex flex-col">
          <div className="ml-55 text-2xl font-bold">
            <span>Trade Settings</span>
          </div>

          {/* Slippage */}
          <div className="mx-20 mt-10 mb-2 w-[90%]">
            <div className="mt-5 flex h-auto flex-col gap-2 px-4">
              <span className="text-xl">Slippage (%)</span>
              <input
                value={slippage}
                onChange={(e) => setSlippage(e.target.value)}
                placeholder="20"
                className={`w-full rounded-lg border bg-transparent px-3 py-2 transition outline-none ${slippageErr ? 'border-red-500 focus:border-red-400' : 'border-white/20 focus:border-white/40'}`}
                aria-invalid={slippageErr}
                aria-describedby="slippage-help"
              />
              {slippageErr && (
                <p id="slippage-help" className="mt-1 text-sm text-red-400">
                  Required. Enter a non-negative number.
                </p>
              )}
            </div>
          </div>

          {/* Fee */}
          <div className="mx-20 mb-2 w-[90%]">
            <div className="mt-5 flex h-auto flex-col gap-2 px-4">
              <span className="text-xl">Fee</span>
              <input
                value={feeStr}
                onChange={(e) => setFeeStr(e.target.value)}
                placeholder="0.001"
                className={`w-full rounded-lg border bg-transparent px-3 py-2 transition outline-none ${feeErr ? 'border-red-500 focus:border-red-400' : 'border-white/20 focus:border-white/40'}`}
                aria-invalid={feeErr}
                aria-describedby="fee-help"
              />
              {feeErr && (
                <p id="fee-help" className="mt-1 text-sm text-red-400">
                  Required. Enter a non-negative number.
                </p>
              )}
            </div>
          </div>

          {/* Anti-MEV */}
          <div className="mx-20 mt-10 flex w-[90%]">
            <span className="mr-5 px-4 font-bold">Anti-MEV</span>
            <button
              type="button"
              role="switch"
              aria-checked={anti}
              onClick={() => setAnti((v) => !v)}
              className={`relative h-7 w-12 rounded-full transition ${anti ? 'bg-emerald-500' : 'bg-white/20'}`}
            >
              <span
                className={`absolute top-0 left-0 h-7 w-7 rounded-full bg-white shadow transition ${anti ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>
        </div>

        {/* Close button */}
        <div className="absolute top-8 right-8">
          <button type="button" onClick={onClose} aria-label="Close" className="ml-2 rounded p-1 hover:bg-white/10">
            <i className="fa-solid fa-xmark text-xl" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="mt-15 ml-50 flex flex-row">
          <button
            type="button"
            onClick={handleSave}
            disabled={formInvalid}
            className={`rounded-lg px-6 py-2 font-semibold transition ${
              formInvalid
                ? 'cursor-not-allowed bg-emerald-600/40 text-white/70'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            Save
          </button>
          <button type="button" onClick={onClose} className="ml-2 w-30 rounded px-5 py-2 hover:bg-white/10">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
