'use client';

import * as React from 'react';
import Pagination from '@/components/explore/Pagination';

type Props = {
  index: number;
  total: number;
  limit: number;
  loading?: boolean;
  onChange: (next: number) => void; // 0-based page change
  onPageSizeChange?: (newLimit: number) => void;
  children?: React.ReactNode;
};

export default function FixedFooter({ index, total, limit, loading, onChange, onPageSizeChange, children }: Props) {
  const pageSizeOptions = [10, 20, 50, 100, 200, 500];

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#1a1a1a]">
      <div className="mx-auto w-full max-w-[1400px] px-4">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Total results */}
          <div className="text-xs text-white/60">
            {total ? <span>{Intl.NumberFormat().format(total)} results</span> : <span>&nbsp;</span>}
          </div>

          {/* Pagination */}
          <div className="flex flex-1 items-center justify-center">
            <Pagination
              index={index}
              total={total}
              limit={limit}
              loading={loading}
              onChange={onChange}
              siblingCount={1}
            />
          </div>

          {/* Page size selector */}
          <div className="flex items-center gap-3">
            <div className="flex items-center text-xs text-white/70">
              <select
                value={limit}
                onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
                className="h-8 rounded-md border border-white/10 bg-[#2a2a2a] px-2 text-white outline-none hover:border-white/20"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span className="ml-2 text-white/60">Items per page</span>
            </div>

            {/* Right slot ( “Go to page”) */}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
