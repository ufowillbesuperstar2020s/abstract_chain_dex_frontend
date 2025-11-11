'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';

type Kind = 'BUY' | 'SELL' | 'INFO' | 'ERROR';

export type TxToastPayload = {
  kind?: Kind; // defaults to 'INFO'
  title?: string; // e.g., "Buy Success!"
  hash?: string; // transaction hash to show/trim
  explorerBase?: string; // e.g., "https://abscan.org/tx/"
  ttlMs?: number; // auto close, default 6000
};

type Item = TxToastPayload & { id: string };

const EVENT_NAME = 'tx-toast';

function trimHash(hash?: string) {
  if (!hash) return '';
  if (hash.length <= 12) return hash;
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}

function clsFor(kind: Kind) {
  switch (kind) {
    case 'BUY':
      return 'border-emerald-500/50';
    case 'SELL':
      return 'border-[rgba(255,68,0,1)]';
    case 'ERROR':
      return 'border-amber-500/50';
    default:
      return 'border-slate-500/40';
  }
}

export function showTxToast(payload: TxToastPayload) {
  const event = new CustomEvent<Item>(EVENT_NAME as any, {
    detail: { id: crypto.randomUUID(), ...payload }
  });
  window.dispatchEvent(event);
}

/** Host renders the toasts in a portal (mount this once in layout) */
export function TxToastHost() {
  const [items, setItems] = useState<Item[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onAdd = (e: Event) => {
      const detail = (e as CustomEvent<Item>).detail;
      // sane defaults
      detail.kind ??= 'INFO';
      detail.title ??= detail.kind === 'BUY' ? 'Buy Success!' : detail.kind === 'SELL' ? 'Sell Success!' : 'Done';
      detail.ttlMs ??= 6000;
      setItems((prev) => [...prev, detail]);
      // auto remove
      setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== detail.id));
      }, detail.ttlMs);
    };
    window.addEventListener(EVENT_NAME, onAdd as EventListener);
    return () => window.removeEventListener(EVENT_NAME, onAdd as EventListener);
  }, []);

  const portalTarget = typeof window !== 'undefined' ? document.body : null;
  if (!mounted || !portalTarget) return null;

  return createPortal(
    <div className="pointer-events-none fixed top-3 right-3 z-[9999] flex w-full max-w-[60vw] flex-col gap-1 sm:top-5 sm:right-5 md:max-w-[350px]">
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto flex items-center gap-1 rounded-lg border ${clsFor(
            t.kind ?? 'INFO'
          )} bg-[#15171C]/95 px-3 py-2 text-sm text-white shadow-lg shadow-black/40 backdrop-blur-md`}
        >
          {/* Title */}
          <span className="text-base font-medium">{t.title}</span>

          {/* Hash */}
          {t.hash && <span className="text-white/80">{trimHash(t.hash)}</span>}

          {/* Copy */}
          {t.hash && (
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(t.hash!)}
              className="inline-flex h-6 items-center rounded pl-1 text-white/90 hover:bg-white/10"
              title="Copy hash"
            >
              <Image width={15} height={15} src="/images/icons/copy.svg" alt="Copy" />
            </button>
          )}

          {/* Explorer link */}
          {t.hash && (t.explorerBase ?? '') !== '' && (
            <a
              href={`${t.explorerBase}${t.hash}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-white/10"
              aria-label="Open in explorer"
              title="Open in explorer"
            >
              <Image
                src="/images/icons/tx_scan_link.svg"
                alt=""
                width={16}
                height={16}
                className="h-4 w-4 opacity-90"
              />
            </a>
          )}

          {/* Close */}
          <button
            type="button"
            onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
            className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded text-white/70 hover:bg-white/10"
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>
        </div>
      ))}
    </div>,
    portalTarget
  );
}

export function defaultExplorerBase(): string {
  return process.env.NEXT_PUBLIC_BLOCK_EXPLORER_TX ?? 'https://abscan.org/tx/';
}
