'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

type Props = {
  storageKey: string;
  initialHeight?: number; // used if nothing in localStorage
  minHeight?: number;
  maxHeight?: number; // if omitted, defaults to ~85vh
  children: React.ReactNode;
  className?: string;
};

export default function ResizableSection({
  storageKey,
  initialHeight = 560,
  minHeight = 260,
  maxHeight,
  children,
  className = ''
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<HTMLDivElement | null>(null);

  const DEFAULT_INITIAL_HEIGHT = 560;
  const initH = initialHeight ?? DEFAULT_INITIAL_HEIGHT;

  const DEFAULT_MIN_HEIGHT = 260;
  const minH = minHeight ?? DEFAULT_MIN_HEIGHT;

  const [height, setHeight] = useState(initH);
  const [mounted, setMounted] = useState(false);

  const getMax = useCallback(() => {
    const base = typeof window !== 'undefined' ? Math.round(window.innerHeight * 0.85) : 800; // fallback for SSR
    return maxHeight && maxHeight > 0 ? maxHeight : base;
  }, [maxHeight]);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(`rsz:${storageKey}`);
      const h = saved ? parseInt(saved, 10) : initH;
      setHeight(clamp(h, minH, getMax()));
    } catch {
      // ignore localStorage errors
    }
  }, [getMax, initH, minH, storageKey]);

  const heightRef = useRef(height);
  useEffect(() => {
    heightRef.current = height;
    if (containerRef.current) containerRef.current.style.height = `${height}px`;
  }, [height]);

  useEffect(() => {
    const onResize = () => {
      const maxNow = maxHeight && maxHeight > 0 ? maxHeight : Math.round(window.innerHeight * 0.85);
      const clamped = clamp(heightRef.current, minHeight, maxNow);
      if (clamped !== heightRef.current) {
        heightRef.current = clamped;
        setHeight(clamped);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [minHeight, maxHeight]);

  const dragState = useRef<{
    startY: number;
    startHeight: number;
    raf: number | null;
    dragging: boolean;
  }>({ startY: 0, startHeight: 0, raf: null, dragging: false });

  const scheduleSetHeight = (next: number) => {
    const st = dragState.current;
    if (st.raf != null) return;
    st.raf = requestAnimationFrame(() => {
      st.raf = null;
      heightRef.current = next;
      if (containerRef.current) {
        containerRef.current.style.height = `${next}px`;
      }
    });
  };

  const onMouseMove = useCallback(
    (e: globalThis.MouseEvent) => {
      const st = dragState.current;
      if (!st.dragging) return;
      e.preventDefault();
      const delta = e.clientY - st.startY;
      const maxNow = maxHeight && maxHeight > 0 ? maxHeight : Math.round(window.innerHeight * 0.85);
      const next = clamp(st.startHeight + delta, minHeight, maxNow);
      scheduleSetHeight(next);
    },
    [minHeight, maxHeight]
  );

  // Give endDrag a MouseEvent parameter so it's directly usable as a DOM listener.
  const endDrag: (e?: globalThis.MouseEvent) => void = useCallback(() => {
    const st = dragState.current;
    if (!st.dragging) return;

    st.dragging = false;
    if (st.raf != null) {
      cancelAnimationFrame(st.raf);
      st.raf = null;
    }
    window.removeEventListener('mousemove', onMouseMove, { capture: true });
    window.removeEventListener('mouseup', endDrag, { capture: true });

    const finalH = containerRef.current ? containerRef.current.getBoundingClientRect().height : heightRef.current;

    const maxNow = maxHeight && maxHeight > 0 ? maxHeight : Math.round(window.innerHeight * 0.85);
    const clamped = clamp(Math.round(finalH), minHeight, maxNow);
    setHeight(clamped);
    try {
      localStorage.setItem(`rsz:${storageKey}`, String(clamped));
    } catch {}

    if (overlayRef.current) overlayRef.current.style.display = 'none';
    handleRef.current?.classList.remove('dragging');

    window.dispatchEvent(new Event('resize'));
  }, [minHeight, maxHeight, onMouseMove, storageKey]);

  const onMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    const box = containerRef.current?.getBoundingClientRect();
    dragState.current.startY = e.clientY;
    dragState.current.startHeight = box ? box.height : heightRef.current;
    dragState.current.dragging = true;

    if (overlayRef.current) overlayRef.current.style.display = 'block';
    handleRef.current?.classList.add('dragging');

    // Use capture so drag remains responsive even if children stop propagation.
    window.addEventListener('mousemove', onMouseMove, { capture: true });
    window.addEventListener('mouseup', endDrag, { capture: true });
  };

  return (
    <div
      className={`relative w-full select-none ${className}`}
      ref={containerRef}
      suppressHydrationWarning
      style={{ height: mounted ? height : initH }}
    >
      {/* content area */}
      <div className="absolute inset-0 overflow-hidden">{children}</div>

      {/* --- resize handle (no gradient; slim gutter + center pill) --- */}
      <div
        ref={handleRef}
        onMouseDown={onMouseDown}
        title="Drag to resize chart"
        className="group absolute inset-x-0 bottom-0 z-50 h-4 cursor-ns-resize"
        style={{
          bottom: '-12px',
          background: 'transparent',
          boxShadow: 'inset 0 1px 0 #1f2937, inset 0 -1px 0 #1f2937'
        }}
      >
        {/* full-width pill */}
        <div className="pointer-events-none absolute inset-0 flex items-center">
          <div className="pill mx-3 h-[3px] w-full rounded-full transition-all" />
        </div>

        {/* centered dots */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span
            className="dots inline-block leading-none select-none"
            style={{
              fontSize: 18,
              letterSpacing: 2,
              opacity: 0.98,
              textShadow: '0 1px 0 rgba(0,0,0,.35)'
            }}
            aria-hidden="true"
          >
            •••
          </span>
        </div>
      </div>

      {/* style the pill states */}
      <style jsx>{`
        /* Pill: darker baseline so dots pop */
        .group .pill {
          background: #334155; /* slate-700 */
          opacity: 0.95;
        }
        .group:hover .pill {
          background: #475569; /* slate-600 */
        }
        .group.dragging .pill {
          background: #94a3b8;
          opacity: 1;
        }

        /* Dots: very light for high contrast */
        .group .dots {
          transform-origin: center;
          color: #e5e7eb; /* gray-200 */
        }
        .group:hover .dots {
          color: #f3f4f6; /* gray-100 */
        }
        .group.dragging .dots {
          color: #ffffff;
          transform: scale(1.06);
          opacity: 1;
        }
      `}</style>

      {/* full-screen overlay to capture events during drag */}
      <div ref={overlayRef} style={{ display: 'none' }} className="fixed inset-0 z-[60] cursor-ns-resize" />
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
