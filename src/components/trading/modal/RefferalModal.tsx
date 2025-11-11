'use client';

import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAccount } from 'wagmi';
import Image from 'next/image';
import Toast from '@/components/ui/toast/Toast';

type Props = {
  open: boolean;
  onClose: () => void;
};

/**
 * Referral modal with blurred backdrop.
 * - Closes on ESC and on outside click.
 */
export default function RefferalModal({ open, onClose }: Props) {
  const { address } = useAccount();
  const [toast, setToast] = React.useState(false);

  const referralCode = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const base = window.location.origin;
    const code = address ?? '0xA1B2X23R45F9C3';
    return `${base}?ref=${code}`;
  }, [address]);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const modal = (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center" aria-modal="true" role="dialog">
      {/* Backdrop (dark + blur) */}
      <button
        aria-label="Close referral modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-md"
      />

      {/* Card */}
      <div
        className="relative min-h-[380px] w-full max-w-lg rounded-2xl bg-gradient-to-br from-[rgba(0,111,80,1)] via-[rgba(34,36,38,1)] via-38% to-[rgba(34,36,38,1)] to-white/[0.03] to-100% p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close (X) */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 h-8 w-8 rounded-md text-2xl text-white hover:bg-white/15 hover:text-white"
          aria-label="Close"
        >
          ×
        </button>

        <h3 className="mb-3 text-4xl text-white">Refferrals</h3>
        <p className="mt-10 mb-6 text-xl leading-6 text-white">
          Invite your friends and earn rewards.
          <br /> Share your unique referral link and get bonuses when they trade.
        </p>

        <div className="mb-8 flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2">
          <span className="block w-full truncate text-sm text-white/80">{referralCode}</span>
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(referralCode);
                setToast(true);
              } catch {}
            }}
            className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-white hover:bg-white/15"
          >
            <Image width={15} height={15} src="/images/icons/copy.svg" alt="Copy" />
          </button>
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => {
              navigator.clipboard.writeText(referralCode);
              onClose();
            }}
            className="h-10 w-40 rounded-md bg-emerald-500 text-sm font-semibold text-black hover:bg-emerald-400"
          >
            Copy
          </button>
        </div>
      </div>
      <Toast message="Address copied to clipboard" show={toast} onClose={() => setToast(false)} />
    </div>
  );

  return createPortal(modal, document.body);
}
