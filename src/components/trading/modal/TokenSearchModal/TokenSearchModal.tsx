'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/modal';
import Image from 'next/image';
import Spinner from '@/components/ui/Spinner';
import { getTokenAddress } from '@/utils/getTokenAddress';
import { searchPairs } from '@/app/actions/searchPairs';

/* ---- Types ---- */
type PairDTO = {
  token_symbol?: string;
  token_name?: string;
  pair_address?: string;
  token0_address?: string;
  token1_address?: string;
  usd_price?: string | number;
  market_cap?: string | number;
  age?: number | string;
  token_logo_url?: string;
};

export type TokenSearchItem = {
  id: string;
  name: string;
  symbol: string;
  pair_address: string;
  token_address: string;
  price?: number;
  marketCap?: string;
  ago?: string;
  avatarUrl?: string;
};

interface TokenSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPick: (item: TokenSearchItem) => void;
  initialQuery?: string;
}

/* ---- Utils ---- */
function useDebounce<T>(value: T, ms = 200) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

function toNumberSafe(s?: string | number | null): number | undefined {
  if (s === null || s === undefined) return undefined;
  const n = typeof s === 'number' ? s : Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function formatMarketCap(n?: number): string | undefined {
  if (n === undefined) return undefined;
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

function formatAgoFromSeconds(ageSec?: number): string | undefined {
  if (ageSec === undefined) return undefined;
  const m = Math.floor(ageSec / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 365) return `${d}d`;
  const y = Math.floor(d / 365);
  return `${y}y`;
}

/* Convert API result → UI item */
function toItem(p: PairDTO): TokenSearchItem {
  const price = toNumberSafe(p.usd_price);
  const mc = toNumberSafe(p.market_cap);

  return {
    id: p.pair_address || p.token_symbol || '',
    name: p.token_name ?? '',
    symbol: p.token_symbol ?? '',
    pair_address: p.pair_address ?? '',
    token_address: getTokenAddress({
      token0_address: p.token0_address,
      token1_address: p.token1_address
    }),
    price,
    marketCap: formatMarketCap(mc),
    ago: formatAgoFromSeconds(toNumberSafe(p.age)),
    avatarUrl: p.token_logo_url || ''
  };
}

/* ---- Modal ---- */
export default function TokenSearchModal({ isOpen, onClose, onPick, initialQuery = '' }: TokenSearchModalProps) {
  const router = useRouter();

  const [q, setQ] = useState(initialQuery);
  const [items, setItems] = useState<TokenSearchItem[]>([]);
  const [history, setHistory] = useState<TokenSearchItem[]>([]);
  const [active, setActive] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const seqRef = useRef(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const dq = useDebounce(q.trim(), 250);
  const dqRef = useRef(dq);

  const showHistory = dq.length === 0;

  /* Load search history */
  useEffect(() => {
    try {
      const raw = localStorage.getItem('search.history.v1');
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  /* Focus input when opened */
  useEffect(() => {
    if (!isOpen) return;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  /* Cleanup on unmount */
  useEffect(() => () => abortRef.current?.abort(), []);

  /* Sync dq ref */
  useEffect(() => {
    dqRef.current = dq;
  }, [dq]);

  const runSearch = useCallback(async (query: string) => {
    const mySeq = ++seqRef.current;

    if (!query.trim()) {
      setItems([]);
      setActive(-1);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);

    try {
      const res = await searchPairs({
        q: query.trim(),
        chainId: 2741,
        resolution: '1d',
        index: 0,
        limit: 50
      });

      if (mySeq !== seqRef.current) return;

      const pairs: PairDTO[] = res?.pairs ?? [];

      const mapped = pairs.map(toItem);

      setItems(mapped);
      setActive(mapped.length ? 0 : -1);
    } catch {
      if (mySeq === seqRef.current) {
        setItems([]);
        setActive(-1);
      }
    } finally {
      if (mySeq === seqRef.current) setIsLoading(false);
    }
  }, []);

  /* Debounced search trigger */
  useEffect(() => {
    if (showHistory) {
      setItems([]);
      setActive(-1);
      return;
    }
    runSearch(dq);
  }, [dq, showHistory, runSearch]);

  /* Reset on close */
  useEffect(() => {
    if (!isOpen) {
      abortRef.current?.abort();
      seqRef.current++;
      setQ('');
      setItems([]);
      setActive(-1);
      setIsLoading(false);
    }
  }, [isOpen]);

  /* Pick token */
  const pick = (it: TokenSearchItem) => {
    const next = [it, ...history.filter((x) => x.id !== it.id)].slice(0, 20);
    setHistory(next);
    try {
      localStorage.setItem('search.history.v1', JSON.stringify(next));
    } catch {}

    onPick?.(it);
    onClose();
    router.push(`/token/${encodeURIComponent(it.pair_address)}`);
  };

  /* Keyboard navigation */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') onClose();
      if (!items.length) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((i) => Math.min(i + 1, items.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && active >= 0) {
        e.preventDefault();
        pick(items[active]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, items, active]);

  /* ---- UI ---- */
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
        {/* Search Bar */}
        <div className="flex w-full flex-col">
          <div className="mt-8 mb-2 w-[90%]">
            <div className="ml-10 flex h-14 items-center gap-3 rounded-xl border-2 border-white/25 px-4">
              <span aria-hidden className="text-white/70">
                {isLoading ? <Spinner variant="orbit" size={16} /> : <i className="fa-solid fa-magnifying-glass" />}
              </span>
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

        {/* Close Button */}
        <div className="absolute top-8 right-8">
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-white/10">
            <i className="fa-solid fa-xmark text-xl" />
          </button>
        </div>

        {/* Title */}
        <div className="mt-5 ml-10">
          <div className="py-3 text-3xl text-white/80">{showHistory ? 'History' : 'Results'}</div>
        </div>

        {/* Results */}
        <div
          className="scrollbar-emerald ml-7 max-h-[60vh] w-[90%] overflow-y-auto pr-1"
          key={showHistory ? 'history' : 'results'}
        >
          {showHistory ? (
            history.length === 0 ? (
              <div className="py-6 text-xl text-white/50">No recent searches.</div>
            ) : (
              history.map((it, idx) => (
                <ResultRow key={it.id} item={it} active={idx === active} onClick={() => pick(it)} />
              ))
            )
          ) : items.length === 0 ? (
            <div className="py-6 text-xl text-white/50">{isLoading ? 'Searching…' : 'No matches.'}</div>
          ) : (
            items.map((it, idx) => <ResultRow key={it.id} item={it} active={idx === active} onClick={() => pick(it)} />)
          )}
        </div>
      </div>
    </Modal>
  );
}

/* ---- Row ---- */
interface ResultRowProps {
  item: TokenSearchItem;
  active: boolean;
  onClick: () => void;
}

/* ---- Row ---- */
function ResultRow({ item, active, onClick }: ResultRowProps) {
  const abbrev = (addr?: string) =>
    !addr || addr.length <= 10 ? (addr ?? '—') : `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  const priceStr = item.price !== undefined ? `$${item.price.toFixed(6)}` : '—';
  const priceClass = priceStr.length > 14 ? 'text-xs' : priceStr.length > 10 ? 'text-sm' : 'text-xl';

  const mcStr = item.marketCap ?? '—';
  const mcClass = mcStr.length > 14 ? 'text-xs' : mcStr.length > 10 ? 'text-sm' : 'text-xl';

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-md border-b border-white/10 py-3 pr-3 pl-2 text-left hover:bg-white/5 ${
        active ? 'bg-white/10' : ''
      }`}
    >
      <Image
        src={'/images/icons/bela_token.svg'}
        width={48}
        height={48}
        alt=""
        className="h-12 w-12 shrink-0 rounded-md object-cover"
      />

      <div className="ml-2 grid w-full grid-cols-[40%_10%_25%_20%] items-start gap-3 text-white">
        {/* Symbol, Name, Address */}
        <div className="min-w-0">
          <div className="truncate text-sm">
            <span className="text-xl text-white">{item.symbol}</span>
            <span className="ml-2 text-lg text-white/50">{item.name}</span>
          </div>
          <div className="text-md truncate font-semibold text-white/50">{abbrev(item.token_address)}</div>
        </div>

        {/* Age */}
        <div className="min-w-0">
          <span className="inline-flex w-20 items-center justify-center rounded-xl bg-emerald-600/20 py-0.5 text-base text-white">
            <Image
              src="/images/icons/sprout.svg"
              width={16}
              height={16}
              alt=""
              className="mr-2 h-4 w-4 rounded-full object-cover"
            />
            <span>{item.ago ?? '—'}</span>
          </span>
        </div>

        {/* Price */}
        <div className="flex h-12 min-w-0 items-center justify-end">
          <span className={`truncate text-right leading-normal ${mcStr === '—' ? 'text-white/60' : ''} ${priceClass}`}>
            {priceStr}
          </span>
        </div>

        {/* Market Cap */}
        <div className="flex h-12 min-w-0 items-center justify-end">
          <span className={`truncate text-right leading-normal ${mcStr === '—' ? 'text-white/60' : ''} ${mcClass}`}>
            {mcStr}
          </span>
        </div>
      </div>
    </button>
  );
}
