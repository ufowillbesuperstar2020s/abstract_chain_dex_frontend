'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import DropdownPortal from '@/components/common/DropdownPortal';

const INTERVALS = ['1s', '1m', '5m', '15m', '30m', '1h', '4h', '12h', '1d'] as const;
export type Interval = (typeof INTERVALS)[number];

type Props = {
  initial?: Interval;
  onChange?: (val: Interval) => void; // callback to wire TradingView resolution
};

export function IntervalDropdownUI({ initial = '1h' as Interval, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<Interval>(initial);

  const anchorRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [pos, setPos] = useState<{ top: number; left: number; w: number; h: number } | null>(null);
  const [dropUp, setDropUp] = useState(false);

  // Outside click — use mousedown, but stop it inside the menu (see menu onMouseDown below)
  useEffect(() => {
    const onDocDown = (e: MouseEvent) => {
      if (!anchorRef.current) return;
      if (!anchorRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, []);

  // Measure anchor and decide placement when opening; recompute on scroll/resize
  const measure = () => {
    if (!anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    setPos({ top: r.top, left: r.left, w: r.width, h: r.height });

    // If menu exists, decide whether to drop up or down based on viewport space
    const estimatedMenuH = menuRef.current?.offsetHeight ?? 200; // rough first pass
    const spaceBelow = window.innerHeight - (r.top + r.height);
    const spaceAbove = r.top;
    setDropUp(spaceBelow < estimatedMenuH && spaceAbove > spaceBelow);
  };

  useLayoutEffect(() => {
    if (!open) return;
    measure();
    const onScrollOrResize = () => measure();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize, true);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize, true);
    };
  }, [open]);

  //close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const select = (opt: Interval) => {
    setValue(opt);
    setOpen(false);
    onChange?.(opt);
  };

  return (
    <div className="ml-auto flex shrink-0 items-center gap-2 pr-3 text-base font-bold">
      <Image width={12} height={12} src="/images/icons/clock.png" alt="interval" className="h-3 w-3 object-cover" />

      <div ref={anchorRef} className="inline-flex">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-green-600 hover:bg-white/5 focus:outline-none"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span>{value}</span>
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className={`h-4 w-4 text-white/80 transition-transform ${open ? 'rotate-180' : ''}`}
          >
            <path
              fill="currentColor"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.17l3.71-2.94a.75.75 0 1 1 .94 1.17l-4.18 3.31a.75.75 0 0 1-.94 0L5.21 8.4a.75.75 0 0 1 .02-1.19z"
            />
          </svg>
        </button>
      </div>

      {open && pos && (
        <DropdownPortal>
          <div
            ref={menuRef}
            // prevent outside mousedown from firing when we click inside the menu
            onMouseDown={(e) => e.stopPropagation()}
            className="fixed z-[2147483647] w-24 rounded-md border border-white/10 bg-[#222] shadow-xl backdrop-blur"
            style={{
              // flip up if needed; otherwise drop down
              top: dropUp ? Math.max(8, pos.top - (menuRef.current?.offsetHeight ?? 200) - 8) : pos.top + pos.h + 8,
              left: pos.left + pos.w - 96, // align right edges (96px = w-24)
              maxHeight: dropUp
                ? Math.max(120, pos.top - 16) // space above
                : Math.max(120, window.innerHeight - (pos.top + pos.h) - 16), // space below
              overflowY: 'auto'
            }}
            role="dialog"
          >
            <ul role="listbox" className="py-1 text-sm text-white/90">
              {INTERVALS.map((opt) => (
                <li key={opt}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={opt === value}
                    onClick={() => select(opt)}
                    className={[
                      'block w-full px-3 py-1.5 text-left',
                      opt === value ? 'bg-white/10 text-green-400' : 'hover:bg-[rgb(119,136,159)]'
                    ].join(' ')}
                  >
                    {opt}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </DropdownPortal>
      )}
    </div>
  );
}
