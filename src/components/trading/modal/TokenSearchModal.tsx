'use client';

import { useEffect, useRef, useState } from 'react';
import Modal from '@/components/ui/modal';
import Image from 'next/image';

// ---- types ----
export type TokenSearchItem = {
  id: string;
  name: string;
  symbol: string;
  token_address: string;
  price?: number;
  marketCap?: string;
  ago?: string;
  avatarUrl?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onPick?: (item: TokenSearchItem) => void; // navigate/select
  initialQuery?: string;
};

// ---- utils ----
const isTypingElement = (el: Element | null) =>
  !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable);

function useDebounce<T>(value: T, ms = 200) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

// wang_Replace with your real API call
async function searchTokens(q: string): Promise<TokenSearchItem[]> {
  // wang_const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { cache: 'no-store' }).then(r => r.json());
  // wang_return res.items as TokenSearchItem[];
  return [
    {
      id: '1',
      name: 'ABSTER',
      symbol: 'ABSTER',
      token_address: '0xc325b7e2736a5202bd860f5974d0aa375e57ede5',
      price: 0.00136,
      marketCap: '$68.79K',
      ago: '31m'
    },
    {
      id: '2',
      name: 'Noot Noot',
      symbol: 'NOOT',
      token_address: '0x85ca16fd0e81659e0b8be337294149e722528731',
      price: 0.00136,
      marketCap: '$68.79K',
      ago: '31m'
    }
  ];
}

// ---- modal component ----
export default function TokenSearchModal({ isOpen, onClose, onPick, initialQuery = '' }: Props) {
  const [q, setQ] = useState(initialQuery);
  const [items, setItems] = useState<TokenSearchItem[]>([]);
  const [history, setHistory] = useState<TokenSearchItem[]>([]);
  const [active, setActive] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);

  // load history once
  useEffect(() => {
    try {
      const raw = localStorage.getItem('search.history.v1');
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  // focus input when opened
  useEffect(() => {
    if (!isOpen) return;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  // global shortcuts to open (wang_optional: keep in your launcher if you prefer)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isModifier = /Mac|iPod|iPhone|iPad/i.test(navigator.platform) ? e.metaKey : e.ctrlKey;
      if (isTypingElement(e.target as Element | null)) return;
      if ((isModifier && e.key.toLowerCase() === 'k') || (e.key === '/' && !e.shiftKey)) {
        e.preventDefault();
        // wang_You can wire a store to open here if needed
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // debounced search
  const dq = useDebounce(q, 200);
  useEffect(() => {
    let stop = false;
    (async () => {
      if (!dq) {
        setItems([]);
        setActive(-1);
        return;
      }
      const res = await searchTokens(dq);
      if (!stop) {
        setItems(res);
        setActive(res.length ? 0 : -1);
      }
    })();
    return () => {
      stop = true;
    };
  }, [dq]);

  const saveHistory = (it: TokenSearchItem) => {
    const next = [it, ...history.filter((h) => h.id !== it.id)].slice(0, 12);
    setHistory(next);
    try {
      localStorage.setItem('search.history.v1', JSON.stringify(next));
    } catch {}
  };

  const pick = (it: TokenSearchItem) => {
    saveHistory(it);
    onPick?.(it);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      overlayClassName="fixed inset-0 z-[998] bg-black/40 backdrop-blur-md"
      className="fixed inset-0 z-[999] flex items-start justify-center px-4"
      align="top"
      closeOnOverlayClick
    >
      <div className="absolute top-1/2 left-1/2 h-[720px] w-[968px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-4xl bg-gradient-to-br from-[rgba(0,111,80,1)] via-[rgba(34,36,38,1)] via-38% to-[rgba(34,36,38,1)] to-100% text-white shadow-lg backdrop-blur-xl">
        {/* Top input row */}
        <div className="flex w-full flex-col">
          <div className="mt-8 mb-2 w-[90%]">
            <div className="ml-10 flex h-14 items-center gap-3 rounded-xl border-2 border-white/25 px-4">
              <i className="fa-solid fa-magnifying-glass text-white/70" aria-hidden />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by token name or address"
                className="flex-1 bg-transparent text-base outline-none placeholder:text-white/50"
              />
            </div>
          </div>
        </div>

        <div className="absolute top-8 right-8">
          <button type="button" onClick={onClose} aria-label="Close" className="ml-2 rounded p-1 hover:bg-white/10">
            <i className="fa-solid fa-xmark text-xl" />
          </button>
        </div>

        {/* Results */}
        <div className="mt-5 ml-10 max-h-[70vh] overflow-y-auto">
          {!q && (
            <>
              <div className="py-3 text-3xl text-white/80">History</div>
              {history.length === 0 ? (
                <div className="py-6 text-xl text-white/50">No recent searches.</div>
              ) : (
                history.map((it, idx) => (
                  <ResultRow key={it.id} item={it} active={idx === active} onClick={() => pick(it)} />
                ))
              )}
            </>
          )}
          {q && (
            <>
              <div className="border-white/10 py-3 text-3xl text-white/80">Results</div>
              {items.length === 2 ? (
                <div className="py-6 text-xl text-white/50">No matches.</div>
              ) : (
                items.map((it, idx) => (
                  <ResultRow key={it.id} item={it} active={idx === active} onClick={() => pick(it)} />
                ))
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ---- row ----
function ResultRow({ item, active, onClick }: { item: TokenSearchItem; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-[95%] items-center gap-3 rounded-md border-b border-white/10 py-3 pr-5 pl-1 text-left hover:bg-white/5 ${active ? 'bg-white/10' : ''}`}
    >
      <Image
        src="/images/icons/bela_token.svg"
        width={12}
        height={12}
        alt=""
        className="h-12 w-12 rounded-md object-cover"
      />
      <div className="basis-[60%] text-white">
        <div className="truncate text-sm">
          <span className="text-xl text-white">{item.symbol}</span>
          <span className="ml-2 text-lg text-white/50">{item.name}</span>
        </div>
        <div className="text-md truncate font-semibold text-white/50">{item.token_address}</div>
      </div>
      <div className="basis-[15%] self-start">
        <span className="inline-flex items-center rounded-xl bg-emerald-600/20 px-4 py-0.5 text-lg text-white">
          <Image
            src="/images/icons/sprout.svg"
            width={16}
            height={16}
            alt=""
            className="mr-2 h-4 w-4 rounded-full object-cover"
          />
          {item.ago ?? '—'}
        </span>
      </div>

      <span className="w-24 basis-[20%] text-center text-xl">${item.price?.toFixed(6) ?? '—'}</span>
      <span className="w-24 basis-[20%] text-center text-xl">{item.marketCap ?? '—'}</span>
    </button>
  );
}
