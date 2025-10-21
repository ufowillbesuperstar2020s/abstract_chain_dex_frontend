'use client';
import * as React from 'react';
import Image from 'next/image';

type Props = {
  /** 0-based page index */
  index: number;
  /** total row count from API */
  total: number;
  /** page size */
  limit: number;
  /** loading state to disable controls */
  loading?: boolean;
  /** set page index (0-based) */
  onChange: (nextIndex: number) => void;
  /** how many siblings to show around current */
  siblingCount?: number;
};

export default function Pagination({ index, total, limit, loading, onChange, siblingCount = 1 }: Props) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / (limit || 1)));
  const current = Math.min(index + 1, totalPages); // 1-based for UX

  // Build items: [1, '…', 10, 11, 12, '…', 245]
  const items = React.useMemo<(number | '…')[]>(() => {
    const pages: (number | '…')[] = [];
    if (totalPages <= 7) {
      for (let p = 1; p <= totalPages; p++) pages.push(p);
      return pages;
    }
    const start = Math.max(2, current - siblingCount);
    const end = Math.min(totalPages - 1, current + siblingCount);

    pages.push(1);
    if (start > 2) pages.push('…');
    for (let p = start; p <= end; p++) pages.push(p);
    if (end < totalPages - 1) pages.push('…');
    pages.push(totalPages);
    return pages;
  }, [current, siblingCount, totalPages]);

  const [goto, setGoto] = React.useState<string>('');

  const go = (p: number) => {
    if (loading) return;
    const clamped = Math.min(Math.max(1, p), totalPages);
    onChange(clamped - 1); // convert back to 0-based
  };

  const canPrev = !loading && current > 1;
  const canNext = !loading && current < totalPages;

  return (
    <div className="flex w-full items-center justify-end">
      <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
        {/* Prev */}
        <button
          onClick={() => go(current - 1)}
          disabled={!canPrev}
          className="rounded-md px-2 py-1 hover:bg-white/10 disabled:opacity-40"
          aria-label="Previous page"
          title="Previous"
        >
          <i className="fa-solid fa-angle-left" />
        </button>

        {/* Page items */}
        <div className="flex items-center gap-2">
          {items.map((it, i) =>
            it === '…' ? (
              <span key={`e-${i}`} className="px-1 text-white/40">
                …
              </span>
            ) : (
              <button
                key={it}
                onClick={() => go(it)}
                className={
                  it === current
                    ? 'rounded-md bg-emerald-700/70 px-2 py-1 text-white'
                    : 'rounded-md px-2 py-1 hover:bg-white/10'
                }
              >
                {it}
              </button>
            )
          )}
        </div>

        {/* Next */}
        <button
          onClick={() => go(current + 1)}
          disabled={!canNext}
          className="rounded-md px-2 py-1 hover:bg-white/10 disabled:opacity-40"
          aria-label="Next page"
          title="Next"
        >
          <i className="fa-solid fa-angle-right" />
        </button>

        {/* Go to page */}
        <div className="ml-2 flex items-center gap-2">
          <span className="hidden sm:inline">Go to page</span>
          <input
            value={goto}
            onChange={(e) => setGoto(e.target.value.replace(/[^\d]/g, ''))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && goto) go(parseInt(goto, 10));
            }}
            placeholder={`${current}`}
            className="w-14 rounded-md border border-white/10 bg-black/20 px-2 py-1 text-white outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>
      </div>
    </div>
  );
}
