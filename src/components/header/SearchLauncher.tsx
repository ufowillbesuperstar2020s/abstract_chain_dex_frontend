'use client';

import { useEffect, useRef, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { useModal } from '@/hooks/useModal';

/**
 * SearchLauncher
 * - Inline pill in the header (click to open)
 * - Preserves your original modal look/feel
 * - Keyboard shortcuts: ⌘/ or Ctrl+/, and ⌘K or Ctrl+K
 */
export default function SearchLauncher() {
  const { isOpen, openModal, closeModal } = useModal();
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcuts to open modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isModifier = /Mac|iPod|iPhone|iPad/i.test(navigator.platform) ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl + K OR plain '/'
      if ((isModifier && e.key.toLowerCase() === 'k') || e.key === '/') {
        e.preventDefault();
        openModal();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openModal]);

  // Focus modal input when the modal opens
  useEffect(() => {
    if (isOpen) {
      // next frame to ensure element is mounted
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [isOpen]);

  return (
    <>
      {/* Inline header pill (launcher) */}
      <div
        className="group ml-5 hidden h-10 w-[500px] cursor-text items-center gap-2 rounded-md px-3 ring-1 ring-[rgba(119,136,159,0.4)] transition-colors focus-within:ring-zinc-400/80 hover:ring-zinc-500/70 sm:flex"
        //onClick={() => openModal()}
        role="search"
        aria-label="Open search"
      >
        <i className="fa-solid fa-magnifying-glass text-sm text-white/70" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Explore"
          className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
          onKeyDown={(e) => {
            if (e.key === 'Enter') openModal(); // pass-through to modal for results
            if (e.key === 'Escape') setQ('');
          }}
          autoComplete="off"
        />
      </div>

      {/* Mobile icon trigger */}
      <button
        type="button"
        onClick={() => openModal()}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900/70 ring-1 ring-zinc-700/60 hover:ring-zinc-500/70 sm:hidden"
        aria-label="Open search"
      >
        <i className="fa-solid fa-magnifying-glass text-white/80" />
      </button>

      {/* Your original modal (kept) */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        // Keep container styling minimal; inner box matches your screenshot styles:
        className="rounded-none p-0 shadow-2xl ring-1 ring-white/10"
      >
        {/* Modal content container */}
        <div className="flex h-150 w-200 flex-col bg-[#0B1220] text-white">
          {/* Top input row */}
          <div className="flex h-14 items-center gap-3 border-b border-white/10 px-5">
            <i className="fa-solid fa-magnifying-glass text-white/70" aria-hidden />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, ticker, or CA..."
              className="flex-1 bg-transparent text-base outline-none placeholder:text-white/50"
              onKeyDown={(e) => {
                if (e.key === 'Escape') closeModal();
                if (e.key === 'Enter') {
                  // TODO: run your real search here (API/state/router)
                  // For now we just keep the modal open to show results area
                }
              }}
            />
            <kbd className="rounded border border-white/15 px-2 py-1 text-[10px] text-white/70">Esc</kbd>
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close"
              className="ml-2 rounded p-1 hover:bg-white/10"
            >
              <i className="fa-solid fa-xmark text-xl" />
            </button>
          </div>

          {/* Results area */}
          <div className="flex-1 overflow-y-auto">
            <div className="border-b border-white/10 px-5 py-3 text-sm text-white/70">History</div>
            <div className="px-5 py-6 text-white/50">No recent searches.</div>
          </div>
        </div>
      </Modal>
    </>
  );
}
