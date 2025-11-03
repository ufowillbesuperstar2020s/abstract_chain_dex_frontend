'use client';
import { useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { WalletModal } from '@/components/auth/WalletModal';
import { useLoginWithAbstract } from '@abstract-foundation/agw-react';
import Image from 'next/image';
import { shortAddress } from '@/utils/shortAddress';

export default function User() {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const { logout } = useLoginWithAbstract();
  const { address } = useAccount();

  // Wrap trigger + dropdown so we can detect outside clicks
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Close on click outside (capture) and on Esc
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const el = wrapperRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    // Use capture so it still fires if inner elements stop propagation
    document.addEventListener('mousedown', onPointerDown, true);
    document.addEventListener('touchstart', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown, true);
      document.removeEventListener('touchstart', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Pill */}
      <div className="hidden h-9 items-center gap-2 rounded-md bg-white/10 py-5.5 pr-1 pl-1 text-white/90 md:flex">
        <Image src="/images/logo/abs-green.svg" width={5} height={5} alt="" className="h-6 w-6" draggable={false} />
        <span className="max-w-[140px] truncate text-base leading-none font-medium">
          {address ? shortAddress(address) : ''}
        </span>

        {/* Chevron (menu trigger) */}
        <button
          type="button"
          aria-label="Toggle user menu"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="grid h-5 w-5 place-items-center rounded-full bg-white/15 hover:bg-white/50"
        >
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className={`h-4 w-4 opacity-70 transition-transform ${open ? 'rotate-180' : ''}`}
          >
            <path
              fill="currentColor"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.17l3.71-2.94a.75.75 0 1 1 .94 1.17l-4.18 3.31a.75.75 0 0 1-.94 0L5.21 8.4a.75.75 0 0 1 .02-1.19z"
            />
          </svg>
        </button>
      </div>

      {/* Dropdown (toggles) */}
      <div
        role="menu"
        aria-label="User menu"
        className={`absolute right-0 z-50 mt-2 w-30 rounded-xl border border-white/10 bg-[#1A1A1A] py-2 shadow-lg ${
          open ? 'block' : 'hidden'
        }`}
      >
        {/* Settings */}
        <div
          role="menuitem"
          tabIndex={0}
          className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-white/90 outline-none hover:bg-white/10"
          onClick={() => {
            setOpen(false);
            setModalOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setOpen(false);
              setModalOpen(true);
            }
          }}
        >
          <Image src="/images/icons/settings.png" alt="" width={5} height={5} className="h-5 w-5" draggable={false} />
          <span className="text-sm">Settings</span>
        </div>

        {/* Log Out */}
        <div
          role="menuitem"
          tabIndex={0}
          className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-white/90 outline-none hover:bg-white/10"
          onClick={async () => {
            setOpen(false);
            await logout();
          }}
          onKeyDown={async (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setOpen(false);
              await logout();
            }
          }}
        >
          <Image src="/images/icons/log_out.png" alt="" width={5} height={5} className="h-5 w-5" draggable={false} />
          <span className="text-sm">Log Out</span>
        </div>
      </div>

      {/* Wallet modal lives at the root so it overlays properly */}
      <WalletModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
