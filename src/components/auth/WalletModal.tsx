'use client';
import React from 'react';
import { useAccount } from 'wagmi';
import { copyToClipboard } from '@/utils/wallet-ui';

export function WalletModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { address } = useAccount(); // <-- ROOT AGW address

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-150">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <div className="absolute inset-x-0 top-[25vh] mx-auto w-full max-w-xl rounded-2xl border border-white/10 bg-[#0B1220] shadow-2xl">
        <div className="flex items-start gap-3 p-5">
          <div className="flex-1 text-center">
            <h3 className="text-base font-semibold text-white">Connected to Abstract Global Wallet</h3>
          </div>
          <button aria-label="Close" className="text-white/70 hover:text-white" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="my-4 px-5 pb-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs tracking-wide text-white/50 uppercase">Abstract Wallet Address</div>
            <div className="mt-1 flex items-center gap-2">
              <code className="break-all text-white">{address}</code>
              <button
                type="button"
                className="ml-auto rounded-lg px-2 py-1 text-xs text-white hover:bg-white/15"
                onClick={() => address && copyToClipboard(address)}
              >
                <i className="fa-solid fa-copy"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
