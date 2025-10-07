'use client';
import { useState } from 'react';
import { WalletModal } from '@/components/auth/WalletModal';
import { useLoginWithAbstract } from '@abstract-foundation/agw-react';
import Image from 'next/image';

export default function User() {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const { logout } = useLoginWithAbstract();

  return (
    <div className="relative">
      {/* Pill */}
      <div className="hidden h-9 items-center gap-2 rounded-md bg-white/10 py-5.5 pr-1 pl-1 text-white/90 md:flex">
        <Image
          src="/images/logo/user_profile_sample.svg"
          width={5}
          height={5}
          alt=""
          className="h-8 w-8 rounded-full object-cover ring-1 ring-white/10"
          draggable={false}
        />
        <span className="max-w-[140px] truncate text-base leading-none font-medium">Jane Doe</span>

        {/* Chevron */}
        <button
          type="button"
          aria-label="Toggle user menu"
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
          className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-white/90 hover:bg-white/10"
          onClick={() => setModalOpen(true)}
        >
          <Image src="/images/icons/settings.png" alt="" width={5} height={5} className="h-5 w-5" draggable={false} />
          <span className="text-sm">Settings</span>
        </div>

        {/* Log Out */}
        <div
          className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-white/90 hover:bg-white/10"
          onClick={async () => {
            await logout();
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
