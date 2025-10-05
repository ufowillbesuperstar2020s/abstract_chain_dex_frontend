'use client';

import { useEffect, useRef, useState } from 'react';
import Modal from '@/components/ui/modal';

// ---- types ----
export type TokenSearchItem = {
  id: string;
  name: string;
  symbol: string;
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
    { id: '1', name: 'IND1a16z', symbol: 'IND', price: 0.00136, marketCap: '$68.79K', ago: '31m' },
    { id: '2', name: 'IND1a16z', symbol: 'IND', price: 0.00136, marketCap: '$68.79K', ago: '31m' }
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
      <div className="absolute top-24 left-1/2 h-[720px] w-[968px] -translate-x-1/2 overflow-hidden rounded-3xl bg-gradient-to-br from-[rgba(0,111,80,1)] via-[rgba(34,36,38,1)] via-38% to-[rgba(34,36,38,1)] to-100% text-white shadow-lg backdrop-blur-xl">
        {/* Top input row */}
        <div className="flex w-full flex-col items-center">
          <div className="mt-6 mb-2 w-[80%] max-w-xl">
            <div className="flex h-14 items-center gap-3 rounded-xl border-2 border-white/25 px-4">
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

        <div className="absolute top-3 right-3">
          <button type="button" onClick={onClose} aria-label="Close" className="ml-2 rounded p-1 hover:bg-white/10">
            <i className="fa-solid fa-xmark text-xl" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[70vh] overflow-y-auto">
          {!q && (
            <>
              <div className="border-b border-white/10 px-5 py-3 text-sm text-white/70">History</div>
              {history.length === 0 ? (
                <div className="px-5 py-6 text-white/50">No recent searches.</div>
              ) : (
                history.map((it, idx) => (
                  <ResultRow key={it.id} item={it} active={idx === active} onClick={() => pick(it)} />
                ))
              )}
            </>
          )}
          {q && (
            <>
              <div className="border-b border-white/10 px-5 py-3 text-sm text-white/70">Results</div>
              {items.length === 0 ? (
                <div className="px-5 py-6 text-white/50">No matches.</div>
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
      className={`flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-white/5 ${active ? 'bg-white/10' : ''}`}
    >
      <img src={item.avatarUrl ?? '/placeholder-token.png'} alt="" className="h-10 w-10 rounded-md object-cover" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{item.name}</div>
        <div className="truncate text-sm text-white/60">{item.symbol} • India Large…</div>
      </div>
      <span className="rounded bg-emerald-600/20 px-2 py-0.5 text-xs text-emerald-300">{item.ago ?? '—'}</span>
      <span className="w-24 text-right text-sm">${item.price?.toFixed(6) ?? '—'}</span>
      <span className="w-24 text-right text-sm">{item.marketCap ?? '—'}</span>
    </button>
  );
}
