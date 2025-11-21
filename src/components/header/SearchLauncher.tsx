'use client';

import { useState, useEffect } from 'react';
import { useModal } from '@/hooks/useModal';
import TokenSearchModal from '@/components/trading/modal/TokenSearchModal/TokenSearchModal';

export default function SearchLauncher() {
  const { isOpen, openModal, closeModal } = useModal();
  const [q, setQ] = useState('');

  // open with click or Command (Ctrl+K) (guard when typing)
  useEffect(() => {
    const isTyping = (el: Element | null) =>
      !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable);
    const onKey = (e: KeyboardEvent) => {
      const isMod = /Mac|iPod|iPhone|iPad/i.test(navigator.platform) ? e.metaKey : e.ctrlKey;
      if (isTyping(e.target as Element | null)) return;
      if ((isMod && e.key.toLowerCase() === 'k') || (e.key === '/' && !e.shiftKey)) {
        e.preventDefault();
        openModal();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openModal]);

  return (
    <>
      <div
        className="group ml-5 hidden h-10 w-[500px] cursor-text items-center gap-2 rounded-md px-3 ring-1 ring-[rgba(119,136,159,0.4)] transition-colors focus-within:ring-zinc-400/80 hover:ring-zinc-500/70 sm:flex"
        onClick={openModal}
        role="search"
        aria-label="Open search"
      >
        <i className="fa-solid fa-magnifying-glass text-sm text-white/70" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Explore"
          className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
          readOnly
        />
      </div>

      <button
        type="button"
        onClick={openModal}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900/70 ring-1 ring-zinc-700/60 hover:ring-zinc-500/70 sm:hidden"
        aria-label="Open search"
      >
        <i className="fa-solid fa-magnifying-glass text-white/80" />
      </button>

      {/* modal */}
      <TokenSearchModal isOpen={isOpen} onClose={closeModal} initialQuery="" />
    </>
  );
}
